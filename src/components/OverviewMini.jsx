export default function OverviewMini() {
  const cards = [
    { title: "Active Consumers", value: "1,240" },
    { title: "Total Consumption", value: "8,650 kWh" },
    { title: "Peak Demand", value: "430 kW" },
    { title: "Energy Savings", value: "12.5%" },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white shadow-md rounded-2xl p-1 flex items-center justify-center gap-5"
        >
          <p className="text-gray-500 text-xs">{card.title}</p>
          <h2 className="text-sm font-semibold">{card.value}</h2>
        </div>
      ))}
    </div>
  )
}
