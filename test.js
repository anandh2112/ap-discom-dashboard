const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

// --- Helper to format timestamp ---
function formatLocalTS(ts) {
  const d = new Date(ts);
  const pad = (n) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// --- Helper to format date as YYYY-MM-DD ---
function formatLocalDate(d) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// --- Tariff classification ---
function getTariffBucket(hour) {
  if ((hour >= 6 && hour < 10) || (hour >= 18 && hour < 22)) return 'Peak';
  if ((hour >= 0 && hour < 6) || (hour >= 10 && hour < 15)) return 'Off-Peak';
  return 'Normal';
}

router.get('/', async (req, res) => {
  try {
    const { scno, month } = req.query;
    if (!scno || !month) {
      return res.status(400).json({ message: 'Missing scno or month' });
    }

    // Example: month = "2025-10"
    const startDate = new Date(`${month}-01 00:30:00`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1, 0, 30, 0);

    const query = `
      SELECT ts, wh_imp
      FROM ht_blp
      WHERE scno = $1 AND ts >= $2 AND ts < $3
      ORDER BY ts ASC;
    `;
    const result = await pool.query(query, [scno, startDate, endDate]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No readings found for this month' });
    }

    // --- Step 1: Determine total weeks in this month ---
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const totalWeeks = Math.ceil(daysInMonth / 7);

    // Initialize structure like:
    // Week-1: { totalConsumption: 0, Peak: 0, Normal: 0, Off-Peak: 0 }
    const weeklyConsumption = {};
    for (let i = 1; i <= totalWeeks; i++) {
      weeklyConsumption[`Week-${i}`] = {
        totalConsumption: 0,
        Peak: 0,
        Normal: 0,
        'Off-Peak': 0
      };
    }

    // --- Step 2: Create a map of timestamps for faster access ---
    const whMap = new Map();
    for (const row of rows) {
      const formattedTs = formatLocalTS(row.ts);
      whMap.set(formattedTs, row.wh_imp);
    }

    const pad = (n) => n.toString().padStart(2, '0');

    // --- Step 3: Iterate day by day and hour by hour ---
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), d);
      const formattedCurrentDate = formatLocalDate(currentDate);
      const weekNumber = Math.ceil(d / 7);
      const weekKey = `Week-${weekNumber}`;

      for (let hour = 0; hour < 24; hour++) {
        const halfHourKey = `${formattedCurrentDate} ${pad(hour)}:30:00`;
        let nextHourKey;

        if (hour === 23) {
          const nextDay = new Date(currentDate);
          nextDay.setDate(currentDate.getDate() + 1);
          const formattedNextDay = formatLocalDate(nextDay);
          nextHourKey = `${formattedNextDay} 00:00:00`;
        } else {
          nextHourKey = `${formattedCurrentDate} ${pad(hour + 1)}:00:00`;
        }

        const val1 = whMap.get(halfHourKey);
        const val2 = whMap.get(nextHourKey);

        if (val1 !== undefined || val2 !== undefined) {
          const v1 = val1 ?? 0;
          const v2 = val2 ?? 0;
          const consumption = (v1 + v2) / 1000; // Wh → kWh

          const bucket = getTariffBucket(hour);
          weeklyConsumption[weekKey][bucket] += consumption;
          weeklyConsumption[weekKey].totalConsumption += consumption;
        }
      }
    }

    // --- Step 4: Round values to 2 decimals ---
    for (const week in weeklyConsumption) {
      for (const key in weeklyConsumption[week]) {
        weeklyConsumption[week][key] = parseFloat(weeklyConsumption[week][key].toFixed(2));
      }
    }

    // ✅ Final response
    res.json(weeklyConsumption);

  } catch (error) {
    console.error('Error in fetchConsumerWiseMonthWiseWeeklyTariffBasedConsumption:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;