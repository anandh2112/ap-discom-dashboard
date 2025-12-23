const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

function formatLocalTS(ts) {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatLocalDate(d) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n) {
  return n.toString().padStart(2, '0');
}

router.get('/', async (req, res) => {
  try {
    const { scno } = req.query;
    if (!scno) {
      return res.status(400).json({ message: "Missing scno" });
    }

    const dateQuery = `
      SELECT DISTINCT ts::date AS dt
      FROM ht_blp
      WHERE scno = $1
      ORDER BY dt ASC;
    `;
    const dateResult = await pool.query(dateQuery, [scno]);

    if (dateResult.rows.length === 0) {
      return res.status(404).json({ message: "No data found for this SCNO" });
    }

    const dataQuery = `
      SELECT ts, wh_imp
      FROM ht_blp
      WHERE scno = $1
      ORDER BY ts ASC;
    `;
    const result = await pool.query(dataQuery, [scno]);

    const whMap = new Map();
    for (const row of result.rows) {
      whMap.set(formatLocalTS(row.ts), row.wh_imp);
    }

    const hourlySum = Array(24).fill(0);
    const hourlyCount = Array(24).fill(0);

    for (const r of dateResult.rows) {
      const currentDate = new Date(r.dt);
      const formattedDate = formatLocalDate(currentDate);

      for (let hour = 0; hour < 24; hour++) {
        const halfHourKey = `${formattedDate} ${pad(hour)}:30:00`;

        let nextHourKey;
        if (hour === 23) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(nextDay.getDate() + 1);
          nextHourKey = `${formatLocalDate(nextDay)} 00:00:00`;
        } else {
          nextHourKey = `${formattedDate} ${pad(hour + 1)}:00:00`;
        }

        const val1 = whMap.get(halfHourKey);
        const val2 = whMap.get(nextHourKey);

        if (val1 !== undefined || val2 !== undefined) {
          const v1 = val1 ?? 0;
          const v2 = val2 ?? 0;
          const kWh = (v1 + v2) / 1000;

          hourlySum[hour] += kWh;
          hourlyCount[hour] += 1;
        }
      }
    }

    const hourlyAvg = Array(24).fill(null);
    for (let i = 0; i < 24; i++) {
      if (hourlyCount[i] > 0) {
        hourlyAvg[i] = hourlySum[i] / hourlyCount[i];
      }
    }

    const peakRanges = [
      [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
      [17, 18], [18, 19], [19, 20], [20, 21], [21, 22]
    ];

    const resultObj = {};

    for (const [h1, h2] of peakRanges) {
      const v1 = hourlyAvg[h1];
      const v2 = hourlyAvg[h2];

      if (v1 !== null && v2 !== null && v1 !== 0) {
        const pctChange = ((v2 - v1) / v1) * 100;

        resultObj[`${pad(h1)}:00 - ${pad(h2)}:00`] =
          `${pctChange.toFixed(0)}%`;
      }
    }

    return res.json(resultObj);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;