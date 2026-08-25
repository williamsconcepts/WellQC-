import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyPaystackTransaction, PAYSTACK_PLANS } from "@/lib/paystack";

export async function GET(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    const planParam = searchParams.get("plan") || "pro_monthly";

    if (!reference) {
      return NextResponse.redirect(`${baseUrl}/dashboard?payment=error&message=Missing_Transaction_Reference`);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(`${baseUrl}/login?returnUrl=/dashboard?payment=success&reference=${reference}`);
    }

    // Verify transaction with Paystack API or sandbox
    const verification = await verifyPaystackTransaction(reference);

    if (!verification.status || verification.data?.status !== "success") {
      return NextResponse.redirect(
        `${baseUrl}/dashboard?payment=failed&message=${encodeURIComponent(verification.message || "Payment verification failed")}`
      );
    }

    const planId = verification.data?.metadata?.planId || planParam;
    const plan = PAYSTACK_PLANS[planId] || PAYSTACK_PLANS.pro_monthly;

    // Upgrade the user in the database
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        tier: "PRO",
        stripeCustomerId: verification.data?.customer?.customer_code || `pstk_cus_${Date.now()}`,
        stripeSubscriptionId: reference,
      },
    });

    // Log the upgrade activity in the database
    await db.activityLog.create({
      data: {
        userName: user.name,
        userRole: user.role,
        userId: user.id,
        action: "UPGRADE_SUBSCRIPTION",
        targetType: "USER",
        targetId: user.id,
        details: `Subscribed to ${plan.name} via Paystack (${verification.data?.channel || "Card/Transfer/USSD"}). Ref: ${reference}. Unlimited LAS audits active.`,
      },
    });

    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=success&tier=${updatedUser.tier}&plan=${encodeURIComponent(plan.name)}&reference=${reference}`
    );
  } catch (error) {
    console.error("Paystack Verify GET error:", error);
    return NextResponse.redirect(
      `${baseUrl}/dashboard?payment=error&message=Internal_Verification_Error`
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reference = body.reference;
    const planParam = body.planId || "pro_monthly";

    if (!reference) {
      return NextResponse.json({ error: "Transaction reference is required." }, { status: 400 });
    }

    const verification = await verifyPaystackTransaction(reference);

    if (!verification.status || verification.data?.status !== "success") {
      return NextResponse.json(
        { error: verification.message || "Payment verification failed." },
        { status: 400 }
      );
    }

    const planId = verification.data?.metadata?.planId || planParam;
    const plan = PAYSTACK_PLANS[planId] || PAYSTACK_PLANS.pro_monthly;

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        tier: "PRO",
        stripeCustomerId: verification.data?.customer?.customer_code || `pstk_cus_${Date.now()}`,
        stripeSubscriptionId: reference,
      },
    });

    await db.activityLog.create({
      data: {
        userName: user.name,
        userRole: user.role,
        userId: user.id,
        action: "UPGRADE_SUBSCRIPTION",
        targetType: "USER",
        targetId: user.id,
        details: `Subscribed to ${plan.name} via Paystack. Ref: ${reference}. Unlimited LAS checks enabled.`,
      },
    });

    return NextResponse.json({
      status: true,
      message: "Subscription successfully upgraded to PRO.",
      tier: updatedUser.tier,
      plan: plan.name,
      reference,
      channel: verification.data?.channel || "card",
    });
  } catch (error) {
    console.error("Paystack Verify POST error:", error);
    return NextResponse.json(
      { error: "Failed to verify transaction." },
      { status: 500 }
    );
  }
}
