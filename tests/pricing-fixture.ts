import type { PricingSnapshot } from '../supabase/functions/_shared/pricing'

export const TEST_PRICING: PricingSnapshot = {
  houses: [
    { house_slug: 'zrub', base_price: 4000, extra_guest_price: 500 },
    { house_slug: 'panorama', base_price: 3000, extra_guest_price: 0 },
  ],
  seasons: [],
}
