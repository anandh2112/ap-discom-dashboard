export default function HelpModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Help Form</h2>

        <form className="space-y-3">
          <input
            type="text"
            placeholder="Name"
            className="w-full border px-3 py-2 rounded"
          />
          <input
            type="number"
            placeholder="Phone Number"
            className="w-full border px-3 py-2 rounded"
          />
          <textarea
            placeholder="Message"
            rows="3"
            className="w-full border px-3 py-2 rounded"
          />
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-3 py-2 bg-slate-200 rounded hover:bg-slate-300"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
