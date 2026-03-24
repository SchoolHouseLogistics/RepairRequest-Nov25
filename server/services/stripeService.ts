import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover",
});

// Stripe Price IDs — set these after creating products in Stripe Dashboard
const PRICE_IDS: Record<string, Record<string, string>> = {
  starter: {
    monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID || "",
  },
  professional: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID || "",
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || "",
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID || "",
  },
};

export async function createCustomer(email: string, orgName: string, orgId: number): Promise<string> {
  const customer = await stripe.customers.create({
    email,
    name: orgName,
    metadata: { organizationId: String(orgId) },
  });
  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  plan: string,
  interval: "monthly" | "annual",
  orgId: number,
  returnUrl: string,
): Promise<string> {
  const priceId = PRICE_IDS[plan]?.[interval];
  if (!priceId) throw new Error(`No price ID for ${plan}/${interval}`);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?upgraded=true`,
    cancel_url: `${returnUrl}/pricing`,
    metadata: { organizationId: String(orgId), plan, interval },
  });

  return session.url!;
}

export async function createSetupFeeCheckout(
  email: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: "RepairRequest Setup Fee" },
        unit_amount: 5000,
      },
      quantity: 1,
    }],
    success_url: `${returnUrl}/setup-confirmed`,
    cancel_url: `${returnUrl}/pricing`,
  });

  return session.url!;
}

export async function createPortalSession(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${returnUrl}/dashboard`,
  });
  return session.url;
}

export async function constructWebhookEvent(
  body: Buffer,
  signature: string,
): Promise<Stripe.Event> {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET || "",
  );
}

export { stripe };
