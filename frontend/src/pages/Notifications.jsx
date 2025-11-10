import { useState } from 'react'

export default function Notifications() {
  const [items, setItems] = useState([
    {
      id: 'c1',
      name: "Fund My Sanity Please",
      newDeadline: '15 Dec 2025',
      reason: 'Need more time to raise funds for therapy... Teaching blockchain is traumatic',
    },
  ])

  const [toast, setToast] = useState({ open: false, msg: '' })

  const vote = (id, choice) => {
    // record vote, remove card, show success toast
    setItems(prev => prev.filter(x => x.id !== id))
    setToast({ open: true, msg: 'Your vote has been recorded' })
    // auto-dismiss toast
    setTimeout(() => setToast({ open: false, msg: '' }), 1500)
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">To Vote</h1>

      {items.length === 0 ? (
        <div className="text-sm opacity-70">No pending proposals to vote on.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-2xl border border-gray-300 shadow-md overflow-hidden cursor-default select-none bg-white"
            >
              {/* No link — card is not clickable */}
              <div className="p-4 space-y-2">
                <h2 className="font-semibold text-lg">{item.name}</h2>

                <div className="text-sm">
                  <div className="opacity-70">New deadline:</div>
                  <div className="font-medium">{item.newDeadline}</div>
                </div>

                <div className="text-sm">
                  <div className="opacity-70">Reason:</div>
                  <p className="opacity-90">{item.reason}</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => vote(item.id, 'yes')}
                    className="flex-1 text-center bg-green-600 text-white font-medium py-2 rounded-xl shadow-sm hover:bg-green-700 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => vote(item.id, 'no')}
                    className="flex-1 text-center bg-red-600 text-white font-medium py-2 rounded-xl shadow-sm hover:bg-red-700 transition-colors"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tiny success toast */}
      {toast.open && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg">
          {toast.msg}
        </div>
      )}
    </div>
  )
}
