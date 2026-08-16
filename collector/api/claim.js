const DEFAULT_ORIGINS = [
  'https://gonzaloramon-ia.github.io',
  'http://localhost:4173',
  'http://localhost:5500',
]

const requests = new Map()

function allowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function setCors(req, res) {
  const origin = req.headers.origin
  if (origin && allowedOrigins().includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function readBody(req) {
  if (!req.body) return {}
  if (typeof req.body === 'object') return req.body
  try {
    return JSON.parse(req.body)
  } catch {
    return {}
  }
}

function clean(value, max = 240) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : ''
}

function validate(input) {
  const name = clean(input.name, 100)
  const email = clean(input.email, 254).toLowerCase()
  const platform = clean(input.platform, 40)
  const handle = clean(input.handle, 240)
  const goal = clean(input.goal, 80)
  const goalNotes = clean(input.goalNotes, 800)
  const confirmation = input.confirmation === true

  const validPlatforms = ['OnlyFans', 'Fansly', 'Fanvue', 'LoyalFans', 'ManyVids', 'Patreon', 'Other']
  const validGoals = ['Get discovered', 'Measure traffic', 'Diversify platforms', 'Sell products', 'Other']

  if (name.length < 2) return { error: 'Enter a creator name.' }
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email.' }
  if (!validPlatforms.includes(platform)) return { error: 'Choose a supported platform.' }
  if (handle.length < 2) return { error: 'Enter a public handle or URL.' }
  if (!validGoals.includes(goal)) return { error: 'Choose one goal.' }
  if (!confirmation) return { error: 'Adult confirmation is required.' }

  return { name, email, platform, handle, goal, goalNotes }
}

function maySubmit(req) {
  const source = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
  const now = Date.now()
  const previous = requests.get(source) || []
  const current = previous.filter((time) => now - time < 10 * 60 * 1000)
  if (current.length >= 5) return false
  current.push(now)
  requests.set(source, current)
  return true
}

function claimId() {
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `CC-${Date.now().toString(36).toUpperCase()}-${suffix}`
}

export default async function handler(req, res) {
  setCors(req, res)

  const origin = req.headers.origin
  if (origin && !allowedOrigins().includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed.' })
  }
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  if (!maySubmit(req)) return res.status(429).json({ error: 'Please try again later.' })

  const body = readBody(req)
  if (clean(body.company, 120)) return res.status(202).json({ ok: true })

  const startedAt = Number(body.startedAt)
  if (!Number.isFinite(startedAt) || Date.now() - startedAt < 1800) {
    return res.status(400).json({ error: 'Please take a moment to complete the form.' })
  }

  const claim = validate(body)
  if (claim.error) return res.status(400).json({ error: claim.error })

  const token = process.env.AIRTABLE_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  const tableId = process.env.AIRTABLE_CLAIMS_TABLE_ID
  if (!token || !baseId || !tableId) {
    console.error('Collector is missing Airtable configuration.')
    return res.status(503).json({ error: 'Claim intake is not active yet.' })
  }

  const fields = {
    'Claim ID': claimId(),
    'Creator name': claim.name,
    Email: claim.email,
    'Main platform': claim.platform,
    'Public handle or URL': claim.handle,
    Goal: claim.goal,
    'Adult confirmation': true,
    Status: 'New',
  }
  if (claim.goalNotes) fields['Goal notes'] = claim.goalNotes

  try {
    const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fields }),
    })

    if (!response.ok) {
      console.error('Airtable rejected claim intake:', response.status)
      return res.status(502).json({ error: 'Unable to save your request. Please try again.' })
    }

    return res.status(201).json({ ok: true })
  } catch (error) {
    console.error('Claim intake failed:', error)
    return res.status(502).json({ error: 'Unable to save your request. Please try again.' })
  }
}