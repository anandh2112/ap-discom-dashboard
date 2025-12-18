const express = require('express');
const router = express.Router();
const pool = require('./dbpg.js');

router.get('/', async (req, res) => {
    try {
        const selectedType = (req.query.type || "").toLowerCase();
        const validTypes = ["flat", "shift", "random"];

        if (!validTypes.includes(selectedType)) {
            return res.status(400).json({ message: "Invalid type. Use flat/shift/random" });
        }

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
        if (rows.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        const consumers = {};

        for (const row of rows) {
            if (!consumers[row.scno]) {
                consumers[row.scno] = {
                    name: row.short_name || "Unknown",
                    days: [],
                    shiftSlots: {}
                };
            }

            consumers[row.scno].days.push({
                date: row.day,
                values48: row.values48.map(v => v ?? 0)
            });
        }

        function classifyDay(values48) {
            if (!values48 || values48.length !== 48) {
                return { type: "random" };
            }

            const hourly = [];
            for (let i = 0; i < 24; i++) {
                hourly[i] = ((values48[i * 2] || 0) + (values48[i * 2 + 1] || 0)) / 1000;
            }

            const total = hourly.reduce((a, b) => a + b, 0);
            if (total === 0) return { type: "random" };

            // FLAT
            const avg = total / 24;
            const low = avg * 0.85;
            const high = avg * 1.15;

            let within = 0;
            for (const h of hourly) {
                if (h >= low && h <= high) within++;
            }
            if (within >= 18) return { type: "flat" };

            for (let start = 0; start < 24; start++) {
                let sum = 0;
                for (let i = 0; i < 12; i++) {
                    sum += hourly[(start + i) % 24];
                }

                if (sum >= total * 0.9) {
                    const end = (start + 12) % 24;
                    const slot = `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`;
                    return { type: "shift", slot };
                }
            }

            return { type: "random" };
        }

        const consumerStats = [];

        for (const [scno, c] of Object.entries(consumers)) {
            let flat = 0, shift = 0, random = 0;

            for (const d of c.days) {
                const result = classifyDay(d.values48);

                if (result.type === "flat") flat++;
                else if (result.type === "shift") {
                    shift++;
                    if (result.slot) {
                        c.shiftSlots[result.slot] = (c.shiftSlots[result.slot] || 0) + 1;
                    }
                } else {
                    random++;
                }
            }

            const totalDays = c.days.length;
            const percentages = {
                flat: flat / totalDays,
                shift: shift / totalDays,
                random: random / totalDays
            };

            let dominantShiftSlot = null;
            if (Object.keys(c.shiftSlots).length > 0) {
                dominantShiftSlot = Object.entries(c.shiftSlots)
                    .sort((a, b) => b[1] - a[1])[0][0];
            }

            consumerStats.push({
                scno,
                name: c.name,
                percentages,
                dominantShiftSlot
            });
        }

        const filtered = consumerStats
            .filter(c => {
                const p = c.percentages;
                const maxKey = Object.keys(p).reduce((a, b) => p[a] > p[b] ? a : b);
                return maxKey === selectedType;
            })
            .map(c => ({
                SCNO: c.scno,
                Consumer: c.name,
                Percentage: Number((c.percentages[selectedType] * 100).toFixed(2)),
                ...(selectedType === "shift" && c.dominantShiftSlot
                    ? { ShiftWindow: c.dominantShiftSlot }
                    : {})
            }))
            .sort((a, b) => a.SCNO.localeCompare(b.SCNO));

        res.json(filtered);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;