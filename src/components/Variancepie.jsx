import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function VariancePie() {
  const peakData = [
    { name: "30-40%", y: 5 },
    { name: "40-50%", y: 10 },
    { name: "50-60%", y: 15 },
    { name: "60-70%", y: 20 },
    { name: "70-80%", y: 10 },
    { name: "80-90%", y: 8 },
    { name: "90-100%", y: 12 },
    { name: "100-110%", y: 10 },
    { name: "110-120%", y: 10 },
  ];

  const lowData = [
    { name: "30-40%", y: 8 },
    { name: "40-50%", y: 12 },
    { name: "50-60%", y: 18 },
    { name: "60-70%", y: 15 },
    { name: "70-80%", y: 10 },
    { name: "80-90%", y: 7 },
    { name: "90-100%", y: 10 },
    { name: "100-110%", y: 10 },
    { name: "110-120%", y: 10 },
  ];

  const createOptions = (title, data) => ({
    chart: { type: "pie" },
    title: { text: title, style: { fontSize: "14px" } },
    series: [
      {
        name: "Variance %",
        data,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false }, // hide legend
    plotOptions: {
      pie: {
        dataLabels: { enabled: false }, // hide values
        showInLegend: false, // hide legend
        connectorWidth: 0, // remove connector lines
      },
    },
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Row of Pie Charts */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Peak Variance", peakData)}
          />
        </div>
        <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
          <HighchartsReact
            highcharts={Highcharts}
            options={createOptions("Low Variance", lowData)}
          />
        </div>
      </div>

      {/* Summary Table Below Charts */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-center font-semibold text-gray-700 mb-3 text-sm">
          Variance Summary
        </h3>
        <table className="w-full text-sm text-center border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">Variance</th>
              <th className="border px-2 py-1">Highest</th>
              <th className="border px-2 py-1">Lowest</th>
              <th className="border px-2 py-1">Median</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1 font-medium">Peak</td>
              <td className="border px-2 py-1">
                70% <span className="text-gray-500 text-xs">(ELR027)</span>
              </td>
              <td className="border px-2 py-1">
                30% <span className="text-gray-500 text-xs">(ELR1140)</span>
              </td>
              <td className="border px-2 py-1">55%</td>
            </tr>
            <tr>
              <td className="border px-2 py-1 font-medium">Low</td>
              <td className="border px-2 py-1">
                65% <span className="text-gray-500 text-xs">(ELR027)</span>
              </td>
              <td className="border px-2 py-1">
                35% <span className="text-gray-500 text-xs">(ELR1140)</span>
              </td>
              <td className="border px-2 py-1">50%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
