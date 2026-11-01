import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const workspaceId = session.metadata?.workspaceId;

    if (workspaceId) {
      await prisma.subscription.upsert({
        where: { workspaceId },
        create: {
          workspaceId,
          plan: "PRO",
          status: "ACTIVE",
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
        },
        update: {
          plan: "PRO",
          status: "ACTIVE",
          stripeSubscriptionId: session.subscription as string,
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subRecord = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (subRecord) {
      await prisma.subscription.update({
        where: { id: subRecord.id },
        data: { plan: "FREE", status: "CANCELED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}