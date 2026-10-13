import { parseRequest, requestMessage, requestTotal, type BookingRequest } from './bookingRules.ts'

export type Channel = 'telegram' | 'email'
export type Claim = { error?: 'id_conflict' | 'processing' | 'rate_limit' | 'occupied'; telegram_sent: boolean; email_sent: boolean }
export type BookingDependencies = {
  origins: string[]
  ready: () => boolean
  claim: (id: string, payload: BookingRequest, request: Request) => Promise<Claim>
  send: (channel: Channel, text: string, id: string) => Promise<void>
  markSent: (id: string, channel: Channel) => Promise<void>
  release: (id: string) => Promise<void>
}

export function createBookingHandler(deps: BookingDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin') ?? ''
    const allowed = deps.origins.includes(origin)
    const headers = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
      ...(allowed ? { 'Access-Control-Allow-Origin': origin } : {}),
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), { status, headers })
    if (!allowed) return reply(403, { error: 'Це джерело запиту не підтримується.' })
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return reply(405, { error: 'Метод не підтримується.' })
    if (!request.headers.get('content-type')?.includes('application/json')) return reply(415, { error: 'Потрібен JSON.' })
    if (!deps.ready()) return reply(503, { error: 'Надсилання тимчасово недоступне. Зателефонуйте: 096 777 30 15.' })

    let id: string
    let payload: BookingRequest
    try {
      if (Number(request.headers.get('content-length')) > 8192) return reply(413, { error: 'Заявка завелика.' })
      const text = await request.text()
      if (text.length > 8192) return reply(413, { error: 'Заявка завелика.' })
      const body = JSON.parse(text)
      if (!body || typeof body !== 'object' || body.website) return reply(400, { error: 'Перевірте дані заявки.' })
      if (typeof body.requestId !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(body.requestId)) return reply(400, { error: 'Оновіть сторінку та спробуйте знову.' })
      id = body.requestId
      payload = parseRequest(body)
    } catch (error) {
      return reply(400, { error: error instanceof SyntaxError ? 'Перевірте дані заявки.' : error instanceof Error ? error.message : 'Перевірте дані заявки.' })
    }

    try {
      const state = await deps.claim(id, payload, request)
      if (state.error) {
        const messages = {
          id_conflict: 'Заявка з таким номером уже існує. Оновіть сторінку.',
          processing: 'Заявка ще обробляється. Зачекайте хвилину й повторіть надсилання.',
          rate_limit: 'Забагато заявок. Спробуйте через 10 хвилин або зателефонуйте.',
          occupied: 'Ці дати вже зайняті. Оберіть інші дати або зателефонуйте.',
        }
        return reply(state.error === 'rate_limit' ? 429 : 409, { error: messages[state.error] })
      }
      const text = requestMessage(payload, id)
      const outcomes = await Promise.allSettled((['telegram', 'email'] as const).map(async channel => {
        if (state[`${channel}_sent`]) return
        await deps.send(channel, text, id)
        await deps.markSent(id, channel)
      }))
      await deps.release(id)
      if (outcomes.some(result => result.status === 'rejected')) {
        return reply(503, { error: 'Заявку збережено, але не всі повідомлення вдалося надіслати. Повторіть надсилання або зателефонуйте: 096 777 30 15.' })
      }
      return reply(200, { ok: true, requestId: id, total: requestTotal(payload) })
    } catch {
      return reply(503, { error: 'Не вдалося підтвердити надсилання. Повторіть спробу або зателефонуйте: 096 777 30 15.' })
    }
  }
}
