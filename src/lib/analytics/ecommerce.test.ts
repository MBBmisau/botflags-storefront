import { describe, expect, it } from "vitest";
import {
	cartValue,
	claimPurchase,
	commerceLineToAnalyticsItem,
	itemsValue,
	orderLineToAnalyticsItem,
	promotionPayload,
} from "./ecommerce";

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
			item_id: "variant-1",
			item_name: "Summer Black Dress",
			item_variant: "Black / M",
			item_category: "Women",
			item_brand: "Botflags",
			affiliation: "Botflags Online Store",
			price: 30_000,
			quantity: 2,
		});
		expect(cartValue([line])).toBe(60_000);
	});

	it("uses confirmed Saleor order values and excludes tax and shipping from purchase value", () => {
		const item = orderLineToAnalyticsItem({
			id: "order-line-1",
			productName: "Summer Black Dress",
			variantName: "Black / M",
			productSku: "DRESS-BLK-M",
			productVariantId: "variant-1",
			quantity: 2,
			unitPrice: {
				net: { amount: 27_906.98, currency: "NGN" },
				gross: { amount: 30_000, currency: "NGN" },
			},
			undiscountedUnitPrice: {
				net: { amount: 34_883.72, currency: "NGN" },
				gross: { amount: 37_500, currency: "NGN" },
			},
			variant: {
				id: "variant-1",
				sku: "DRESS-BLK-M",
				name: "Black / M",
				product: { name: "Summer Black Dress", category: { name: "Women" } },
			},
		});

		expect(item).toMatchObject({
			item_id: "DRESS-BLK-M",
			item_name: "Summer Black Dress",
			item_variant: "Black / M",
			item_brand: "Botflags",
			item_category: "Women",
			price: 27_906.98,
			discount: 6_976.74,
			quantity: 2,
		});
		expect(itemsValue([item])).toBe(55_813.96);
	});

	it("populates promotion parameters at event and item scope", () => {
		const payload = promotionPayload({
			id: "new-season",
			name: "Modern silhouettes for every day",
			creativeName: "/brand/hero/hero-1.jpg",
			creativeSlot: "homepage_hero_1",
			item: { item_id: "DRESS-BLK-M", item_name: "Summer Black Dress", price: 30_000 },
		});

		expect(payload).toMatchObject({
			promotion_id: "new-season",
			promotion_name: "Modern silhouettes for every day",
			creative_slot: "homepage_hero_1",
			items: [
				{
					item_id: "DRESS-BLK-M",
					promotion_id: "new-season",
					creative_slot: "homepage_hero_1",
				},
			],
		});
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
