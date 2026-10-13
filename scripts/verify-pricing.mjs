import { readFileSync } from 'node:fs'

process.loadEnvFile('.env.deploy.local')
const response = await fetch('https://api.supabase.com/v1/projects/vksnegaaahhoffdjjkvp/database/query', {
  method: 'POST', headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: readFileSync('supabase/verify-pricing.sql', 'utf8') }), signal: AbortSignal.timeout(30000),
})
const result = await response.json()
if (!response.ok) { console.error(result.message ?? `HTTP ${response.status}`); process.exit(1) }
console.log(result)
