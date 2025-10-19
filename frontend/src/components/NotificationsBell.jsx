// Notifications received in these events:
// milestone hit, validation, outcome, refund

import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export default function NotificationsBell({ account }) {
    const [items, setItems] = useState([])
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!account) return
        let alive = true
        
        async function tick() {
            try {
                const res = await api.notifications(account)
                if (alive) setItems(res?.items ?? [])
            } catch (e) {
                // ignore non-fatal polling errors
                if (import.meta.env.DEV) console.debug(e)
            }
        }

        tick()
        const id = setInterval(tick, 15000)  //poll every 15s

        return () => { alive = false; clearInterval(id) }
    }, [account])

    const unread = items.filter(i => !i.read).length
    
    return (
        <div className="relative">
            <button className="relative rounded-full border p-2" onClick={() => setOpen(v => !v)}>
                🔔
                {!!unread && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">
                        {unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 rounded-2x1 border bg-white shadow-sm p-2 max-h-96 overflow-auto">
                    {items.length === 0 ? (
                        <div className="p-3 text-sm opacity-70">No notifications</div>
                    ) : items.map((n, i) => (
                        <div key={i} className="p-2 rounded hover:shadow-sm">
                            <div className="text-sm font-medium">{n.title}</div>
                            <div className="text-sm opacity-80">{n.message}</div>
                            <div className="text-xs opacity-50">
                                {new Date((n.blockTime ?? Date.now()/1000) * 1000).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}