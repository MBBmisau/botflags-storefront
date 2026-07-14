import { STAFF_METHOD_PREFIX } from "@/lib/shipping-rates";
import { checkoutFilterWebhook } from "@/lib/webhooks";

export const POST = checkoutFilterWebhook.createHandler(async (_request, context) =>
	Response.json({
		excluded_methods: (context.payload.shippingMethods ?? [])
			.filter((method) => method.name.startsWith(STAFF_METHOD_PREFIX))
			.map((method) => ({
				id: method.id,
				reason: "This delivery method is reserved for staff-created orders.",
			})),
	}),
);
