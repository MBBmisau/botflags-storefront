import type { DeliveryOption, ServerCheckout } from "@/checkout/lib/checkout-types";

export function shippingDeliveriesCacheKey(checkout: ServerCheckout): string | null {
	const addressId = checkout.shippingAddress?.id;
	if (!addressId) return null;
	return `${checkout.id}:${addressId}`;
}

/**
 * Saleor 3.23 accepts both IDs, but the shipping method ID remains stable when
 * external delivery options are recalculated between display and selection.
 */
export function deliverySelectionId(delivery: DeliveryOption): string {
	return delivery.shippingMethod?.id ?? delivery.id;
}

/** Pick a shipping method id from user selection, saved checkout, or first available option. */
export function resolveSelectedDeliveryId(
	current: string | undefined,
	deliveries: DeliveryOption[],
	savedDeliveryMethodId: string | undefined,
): string | undefined {
	if (current && deliveries.some((delivery) => deliverySelectionId(delivery) === current)) return current;
	if (
		savedDeliveryMethodId &&
		deliveries.some((delivery) => deliverySelectionId(delivery) === savedDeliveryMethodId)
	)
		return savedDeliveryMethodId;
	return deliveries[0] ? deliverySelectionId(deliveries[0]) : undefined;
}
