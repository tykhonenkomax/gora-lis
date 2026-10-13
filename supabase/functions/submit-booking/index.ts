import { createClient } from 'npm:@supabase/supabase-js@2.117.3'
import nodemailer from 'npm:nodemailer@7.0.11'
import { createBookingHandler } from '../_shared/bookingHandler.ts'

const env = (name: string) => Deno.env.get(name) ?? ''
const supabase = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10000) }) },
})
const origins = env('ALLOWED_ORIGINS').split(',').map(value => value.trim()).filter(Boolean)
const mailer = nodemailer.createTransport({
  host: 'smtp.ukr.net', port: 465, secure: true,
  auth: { user: env('SMTP_USER').toLowerCase(), pass: env('SMTP_PASSWORD') },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
})

Deno.serve(createBookingHandler({
  origins,
  ready: () => ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'SMTP_USER', 'SMTP_PASSWORD', 'BOOKING_EMAIL'].every(key => !!env(key)),
  async claim(id, payload, request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env('SUPABASE_SERVICE_ROLE_KEY')}:${ip}`))
    const ipHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    const { data, error } = await supabase.rpc('claim_booking_request', { p_id: id, p_payload: payload, p_ip_hash: ipHash })
    if (error) throw new Error('Request storage unavailable')
    return data
  },
  async send(channel, text, id) {
    if (channel === 'telegram') {
      const response = await fetch(`https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ chat_id: env('TELEGRAM_CHAT_ID'), text, link_preview_options: { is_disabled: true } }),
      })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error('Telegram delivery failed')
    } else {
      const result = await mailer.sendMail({
        from: { name: 'Gora&Lis · Бронювання', address: env('SMTP_USER').toLowerCase() },
        to: env('BOOKING_EMAIL'), subject: 'Gora&Lis — нова заявка на бронювання', text,
        messageId: `<booking-${id}@ukr.net>`, disableFileAccess: true, disableUrlAccess: true,
      })
      if (!result.accepted?.length) throw new Error('Email delivery failed')
    }
  },
  async markSent(id, channel) {
    const { error } = await supabase.from('booking_requests').update({ [`${channel}_sent`]: true }).eq('id', id)
    if (error) throw new Error('Delivery status unavailable')
  },
  async release(id) {
    const { error } = await supabase.from('booking_requests').update({ locked_until: new Date().toISOString() }).eq('id', id)
    if (error) throw new Error('Request state unavailable')
  },
}))
