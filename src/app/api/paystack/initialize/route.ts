import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initializePaystackTransaction, PAYSTACK_PLANS, PaymentCurrency } from "@/lib/paystack";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required to initialize payment." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = (body.planId || body.plan || "pro_monthly") as string;
    const currency = (body.currency || "NGN") as PaymentCurrency;

    const plan = PAYSTACK_PLANS[planId] || PAYSTACK_PLANS.pro_monthly;
    const amountInSubunits = currency === "USD" ? plan.centsUsd : plan.koboNgn;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/paystack/verify?plan=${plan.id}&currency=${currency}`;

    const paystackRes = await initializePaystackTransaction({
      email: user.email,
      amount: amountInSubunits,
      currency,
      planId: plan.id,
      userId: user.id,
      userName: user.name,
      callbackUrl,
      metadata: {
        department: user.department,
        currentTier: user.tier || "FREE",
      },
    });

    if (!paystackRes.status || !paystackRes.data) {
      return NextResponse.json(
        { error: paystackRes.message || "Failed to initialize Paystack transaction." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      status: true,
      authorizationUrl: paystackRes.data.authorization_url,
      accessCode: paystackRes.data.access_code,
      reference: paystackRes.data.reference,
      plan: {
        id: plan.id,
        name: plan.name,
        currency,
        amount: currency === "USD" ? `$${plan.amountUsd}` : `₦${plan.amountNgn.toLocaleString()}`,
      },
    });
  } catch (error) {
    console.error("Paystack Initialize error:", error);
    return NextResponse.json(
      { error: "Server error initializing Paystack payment." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${baseUrl}/login?returnUrl=/pricing`);
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get("plan") || "pro_monthly";
    const currency = (searchParams.get("currency") || "NGN") as PaymentCurrency;

    const plan = PAYSTACK_PLANS[planId] || PAYSTACK_PLANS.pro_monthly;
    const amountInSubunits = currency === "USD" ? plan.centsUsd : plan.koboNgn;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const callbackUrl = `${baseUrl}/api/paystack/verify?plan=${plan.id}&currency=${currency}`;

    const paystackRes = await initializePaystackTransaction({
      email: user.email,
      amount: amountInSubunits,
      currency,
      planId: plan.id,
      userId: user.id,
      userName: user.name,
      callbackUrl,
    });

    if (paystackRes.status && paystackRes.data?.authorization_url) {
      return NextResponse.redirect(paystackRes.data.authorization_url);
    }

    return NextResponse.redirect(`${baseUrl}/pricing?error=init_failed`);
  } catch (error) {
    console.error("Paystack GET Initialize error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/pricing?error=init_failed`);
  }
}
