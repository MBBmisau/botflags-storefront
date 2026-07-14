import { createHash } from "node:crypto";
import { env } from "@/lib/env";

type PaystackResponse<T> = { status: boolean; message: string; data: T };

export type PaystackInitializeData = { authorization_url: string; access_code: string; reference: string };
export type PaystackVerifyData = {
	id: number;
	status: string;
	reference: string;
	amount: number;
	currency: string;
	paid_at?: string | null;
	channel?: string | null;
};

async function paystackRequest<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`https://api.paystack.co${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
			"Content-Type": "application/json",
			...(init?.headers ?? {}),
		},
		cache: "no-store",
	});
	const body = (await response.json()) as PaystackResponse<T>;
	if (!response.ok || !body.status) throw new Error(body.message || "Paystack request failed");
	return body.data;
}

export function buildPaystackReference(transactionId: string, idempotencyKey?: string | null): string {
	const digest = createHash("sha256")
		.update(`${transactionId}:${idempotencyKey ?? ""}`)
		.digest("hex")
		.slice(0, 28);
	return `botflags-${digest}`;
}

export function initializePaystackTransaction(input: {
	amount: number;
	email: string;
	reference: string;
	callbackUrl: string;
	checkoutId: string;
	transactionId: string;
}) {
	return paystackRequest<PaystackInitializeData>("/transaction/initialize", {
		method: "POST",
		body: JSON.stringify({
			amount: String(Math.round(input.amount * 100)),
			currency: "NGN",
			email: input.email,
			reference: input.reference,
			callback_url: input.callbackUrl,
			metadata: JSON.stringify({ checkoutId: input.checkoutId, transactionId: input.transactionId }),
		}),
	});
}

export function verifyPaystackTransaction(reference: string) {
	return paystackRequest<PaystackVerifyData>(`/transaction/verify/${encodeURIComponent(reference)}`);
}
