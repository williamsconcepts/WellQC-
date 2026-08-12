// Helper for Stripe Checkout & Subscription management

export interface CheckoutSessionOptions {
  userId: string;
  userEmail: string;
  plan?: string;
  returnUrl?: string;
}

export function getStripeCheckoutUrl({ userId, userEmail, plan = "pro" }: CheckoutSessionOptions): string {
  // In a live production setup, this will call stripe.checkout.sessions.create.
  // For demo & sandbox integration, we generate a structured checkout link.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const params = new URLSearchParams({
    client_reference_id: userId,
    customer_email: userEmail,
    plan,
    success_url: `${baseUrl}/dashboard?payment=success`,
    cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
  });

  return `/api/checkout?${params.toString()}`;
}
