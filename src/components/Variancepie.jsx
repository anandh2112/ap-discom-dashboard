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
        showInLegend: false,            // hide legend
        connectorWidth: 0,              // remove connector lines
      },
    },
  });

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
        <HighchartsReact highcharts={Highcharts} options={createOptions("Peak Variance", peakData)} />
      </div>
      <div className="w-full md:w-1/2 bg-white p-4 rounded-lg shadow-md">
        <HighchartsReact highcharts={Highcharts} options={createOptions("Low Variance", lowData)} />
      </div>
    </div>
  );
}
