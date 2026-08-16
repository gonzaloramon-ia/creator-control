export default function handler(_req, res) {
  const configured = Boolean(process.env.AIRTABLE_TOKEN)

  res.setHeader('Cache-Control', 'no-store')
  return res.status(configured ? 200 : 503).json({
    service: 'creator-control-collector',
    configured,
  })
}
