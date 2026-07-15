import { describe, expect, it } from "vitest";
import type { DeliveryOption } from "@/checkout/lib/checkout-types";
import { deliverySelectionId, resolveSelectedDeliveryId } from "./shipping-deliveries";

const delivery = (id: string, shippingMethodId?: string) =>
	({
		id,
		shippingMethod: shippingMethodId ? { id: shippingMethodId } : null,
	}) as DeliveryOption;

describe("shipping delivery selection", () => {
	it("uses the stable shipping method id when Saleor supplies one", () => {
		expect(deliverySelectionId(delivery("delivery-1", "method-1"))).toBe("method-1");
	});

	it("falls back to the delivery id", () => {
		expect(deliverySelectionId(delivery("delivery-1"))).toBe("delivery-1");
	});

	it("keeps a saved shipping method selection", () => {
		const deliveries = [delivery("delivery-1", "method-1"), delivery("delivery-2", "method-2")];
		expect(resolveSelectedDeliveryId(undefined, deliveries, "method-2")).toBe("method-2");
	});
});
