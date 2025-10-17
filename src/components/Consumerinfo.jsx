export default function ConsumerInfo({ consumerName, scno }) {
  // Updated cards
  const infoCards = [
    {
      title: 'Consumer',
      value: (
        <div className="flex flex-col">
          <span className="text-gray-900 text-sm font-semibold">{consumerName} ({scno})</span>
        </div>
      ),
    },
    { title: 'Consumption (kW)', value: '420' },
    { title: 'Cost (₹)', value: '12,500' },
    { title: 'CO₂ Emissions', value: '35 kg' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {infoCards.map((card, index) => (
        <div
          key={index}
          className="bg-white shadow-md rounded-xl p-2 border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all"
        >
          <h3 className="text-gray-500 text-xs font-medium">{card.title}</h3>
          <div className="mt-1 font-semibold">{card.value}</div>
        </div>
      ))}
    </div>
  )
}
