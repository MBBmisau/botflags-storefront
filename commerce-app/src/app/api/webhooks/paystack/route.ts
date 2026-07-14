import { env } from "@/lib/env";
import {
	claimWebhookEvent,
	findPaymentByReference,
	releaseWebhookEvent,
	updatePaymentStatus,
} from "@/lib/payment-store";
import { reportChargeSuccess } from "@/lib/report-transaction";
import { saleorApp } from "@/lib/saleor-app";
import { isVerifiedPaystackCharge, verifyPaystackSignature } from "@/lib/paystack-security";

type PaystackWebhook = {
	event?: string;
	data?: {
		id?: number;
		reference?: string;
		status?: string;
		amount?: number;
		currency?: string;
		paid_at?: string | null;
	};
};

export async function POST(request: Request) {
	const rawBody = await request.text();
	const signature = request.headers.get("x-paystack-signature") ?? "";
	const validSignature = verifyPaystackSignature(rawBody, signature, env.PAYSTACK_SECRET_KEY);
	if (!validSignature) return Response.json({ ok: false }, { status: 401 });

	const event = JSON.parse(rawBody) as PaystackWebhook;
	if (event.event !== "charge.success" || !event.data?.reference || !event.data.id)
		return Response.json({ ok: true });
	const eventKey = `${event.event}:${event.data.id}`;
	if (!(await claimWebhookEvent(eventKey))) return Response.json({ ok: true, duplicate: true });

	try {
		const stored = await findPaymentByReference(event.data.reference);
		if (!stored) return Response.json({ ok: true, unmatched: true });
		if (
			!isVerifiedPaystackCharge({
				status: event.data.status,
				currency: event.data.currency,
				amountKobo: event.data.amount,
				expectedCurrency: stored.currency,
				expectedAmount: Number(stored.expected_amount),
			})
		) {
			throw new Error("Paystack webhook amount, currency, or status mismatch");
		}
		const authData = await saleorApp.apl.get(stored.saleor_api_url);
		if (!authData) throw new Error("Saleor installation is unavailable");
		await reportChargeSuccess({
			authData,
			transactionId: stored.transaction_id,
			reference: stored.reference,
			amount: Number(stored.expected_amount),
			time: event.data.paid_at ?? new Date().toISOString(),
		});
		await updatePaymentStatus(stored.reference, "success");
		return Response.json({ ok: true });
	} catch (error) {
		console.error("Paystack webhook processing failed", error);
		await releaseWebhookEvent(eventKey);
		return Response.json({ ok: false }, { status: 500 });
	}
}
