export default function ConsumerInfo({ consumerName, scno }) {
  // Sample placeholders – you can dynamically replace these later
  const infoCards = [
    { title: 'Consumer Name', value: consumerName },
    { title: 'Service No.', value: scno },
    { title: 'Connected Load', value: '150 kW' },
    { title: 'Location', value: 'Chennai, TN' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {infoCards.map((card, index) => (
        <div
          key={index}
          className="bg-white shadow-md rounded-xl p-2 border border-gray-100 flex flex-col items-center justify-center text-center hover:shadow-lg transition-all"
        >
          <h3 className="text-gray-500 text-xs font-medium">{card.title}</h3>
          <p className="text-gray-900 text-md font-semibold mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  )
}
