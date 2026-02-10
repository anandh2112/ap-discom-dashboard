const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

router.get('/', async (req, res) => {
   try {
     const { scno, year } = req.query;

     if (!scno || !year) {
         return res.status(400).json({ message: 'Missing required parameters: scno and year' });
     }

     const result = await pool.query(
        `SELECT
            TO_CHAR(ts, 'YYYY-MM') AS month,
            MAX(va_imp) AS highest_va_imp
         FROM peak_demand
         WHERE scno = $1 AND TO_CHAR(ts, 'YYYY') = $2
         GROUP BY month
         ORDER BY month ASC;`,
        [scno, year]
     );

     if (result.rows.length === 0) {
        return res.status(404).json({ message: 'No data found for given scno and year' });
     }

     const monthMap = {};

     result.rows.forEach(row => {
        // Convert VA → kVA
        const kvaValue = parseFloat(row.highest_va_imp) / 1000;

        monthMap[row.month] = parseFloat(kvaValue.toFixed(2));
     });

     const response = {
        MonthlyHighestVA: monthMap
     };

     res.json(response);

   } catch (error) {
     console.error(error);
     res.status(500).json({ message: 'Internal Server Error' });
   }
});

module.exports = router;