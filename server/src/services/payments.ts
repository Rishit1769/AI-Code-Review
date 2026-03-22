import {
  lemonSqueezySetup,
  createCheckout,
  cancelSubscription,
} from '@lemonsqueezy/lemonsqueezy.js'

export function initPayments(): void {
  lemonSqueezySetup({ apiKey: process.env.LEMON_API_KEY! })
  console.log('✅ Lemon Squeezy initialized')
}

export const PLAN_VARIANTS: Record<string, string> = {
  solo:    process.env.LS_VARIANT_SOLO    ?? '',
  team:    process.env.LS_VARIANT_TEAM    ?? '',
  company: process.env.LS_VARIANT_COMPANY ?? '',
}

export function variantToPlan(variantId: string): string {
  for (const [plan, id] of Object.entries(PLAN_VARIANTS)) {
    if (id === variantId) return plan
  }
  return 'free'
}

export async function createCheckoutUrl(
  plan: string, userEmail: string, userId: string, userName = ''
): Promise<string> {
  const variantId = PLAN_VARIANTS[plan]
  if (!variantId) throw new Error(`Invalid plan: ${plan}`)

  const { data, error } = await createCheckout(
    process.env.LS_STORE_ID!,
    variantId,
    {
      checkoutData: {
        email: userEmail,
        name:  userName,
        custom: { user_id: userId, plan_name: plan },
      },
      checkoutOptions: { embed: false, media: false, logo: true, dark: true },
      productOptions: {
        redirectUrl:         `${process.env.CLIENT_URL}/dashboard?payment=success&plan=${plan}`,
        receiptButtonText:   'Go to Dashboard',
        receiptThankYouNote: 'Thank you! Your AI code reviews are now active.',
      },
    }
  )

  if (error) throw new Error(error.message)
  if (!data?.data?.attributes?.url) throw new Error('No checkout URL returned')
  return data.data.attributes.url
}

export async function cancelUserSubscription(subscriptionId: string): Promise<void> {
  const { error } = await cancelSubscription(subscriptionId)
  if (error) throw new Error(`Cancel failed: ${error.message}`)
}