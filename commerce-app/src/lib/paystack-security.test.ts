import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { isVerifiedPaystackCharge, verifyPaystackSignature } from "./paystack-security";

describe("Paystack security", () => {
	const secret = "sk_test_botflags_signature_secret";
	const body = JSON.stringify({ event: "charge.success", data: { id: 42 } });

	it("accepts the HMAC-SHA512 signature for the untouched raw body", () => {
		const signature = createHmac("sha512", secret).update(body).digest("hex");
		expect(verifyPaystackSignature(body, signature, secret)).toBe(true);
	});

	it("rejects changed bodies and malformed signatures", () => {
		const signature = createHmac("sha512", secret).update(body).digest("hex");
		expect(verifyPaystackSignature(`${body} `, signature, secret)).toBe(false);
		expect(verifyPaystackSignature(body, "invalid", secret)).toBe(false);
	});

	it("requires matching status, currency, and kobo amount", () => {
		const valid = {
			status: "success",
			currency: "NGN",
			amountKobo: 3_000_000,
			expectedCurrency: "NGN",
			expectedAmount: 30_000,
		};
		expect(isVerifiedPaystackCharge(valid)).toBe(true);
		expect(isVerifiedPaystackCharge({ ...valid, status: "failed" })).toBe(false);
		expect(isVerifiedPaystackCharge({ ...valid, currency: "USD" })).toBe(false);
		expect(isVerifiedPaystackCharge({ ...valid, amountKobo: 2_999_999 })).toBe(false);
	});
});
