import { resolveShippingRate, sumCheckoutLineTotals } from "@/lib/shipping-rates";
import { shippingCheckoutWebhook } from "@/lib/webhooks";

export const POST = shippingCheckoutWebhook.createHandler(async (_request, context) => {
	const checkout = context.payload.checkout;
	if (!checkout || checkout.channel.slug !== "nigeria-ngn") return Response.json([]);
	const rate = resolveShippingRate({
		countryCode: checkout.shippingAddress?.country?.code,
		countryArea: checkout.shippingAddress?.countryArea,
		subtotal: sumCheckoutLineTotals(checkout.lines),
		currency: checkout.channel.currencyCode,
	});
	return Response.json(
		rate
			? [
					{
						id: rate.id,
						name: rate.name,
						amount: rate.amount,
						currency: rate.currency,
						description: rate.description,
					},
				]
			: [],
	);
});
