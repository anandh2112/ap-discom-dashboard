const express = require('express');
const router = express.Router();
const pool = require('./dbpg.js');

function formatLocalDate(d) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

router.get('/', async (req, res) => {
    try {
        const selectedType = (req.query.type || "").toLowerCase();
        const validTypes = ["flat", "day", "night", "random"];

        if (!validTypes.includes(selectedType)) {
            return res.status(400).json({ message: "Invalid type. Use flat/day/night/random" });
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

        const result = await pool.query(query);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ message: "No data found" });
        }

        const consumers = {};

        for (const row of rows) {
            if (!consumers[row.scno]) {
                consumers[row.scno] = {
                    name: row.short_name || "Unknown",
                    days: []
                };
            }

            consumers[row.scno].days.push({
                date: row.day,
                values48: row.values48.map(v => v ?? 0)
            });
        }

        function classifyDay(values48) {
            if (!values48 || values48.length === 0) return "random";

            const hourly = new Array(24).fill(0);
            for (let i = 0; i < 24; i++) {
                const v1 = values48[i * 2] || 0;
                const v2 = values48[i * 2 + 1] || 0;
                hourly[i] = (v1 + v2) / 1000;
            }

            const total = hourly.reduce((a, b) => a + b, 0);
            if (total === 0) return "random";

            const avg = total / 24;
            const low = avg * 0.85;
            const high = avg * 1.15;

            let withinRange = 0;
            for (let h of hourly) {
                if (h >= low && h <= high) withinRange++;
            }

            if (withinRange >= 18) return "flat";

            const dayHours = hourly.slice(9, 21);
            const nightHours = [...hourly.slice(21), ...hourly.slice(0, 9)];

            const tDay = dayHours.reduce((a, b) => a + b, 0);
            const tNight = nightHours.reduce((a, b) => a + b, 0);

            if (tDay >= total * 0.80) return "day";
            if (tNight >= total * 0.80) return "night";

            return "random";
        }

        const consumerStats = [];

        for (const [scno, c] of Object.entries(consumers)) {
            let flat = 0, day = 0, night = 0, random = 0;

            for (const d of c.days) {
                const type = classifyDay(d.values48);
                if (type === "flat") flat++;
                else if (type === "day") day++;
                else if (type === "night") night++;
                else random++;
            }

            const totalDays = c.days.length;

            consumerStats.push({
                scno,
                name: c.name,
                totalDays,
                counts: { flat, day, night, random },
                percentages: {
                    flat: flat / totalDays,
                    day: day / totalDays,
                    night: night / totalDays,
                    random: random / totalDays
                }
            });
        }

        let maxCount = 0;
        for (const c of consumerStats) {
            if (c.counts[selectedType] > maxCount) {
                maxCount = c.counts[selectedType];
            }
        }

        const filtered = consumerStats
            .filter(c => c.counts[selectedType] === maxCount && maxCount > 0)
            .map(c => ({
                SCNO: c.scno,
                Consumer: c.name,
                DaysInCategory: c.counts[selectedType],
                Percentage: Number((c.percentages[selectedType] * 100).toFixed(2))
            }))
            .sort((a, b) => a.SCNO.localeCompare(b.SCNO));

        return res.json(filtered);

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;