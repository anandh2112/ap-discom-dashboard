const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

function formatLocalTS(ts) {
    const d = new Date(ts);
    const pad = (n) => n.toString().padStart(2, '0');
    return (
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
        `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
}

function formatLocalDate(d) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const pad = (n) => n.toString().padStart(2, '0');

router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT scno, short_name, ts, wh_imp
            FROM ht_blp
            ORDER BY ts ASC;
        `;
        const result = await pool.query(query);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ message: "Dataset empty" });
        }

        const consumers = {};

        for (const row of rows) {
            const key = row.scno;
            if (!consumers[key]) {
                consumers[key] = {
                    shortName: row.short_name || "Unknown",
                    whMap: new Map(),
                };
            }
            consumers[key].whMap.set(formatLocalTS(row.ts), row.wh_imp);
        }

        const allResults = [];

        for (const [scno, data] of Object.entries(consumers)) {
            const { shortName, whMap } = data;
            const timestamps = Array.from(whMap.keys()).map((t) => new Date(t));
            timestamps.sort((a, b) => a - b);

            const startDate = new Date(formatLocalDate(timestamps[0]));
            const endDate = new Date(formatLocalDate(timestamps[timestamps.length - 1]));

            let flat = 0;
            let day = 0;
            let night = 0;
            let random = 0;

            let currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dateStr = formatLocalDate(currentDate);
                const hourlyConsumption = [];

                for (let hour = 0; hour < 24; hour++) {
                    const halfHourKey = `${dateStr} ${pad(hour)}:30:00`;
                    let nextHourKey;
                    if (hour === 23) {
                        const nextDay = new Date(currentDate);
                        nextDay.setDate(currentDate.getDate() + 1);
                        nextHourKey = `${formatLocalDate(nextDay)} 00:00:00`;
                    } else {
                        nextHourKey = `${dateStr} ${pad(hour + 1)}:00:00`;
                    }

                    const val1 = whMap.get(halfHourKey);
                    const val2 = whMap.get(nextHourKey);

                    if (val1 !== undefined || val2 !== undefined) {
                        const v1 = val1 ?? 0;
                        const v2 = val2 ?? 0;
                        const consumption = (v1 + v2) / 1000;
                        hourlyConsumption.push({
                            hour,
                            consumption: parseFloat(consumption.toFixed(2)),
                        });
                    }
                }

                if (hourlyConsumption.length > 0) {
                    let stableCount = 0;
                    for (let i = 1; i < hourlyConsumption.length; i++) {
                        const prev = hourlyConsumption[i - 1].consumption;
                        const curr = hourlyConsumption[i].consumption;
                        if (curr >= prev * 0.8 && curr <= prev * 1.2) {
                            stableCount++;
                        }
                    }
                    const isFlat = stableCount >= 18;

                    const dayHours = hourlyConsumption.filter(h => h.hour >= 6 && h.hour < 18);
                    const nightHours = hourlyConsumption.filter(h => h.hour >= 18 || h.hour < 6);

                    const total = hourlyConsumption.reduce((a, b) => a + b.consumption, 0);
                    const totalDay = dayHours.reduce((a, b) => a + b.consumption, 0);
                    const totalNight = nightHours.reduce((a, b) => a + b.consumption, 0);

                    const pctDay = (totalDay / total) * 100;
                    const pctNight = (totalNight / total) * 100;

                    if (isFlat) {
                        flat++;
                    } else if (pctDay >= 80) {
                        day++;
                    } else if (pctNight >= 80) {
                        night++;
                    } else {
                        random++;
                    }
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            const x = whMap.size;
            const y = x / 2;
            const z = y / 24;

            allResults.push({
                SCNO: scno,
                Consumer: shortName,
                DaysOfData: Math.round(z),
                PatternCounts: {
                    flat,
                    day,
                    night,
                    random
                }
            });
        }

        return res.json(allResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;