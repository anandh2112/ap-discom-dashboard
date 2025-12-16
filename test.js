const express = require('express');
const router = express.Router();
const pool = require('./dbpg.js');

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT
                scno,
                short_name,
                DATE(ts) AS day,
                ARRAY_AGG(wh_imp ORDER BY ts ASC) AS values48
            FROM ht_blp
            GROUP BY scno, short_name, DATE(ts)
            ORDER BY scno, day;
        `;

        const { rows } = await pool.query(query);

        if (!rows.length) {
            return res.status(404).json({ message: 'No data found' });
        }

        const consumers = {};

        for (const r of rows) {
            if (!consumers[r.scno]) {
                consumers[r.scno] = {
                    name: r.short_name || "Unknown",
                    days: []
                };
            }

            consumers[r.scno].days.push({
                date: r.day,
                values48: r.values48.map(v => v ?? 0)
            });
        }

        function pad(n) {
            return n.toString().padStart(2, '0');
        }

        function formatSlot(startHour) {
            const endHour = (startHour + 12) % 24;
            return `${pad(startHour)}:00 - ${pad(endHour)}:00`;
        }

        function classifyDay(values48) {
            if (!values48 || values48.length === 0) {
                return { type: "random" };
            }

            const hourly = new Array(24).fill(0);
            for (let i = 0; i < 24; i++) {
                const v1 = values48[i * 2] || 0;
                const v2 = values48[i * 2 + 1] || 0;
                hourly[i] = (v1 + v2) / 1000;
            }

            const total = hourly.reduce((a, b) => a + b, 0);
            if (total === 0) return { type: "random" };

            const avg = total / 24;
            const low = avg * 0.85;
            const high = avg * 1.15;

            let within = 0;
            for (const h of hourly) {
                if (h >= low && h <= high) within++;
            }

            if (within >= 18) return { type: "flat" };

            const extended = hourly.concat(hourly);

            let bestWindow = null;
            let bestSum = 0;

            for (let start = 0; start < 24; start++) {
                let sum = 0;
                for (let i = start; i < start + 12; i++) {
                    sum += extended[i];
                }

                if (sum >= total * 0.9 && sum > bestSum) {
                    bestSum = sum;
                    bestWindow = start;
                }
            }

            if (bestWindow !== null) {
                return {
                    type: "shift",
                    slot: formatSlot(bestWindow)
                };
            }

            return { type: "random" };
        }

        const final = [];

        for (const [scno, c] of Object.entries(consumers)) {
            let flat = 0, shift = 0, random = 0;
            const shiftSlots = {};

            for (const d of c.days) {
                const result = classifyDay(d.values48);

                if (result.type === "flat") {
                    flat++;
                } else if (result.type === "shift") {
                    shift++;
                    shiftSlots[result.slot] = (shiftSlots[result.slot] || 0) + 1;
                } else {
                    random++;
                }
            }

            let dominantShiftSlot = null;
            let maxCount = 0;

            for (const [slot, count] of Object.entries(shiftSlots)) {
                if (count > maxCount) {
                    maxCount = count;
                    dominantShiftSlot = slot;
                }
            }

            final.push({
                SCNO: scno,
                Consumer: c.name,
                DaysOfData: c.days.length,
                PatternCounts: { flat, shift, random },
                ShiftWindow: dominantShiftSlot
            });
        }

        return res.json(final);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;