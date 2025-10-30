const BASE = import.meta.env.VITE_BACKEND_URL || ''
const API_PREFIX = '/api'

// Build url structure (e.g. http://localhost:3001/api/campaigns)
const isAbsolute = (p) => /^https?:\/\//i.test(p)
const buildUrl = (path) => {
  if (isAbsolute(path)) return path
  const safePath = path.startsWith('/') ? path : `/${path}`

  // If BASE is empty, use Vite proxy (just /api/path)
  if (!BASE) {
    return `${API_PREFIX}${safePath}`
  }

  // Otherwise use full URL (BASE/api/path)
  return `${BASE}${API_PREFIX}${safePath}`
}

async function request(method, path, body) {
  const response = await fetch(buildUrl(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })
  if (!response.ok) throw new Error(`${buildUrl(path)} failed`)
  return response.json()
}

export const api = {
    // campaigns
    listCampaigns: () => request('GET', '/campaigns'),
    getCampaign: (addr) => request('GET', `/campaigns/${addr}`),
    createCampaign: (data) => request('POST', `/campaigns`, data),

    // users
    getUser: (walletAddr) => request('GET', `/users/${walletAddr}`),
    updateUser: (walletAddr, body) => request('PUT', `/users/${walletAddr}`, body)
}

export default api