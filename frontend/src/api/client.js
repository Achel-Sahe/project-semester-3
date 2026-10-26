const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/+$/, '')

export const ASSET_BASE_URL = new URL(BASE_URL).origin

export function assetUrl(photoUrl) {
  if (!photoUrl) return null
  if (/^https?:\/\//i.test(photoUrl)) return photoUrl
  return `${ASSET_BASE_URL}${photoUrl.startsWith('/') ? '' : '/'}${photoUrl}`
}

function toQuery(params) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

async function request(path, options) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
  } catch {
    throw new Error(`Tidak bisa menghubungi API di ${BASE_URL}.`)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || `Request gagal (HTTP ${response.status})`)
  }

  return payload.data
}

export const getPlayers = (params) => request(`/players${toQuery(params)}`)
export const getPlayer = (id) => request(`/players/${id}`)
export const getCoaches = (params) => request(`/coaches${toQuery(params)}`)
export const getCoach = (id) => request(`/coaches/${id}`)
export const getClubs = () => request('/clubs')
export const getPositions = () => request('/positions')
export const getRoles = () => request('/roles')