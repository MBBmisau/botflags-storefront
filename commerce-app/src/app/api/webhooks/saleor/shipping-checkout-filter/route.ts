import { resolveShippingRate, STAFF_METHOD_PREFIX } from "@/lib/shipping-rates";
import { checkoutFilterWebhook } from "@/lib/webhooks";

export const POST = checkoutFilterWebhook.createHandler(async (_request, context) => {
	const checkout = context.payload.checkout;
	const methods = context.payload.shippingMethods ?? [];
	const rate =
		checkout?.channel.slug === "nigeria-ngn"
			? resolveShippingRate({
					countryCode: checkout.shippingAddress?.country?.code,
					countryArea: checkout.shippingAddress?.countryArea,
					subtotal: checkout.subtotalPrice?.gross?.amount,
					currency: checkout.subtotalPrice?.gross?.currency ?? checkout.channel.currencyCode,
				})
			: null;
	const externalRateAvailable = Boolean(rate && methods.some((method) => method.name === rate.name));

	return Response.json({
		excluded_methods: methods
			.filter(
				(method) =>
					method.name.startsWith(STAFF_METHOD_PREFIX) &&
					(externalRateAvailable || method.name !== rate?.staffName),
			)
			.map((method) => ({
				id: method.id,
				reason: rate ? "A different Botflags delivery band applies." : "Enter a valid Nigerian state.",
			})),
	});
});
