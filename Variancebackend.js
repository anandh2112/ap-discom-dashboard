const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

function formatLocalTS(ts) {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT scno, short_name, ts, wh_imp
      FROM ht_blp
      ORDER BY scno, ts ASC;
    `;
    const result = await pool.query(query);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No data found in ht_blp table' });
    }

    const dataByScno = {};
    for (const row of rows) {
      if (!dataByScno[row.scno]) {
        dataByScno[row.scno] = { short_name: row.short_name, readings: [] };
      }
      dataByScno[row.scno].readings.push({
        ts: formatLocalTS(row.ts),
        wh_imp: row.wh_imp,
      });
    }

    const pad = (n) => n.toString().padStart(2, '0');
    const results = {};

    // Process each SCNO
    for (const [scno, { short_name, readings }] of Object.entries(dataByScno)) {
      const whMap = new Map();
      for (const { ts, wh_imp } of readings) {
        whMap.set(ts, wh_imp);
      }

      const timestamps = Array.from(whMap.keys()).sort();
      if (timestamps.length < 2) continue;

      const hourlySums = new Map();

      // Build map of hourly consumptions (average of two consecutive half-hour readings)
      for (let i = 0; i < timestamps.length - 1; i++) {
        const t1 = new Date(timestamps[i]);
        const t2 = new Date(timestamps[i + 1]);
        const hour = t1.getHours();
        const diff = (t2 - t1) / (1000 * 60); // difference in minutes

        // Consider only 30 or 60 min steps to reduce noise
        if (diff >= 25 && diff <= 35 || diff >= 55 && diff <= 65) {
          const val1 = whMap.get(timestamps[i]) ?? 0;
          const val2 = whMap.get(timestamps[i + 1]) ?? 0;
          const existing = hourlySums.get(hour) || 0;
          hourlySums.set(hour, existing + (val2 - val1 > 0 ? val2 - val1 : 0));
        }
      }

      const hourlyArray = [];
      for (let hour = 0; hour < 24; hour++) {
        hourlyArray.push({
          hour: `${pad(hour)}:00`,
          consumption: hourlySums.get(hour) || 0,
        });
      }

      if (hourlyArray.length === 0) continue;

      const high = hourlyArray.reduce((a, b) => (b.consumption > a.consumption ? b : a));
      const low = hourlyArray.reduce((a, b) => (b.consumption < a.consumption ? b : a));
      const totalConsumption = hourlyArray.reduce((sum, e) => sum + e.consumption, 0);
      const avgConsumption = totalConsumption / hourlyArray.length;

      const percentIncrease = ((high.consumption - avgConsumption) / avgConsumption) * 100;
      const percentDecrease = ((avgConsumption - low.consumption) / avgConsumption) * 100;

      results[scno] = {
        name: short_name,
        high: {
          hour: high.hour,
          consumption: parseFloat(high.consumption.toFixed(2)),
          percent_increase_from_avg: parseFloat(percentIncrease.toFixed(2)),
        },
        low: {
          hour: low.hour,
          consumption: parseFloat(low.consumption.toFixed(2)),
          percent_decrease_from_avg: parseFloat(percentDecrease.toFixed(2)),
        },
        average: {
          consumption: parseFloat(avgConsumption.toFixed(2)),
        },
      };
    }

    return res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;