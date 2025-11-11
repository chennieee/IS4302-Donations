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

                <div className="text-sm" style={{ marginTop: 8 }}>
                  <div className="opacity-70">New deadline:</div>
                  <div className="font-medium" style={{ marginTop: 6 }}>{item.newDeadline}</div>
                </div>

                <div className="text-sm">
                  <div className="opacity-70">Reason:</div>
                  <p className="opacity-90">{item.reason}</p>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => vote(item.id, 'yes')}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      backgroundColor: '#10B981',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '0.5rem 0',
                      borderRadius: 12,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => vote(item.id, 'no')}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      backgroundColor: '#EF4444',
                      color: '#fff',
                      fontWeight: 600,
                      padding: '0.5rem 0',
                      borderRadius: 12,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
                    }}
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
