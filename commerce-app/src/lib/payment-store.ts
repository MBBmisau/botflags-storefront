import { ensureSchema, pool } from "@/lib/db";

export type StoredPayment = {
	reference: string;
	transaction_id: string;
	checkout_id: string;
	saleor_api_url: string;
	expected_amount: string;
	currency: string;
	authorization_url: string;
	status: string;
};

export async function findPaymentByTransaction(transactionId: string): Promise<StoredPayment | null> {
	await ensureSchema();
	const result = await pool.query("SELECT * FROM paystack_payments WHERE transaction_id = $1", [
		transactionId,
	]);
	return (result.rows[0] as StoredPayment | undefined) ?? null;
}

export async function findPaymentByReference(reference: string): Promise<StoredPayment | null> {
	await ensureSchema();
	const result = await pool.query("SELECT * FROM paystack_payments WHERE reference = $1", [reference]);
	return (result.rows[0] as StoredPayment | undefined) ?? null;
}

export async function savePayment(input: {
	reference: string;
	transactionId: string;
	checkoutId: string;
	saleorApiUrl: string;
	expectedAmount: number;
	currency: string;
	authorizationUrl: string;
}) {
	await ensureSchema();
	await pool.query(
		`INSERT INTO paystack_payments
      (reference, transaction_id, checkout_id, saleor_api_url, expected_amount, currency, authorization_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (reference) DO UPDATE SET authorization_url = EXCLUDED.authorization_url, updated_at = now()`,
		[
			input.reference,
			input.transactionId,
			input.checkoutId,
			input.saleorApiUrl,
			input.expectedAmount,
			input.currency,
			input.authorizationUrl,
		],
	);
}

export async function updatePaymentStatus(reference: string, status: string) {
	await ensureSchema();
	await pool.query("UPDATE paystack_payments SET status = $2, updated_at = now() WHERE reference = $1", [
		reference,
		status,
	]);
}

export async function claimWebhookEvent(eventKey: string): Promise<boolean> {
	await ensureSchema();
	const result = await pool.query(
		"INSERT INTO paystack_webhook_events (event_key) VALUES ($1) ON CONFLICT DO NOTHING RETURNING event_key",
		[eventKey],
	);
	return result.rowCount === 1;
}

export async function releaseWebhookEvent(eventKey: string) {
	await pool.query("DELETE FROM paystack_webhook_events WHERE event_key = $1", [eventKey]);
}
