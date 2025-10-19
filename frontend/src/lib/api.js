// REST api (TBC)
const backendUrl = import.meta.env.VITE_BACKEND_URL

// GET request
async function jget(base, path) {
    const r = await fetch(`${base}${path}`)
    if (!r.ok) throw new Error(`${path} failed`)
    return r.json()
}

// POST request
async function jpost(base, path, body) {
    const r = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    if (!r.ok) {
        const text = await r.text().catch(() => '')
        throw new Error(`${path} failed: ${r.status} ${text}`)
    }
    return r.json()
}

export const api = {
    // campaigns list + details (retrieved from backend)
    listCampaigns: () => jget(backendUrl, '/campaigns'),
    getCampaign: (addr) => jget(backendUrl, `/campaigns/${addr}`),

    // donation & refunds (contract calls performed by backend)
    donate: ({ fromAddress, campaignAddress, amount }) => 
        jpost(backendUrl, '/donations', { fromAddress, campaignAddress, amount }),

    refund: ({ fromAddress, campaignAddress, amount }) =>
        jpost(backendUrl, '/refunds', { fromAddress, campaignAddress, amount }),

    // notifications for a given wallet
    notifications: (addr) => jget(backendUrl, `/notifications?address=${addr}`),

    // Unitoken
    unitoken: (addr) => jget(backendUrl, `/unitoken/${addr}`),

    // verification
    verification: (addr) => jget(backendUrl, `/verification/${addr}`)
    
}

export default api