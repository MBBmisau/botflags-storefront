import { env } from "@/lib/env";
import { gatewayInitializeWebhook } from "@/lib/webhooks";

export const POST = gatewayInitializeWebhook.createHandler(async () =>
	Response.json({ data: { paystackPublicKey: env.PAYSTACK_PUBLIC_KEY } }),
);
