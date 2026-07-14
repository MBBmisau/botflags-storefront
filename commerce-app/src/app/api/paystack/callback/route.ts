import { env } from "@/lib/env";

export async function GET(request: Request) {
	const input = new URL(request.url);
	const reference = input.searchParams.get("reference") || input.searchParams.get("trxref");
	const checkoutId = input.searchParams.get("checkoutId");
	const transactionId = input.searchParams.get("transactionId");
	const target = new URL("/checkout", env.STOREFRONT_URL);
	if (checkoutId) target.searchParams.set("checkout", checkoutId);
	target.searchParams.set("processingPayment", "true");
	if (reference) target.searchParams.set("paystackReference", reference);
	if (transactionId) target.searchParams.set("paystackTransaction", transactionId);
	return Response.redirect(target, 303);
}
