import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackSignature(rawBody: string, signature: string, secret: string): boolean {
	const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
	return (
		signature.length === expected.length &&
		timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"))
	);
}

export function isVerifiedPaystackCharge(input: {
	status?: string | null;
	currency?: string | null;
	amountKobo?: number | null;
	expectedCurrency: string;
	expectedAmount: number;
}): boolean {
	return (
		input.status === "success" &&
		input.currency === input.expectedCurrency &&
		input.amountKobo === Math.round(input.expectedAmount * 100)
	);
}
