import { resolveShippingRate, STAFF_METHOD_PREFIX } from "@/lib/shipping-rates";
import { orderFilterWebhook } from "@/lib/webhooks";

export const POST = orderFilterWebhook.createHandler(async (_request, context) => {
	const order = context.payload.order;
	const rate =
		order?.channel.slug === "nigeria-ngn"
			? resolveShippingRate({
					countryCode: order.shippingAddress?.country?.code,
					countryArea: order.shippingAddress?.countryArea,
					subtotal: order.subtotal?.gross?.amount,
					currency: order.channel.currencyCode,
				})
			: null;
	return Response.json({
		excluded_methods: (context.payload.shippingMethods ?? [])
			.filter((method) => method.name.startsWith(STAFF_METHOD_PREFIX) && method.name !== rate?.staffName)
			.map((method) => ({
				id: method.id,
				reason: rate ? "A different Botflags delivery band applies." : "Enter a valid Nigerian state.",
			})),
	});
});
