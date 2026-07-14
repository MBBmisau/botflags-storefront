import { findPaymentByReference, updatePaymentStatus } from "@/lib/payment-store";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { transactionProcessWebhook } from "@/lib/webhooks";

export const POST = transactionProcessWebhook.createHandler(async (_request, context) => {
	const reference = context.payload.transaction?.pspReference;
	const transactionId = context.payload.transaction?.id;
	if (!reference || !transactionId) {
		return Response.json({
			result: "CHARGE_FAILURE",
			actions: ["CHARGE"],
			message: "Paystack transaction reference is missing.",
		});
	}
	try {
		const [stored, verified] = await Promise.all([
			findPaymentByReference(reference),
			verifyPaystackTransaction(reference),
		]);
		const expectedKobo = stored ? Math.round(Number(stored.expected_amount) * 100) : null;
		const valid =
			stored?.transaction_id === transactionId &&
			verified.status === "success" &&
			verified.currency === "NGN" &&
			verified.amount === expectedKobo;
		if (!valid) {
			await updatePaymentStatus(reference, verified.status || "verification_failed");
			return Response.json({
				result: "CHARGE_FAILURE",
				actions: ["CHARGE"],
				pspReference: reference,
				message: "Paystack payment could not be verified.",
			});
		}
		await updatePaymentStatus(reference, "success");
		return Response.json({
			result: "CHARGE_SUCCESS",
			actions: ["REFUND"],
			amount: Number(stored.expected_amount),
			pspReference: reference,
			time: verified.paid_at ?? new Date().toISOString(),
			message: "Paystack charge confirmed",
			paymentMethodDetails: {
				type: "OTHER",
				name: verified.channel ? `Paystack ${verified.channel}` : "Paystack",
			},
		});
	} catch (error) {
		console.error("Paystack verification failed", error);
		return Response.json({
			result: "CHARGE_FAILURE",
			actions: ["CHARGE"],
			pspReference: reference,
			message: "Paystack verification is temporarily unavailable.",
		});
	}
});
