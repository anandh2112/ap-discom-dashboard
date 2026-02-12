const express = require('express');
const pool = require('./dbpg.js');
const router = express.Router();

router.get('/', async (req, res) => {
    try {

        const query = `
            SELECT scno, peak_1, peak_2, off_peak, normal
            FROM cons_tariff;
        `;

        const result = await pool.query(query);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No tariff data found' });
        }

        const tariffCounts = {
            'Peak': 0,
            'Off-Peak': 0,
            'Normal': 0
        };

        for (const row of rows) {
            const { peak_1, peak_2, off_peak, normal } = row;

            const peakTotal = (Number(peak_1) || 0) + (Number(peak_2) || 0);
            const offPeakTotal = Number(off_peak) || 0;
            const normalTotal = Number(normal) || 0;

            const bucketData = {
                'Peak': peakTotal,
                'Off-Peak': offPeakTotal,
                'Normal': normalTotal
            };

            let maxTariff = null;
            let maxVal = -Infinity;

            for (const [tariff, val] of Object.entries(bucketData)) {
                if (val > maxVal) {
                    maxVal = val;
                    maxTariff = tariff;
                }
            }

            if (maxTariff) tariffCounts[maxTariff]++;
        }

        const totalConsumers = rows.length;

        const tariffPercentages = {};

        for (const [tariff, count] of Object.entries(tariffCounts)) {
            tariffPercentages[tariff] =
                ((count / totalConsumers) * 100).toFixed(2) + '%';
        }

        return res.json({
            TotalConsumers: totalConsumers,
            HighConsumptionTariffCounts: tariffCounts,
            HighConsumptionTariffPercentages: tariffPercentages
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;