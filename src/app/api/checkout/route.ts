import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan") || "pro";

    // Upgrade the user's tier to PRO upon checkout flow initiation
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        tier: "PRO",
        stripeCustomerId: `cus_demo_${Date.now()}`,
        stripeSubscriptionId: `sub_demo_${Date.now()}`,
      },
    });

    // Log the subscription activity
    await db.activityLog.create({
      data: {
        userName: user.name,
        userRole: user.role,
        userId: user.id,
        action: "UPGRADE_SUBSCRIPTION",
        targetType: "USER",
        targetId: user.id,
        details: `Upgraded subscription tier to ${plan.toUpperCase()}. Unlimited LAS file checks enabled.`,
      },
    });

    // Redirect user back to the dashboard with success parameter
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=success&tier=${updatedUser.tier}`);
  } catch (error) {
    console.error("Checkout processing error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout session." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        tier: "PRO",
        stripeCustomerId: `cus_demo_${Date.now()}`,
        stripeSubscriptionId: `sub_demo_${Date.now()}`,
      },
    });

    return NextResponse.json({
      message: "Subscription successfully upgraded to PRO.",
      tier: updatedUser.tier,
      freeChecksUsed: updatedUser.freeChecksUsed,
    });
  } catch (error) {
    console.error("Checkout POST error:", error);
    return NextResponse.json(
      { error: "Failed to process checkout." },
      { status: 500 }
    );
  }
}
