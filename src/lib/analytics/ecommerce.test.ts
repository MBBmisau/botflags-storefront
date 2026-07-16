import { describe, expect, it } from "vitest";
import { cartValue, claimPurchase, commerceLineToAnalyticsItem } from "./ecommerce";

const line = {
	quantity: 2,
	totalPrice: { gross: { amount: 60_000, currency: "NGN" } },
	variant: {
		id: "variant-1",
		name: "Black / M",
		product: { id: "product-1", name: "Summer Black Dress", category: { name: "Women" } },
	},
};

describe("ecommerce analytics", () => {
	it("builds an NGN item payload without customer data", () => {
		expect(commerceLineToAnalyticsItem(line)).toEqual({
			item_id: "product-1",
			item_name: "Summer Black Dress",
			item_variant: "Black / M",
			item_category: "Women",
			price: 30_000,
			quantity: 2,
		});
		expect(cartValue([line])).toBe(60_000);
	});

	it("claims each purchase transaction only once", () => {
		const values = new Map<string, string>();
		const storage = {
			getItem: (key: string) => values.get(key) ?? null,
			setItem: (key: string, value: string) => void values.set(key, value),
		};
		expect(claimPurchase("1001", storage)).toBe(true);
		expect(claimPurchase("1001", storage)).toBe(false);
		expect(claimPurchase("1002", storage)).toBe(true);
	});
});
