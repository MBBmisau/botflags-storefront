import { createManifestHandler } from "@saleor/app-sdk/handlers/next-app-router";
import type { AppManifest } from "@saleor/app-sdk/types";
import { env } from "@/lib/env";
import {
	checkoutFilterWebhook,
	gatewayInitializeWebhook,
	orderFilterWebhook,
	shippingCheckoutWebhook,
	transactionInitializeWebhook,
	transactionProcessWebhook,
} from "@/lib/webhooks";

export const GET = createManifestHandler({
	async manifestFactory() {
		const manifest: AppManifest = {
			id: "com.botflags.paystack",
			version: "0.1.0",
			name: "Botflags Commerce",
			about: "Paystack payments and state-aware Nigerian delivery for Botflags.",
			author: "Botflags Technologies",
			appUrl: env.APP_API_BASE_URL,
			tokenTargetUrl: `${env.APP_API_BASE_URL}/api/register`,
			homepageUrl: "https://botflags.com",
			supportUrl: "mailto:support@botflags.com",
			permissions: ["HANDLE_PAYMENTS", "MANAGE_SHIPPING", "MANAGE_ORDERS", "MANAGE_CHECKOUTS"],
			requiredSaleorVersion: ">=3.23 <4",
			extensions: [],
			webhooks: [
				gatewayInitializeWebhook.getWebhookManifest(env.APP_API_BASE_URL),
				transactionInitializeWebhook.getWebhookManifest(env.APP_API_BASE_URL),
				transactionProcessWebhook.getWebhookManifest(env.APP_API_BASE_URL),
				shippingCheckoutWebhook.getWebhookManifest(env.APP_API_BASE_URL),
				checkoutFilterWebhook.getWebhookManifest(env.APP_API_BASE_URL),
				orderFilterWebhook.getWebhookManifest(env.APP_API_BASE_URL),
			],
		};
		return manifest;
	},
});
