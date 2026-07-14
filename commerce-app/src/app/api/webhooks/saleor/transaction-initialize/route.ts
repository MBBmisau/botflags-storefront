import { env } from "@/lib/env";
import { findPaymentByTransaction, savePayment } from "@/lib/payment-store";
import { buildPaystackReference, initializePaystackTransaction } from "@/lib/paystack";
import { transactionInitializeWebhook } from "@/lib/webhooks";

export const POST = transactionInitializeWebhook.createHandler(async (_request, context) => {
	const payload = context.payload;
	const transactionId = payload.transaction?.id;
	const checkout = payload.sourceObject;
	const amount = payload.action.amount;
	const currency = payload.action.currency;
	if (
		!transactionId ||
		checkout?.__typename !== "Checkout" ||
		!checkout.id ||
		!checkout.email ||
		typeof amount !== "number" ||
		currency !== "NGN"
	) {
		return Response.json({
			result: "CHARGE_FAILURE",
			actions: ["CHARGE"],
			message: "Paystack requires an NGN checkout with a customer email.",
		});
	}

	try {
		const existing = await findPaymentByTransaction(transactionId);
		if (existing?.authorization_url) {
			return Response.json({
				result: "CHARGE_ACTION_REQUIRED",
				actions: ["CANCEL"],
				amount,
				pspReference: existing.reference,
				message: "Continue to Paystack",
				data: { paystack: { authorizationUrl: existing.authorization_url, reference: existing.reference } },
			});
		}

		const reference = buildPaystackReference(transactionId, payload.idempotencyKey);
		const callback = new URL(`${env.APP_API_BASE_URL}/api/paystack/callback`);
		callback.searchParams.set("checkoutId", checkout.id);
		callback.searchParams.set("transactionId", transactionId);
		const initialized = await initializePaystackTransaction({
			amount,
			email: checkout.email,
			reference,
			callbackUrl: callback.toString(),
			checkoutId: checkout.id,
			transactionId,
		});
		await savePayment({
			reference,
			transactionId,
			checkoutId: checkout.id,
			saleorApiUrl: context.authData.saleorApiUrl,
			expectedAmount: amount,
			currency,
			authorizationUrl: initialized.authorization_url,
		});
		return Response.json({
			result: "CHARGE_ACTION_REQUIRED",
			actions: ["CANCEL"],
			amount,
			pspReference: reference,
			message: "Continue to Paystack",
			data: { paystack: { authorizationUrl: initialized.authorization_url, reference } },
		});
	} catch (error) {
		console.error("Paystack initialization failed", error);
		return Response.json({
			result: "CHARGE_FAILURE",
			actions: ["CHARGE"],
			message: "Paystack could not initialize this payment.",
		});
	}
});
