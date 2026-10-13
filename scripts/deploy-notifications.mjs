import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Запускати з кореня репозиторію. Секрети не передаються в аргументах CLI.
for (const file of ['.env.deploy.local', '.env.notifications.local']) {
  if (existsSync(file)) process.loadEnvFile(file)
}
const project = 'vksnegaaahhoffdjjkvp'
const secretNames = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'SMTP_USER', 'SMTP_PASSWORD', 'BOOKING_EMAIL', 'ALLOWED_ORIGINS']
const prepareOnly = process.argv.includes('--prepare')
const requiredSecrets = prepareOnly ? secretNames.filter(name => name !== 'SMTP_PASSWORD') : secretNames
const missing = ['SUPABASE_ACCESS_TOKEN', ...requiredSecrets].filter(name => !process.env[name])
if (missing.length) {
  console.error(`Додайте в .env.deploy.local: ${missing.join(', ')}. Файл ігнорується Git.`)
  process.exit(1)
}

async function management(path, body) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${project}/${path}`, {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new Error(`Supabase ${path}: HTTP ${response.status}. ${detail.message ?? 'Перевірте доступ до проєкту.'}`)
  }
}

try {
  await management('database/query', { query: readFileSync('supabase/notifications.sql', 'utf8') })
  await management('database/query', { query: readFileSync('supabase/pricing.sql', 'utf8') })
  console.log('Схему заявок та правило двох ночей застосовано.')
  await management('secrets', secretNames.filter(name => process.env[name]).map(name => ({ name, value: process.env[name] })))
  console.log('Серверні секрети налаштовано.')
  const result = spawnSync('pnpm', ['--package=supabase', 'dlx', 'supabase', 'functions', 'deploy', 'submit-booking', '--project-ref', project, '--use-api'], { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status ?? 1)
  console.log(prepareOnly && !process.env.SMTP_PASSWORD
    ? 'Функцію підготовлено. Для запуску надсилання додайте SMTP_PASSWORD і повторіть без --prepare.'
    : 'Функцію опубліковано. Перевірте тестову заявку на сайті та обидва канали доставки.')
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
