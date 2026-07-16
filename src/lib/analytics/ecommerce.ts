import type { AnalyticsItem, PromotionPayload } from "./types";

export const ANALYTICS_AFFILIATION = "Botflags Online Store";
export const ANALYTICS_BRAND = "Botflags";

export type AnalyticsProductCard = {
	id: string;
	name: string;
	price: number;
	analyticsPrice?: number;
	analyticsCompareAtPrice?: number | null;
	analyticsItemId?: string;
	category?: { name: string } | null;
};

export function roundMoney(value: number): number {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function positiveDiscount(undiscounted?: number, discounted?: number): number | undefined {
	if (undiscounted === undefined || discounted === undefined) return undefined;
	const discount = roundMoney(undiscounted - discounted);
	return discount > 0 ? discount : undefined;
}

export function productCardToAnalyticsItem(product: AnalyticsProductCard): AnalyticsItem {
	const price = product.analyticsPrice ?? product.price;
	return {
		item_id: product.analyticsItemId ?? product.id,
		item_name: product.name,
		item_brand: ANALYTICS_BRAND,
		affiliation: ANALYTICS_AFFILIATION,
		price,
		discount: positiveDiscount(product.analyticsCompareAtPrice ?? undefined, price),
		item_category: product.category?.name,
	};
}

export type CommerceLine = {
	quantity: number;
	totalPrice: { gross: { amount: number; currency: string } };
	unitPrice?: { net?: { amount: number; currency: string }; gross: { amount: number; currency: string } };
	undiscountedUnitPrice?: { amount: number; currency: string };
	variant: {
		id?: string | null;
		sku?: string | null;
		name?: string | null;
		pricing?: {
			price?: {
				net?: { amount: number; currency: string };
				gross: { amount: number; currency: string };
			} | null;
			priceUndiscounted?: {
				net?: { amount: number; currency: string };
				gross: { amount: number; currency: string };
			} | null;
		} | null;
		product?: {
			id?: string | null;
			name?: string | null;
			category?: { name?: string | null } | null;
		} | null;
	};
};

export function commerceLineToAnalyticsItem(line: CommerceLine): AnalyticsItem {
	const quantity = Math.max(line.quantity, 1);
	const price =
		line.unitPrice?.net?.amount ??
		line.variant.pricing?.price?.net?.amount ??
		line.variant.pricing?.price?.gross.amount ??
		line.totalPrice.gross.amount / quantity;
	const undiscounted =
		line.undiscountedUnitPrice?.amount ??
		line.variant.pricing?.priceUndiscounted?.net?.amount ??
		line.variant.pricing?.priceUndiscounted?.gross.amount;
	return {
		item_id: line.variant.sku || line.variant.id || line.variant.product?.id || "unknown-product",
		item_name: line.variant.product?.name || "Product",
		item_variant: line.variant.name || line.variant.id || undefined,
		item_category: line.variant.product?.category?.name || undefined,
		item_brand: ANALYTICS_BRAND,
		affiliation: ANALYTICS_AFFILIATION,
		price: roundMoney(price),
		discount: positiveDiscount(undiscounted, price),
		quantity,
	};
}

export function cartValue(lines: CommerceLine[]): number {
	return roundMoney(
		lines.reduce((total, line) => {
			const item = commerceLineToAnalyticsItem(line);
			return total + (item.price ?? 0) * (item.quantity ?? 1);
		}, 0),
	);
}

export type OrderLineForAnalytics = {
	id: string;
	productName: string;
	variantName: string;
	productSku?: string | null;
	productVariantId?: string | null;
	quantity: number;
	unitPrice: { net: { amount: number; currency: string }; gross: { amount: number; currency: string } };
	undiscountedUnitPrice: {
		net: { amount: number; currency: string };
		gross: { amount: number; currency: string };
	};
	variant?: {
		id: string;
		sku?: string | null;
		name: string;
		product: { name: string; category?: { name?: string | null } | null };
	} | null;
};

export function orderLineToAnalyticsItem(line: OrderLineForAnalytics): AnalyticsItem {
	const price = line.unitPrice.net.amount;
	return {
		item_id: line.productSku || line.productVariantId || line.variant?.sku || line.variant?.id || line.id,
		item_name: line.productName,
		item_variant: line.variantName || line.variant?.name || undefined,
		item_category: line.variant?.product.category?.name || undefined,
		item_brand: ANALYTICS_BRAND,
		affiliation: ANALYTICS_AFFILIATION,
		price: roundMoney(price),
		discount: positiveDiscount(line.undiscountedUnitPrice.net.amount, price),
		quantity: line.quantity,
	};
}

export function itemsValue(items: AnalyticsItem[]): number {
	return roundMoney(items.reduce((total, item) => total + (item.price ?? 0) * (item.quantity ?? 1), 0));
}

export type AnalyticsPromotion = {
	id: string;
	name: string;
	creativeName: string;
	creativeSlot: string;
	item: AnalyticsItem;
};

export function promotionPayload(promotion: AnalyticsPromotion): PromotionPayload {
	const promotionFields = {
		promotion_id: promotion.id,
		promotion_name: promotion.name,
		creative_name: promotion.creativeName,
		creative_slot: promotion.creativeSlot,
	};
	return {
		...promotionFields,
		items: [{ ...promotion.item, ...promotionFields }],
	};
}

export const PURCHASE_STORAGE_PREFIX = "botflags_ga4_purchase_";

export function claimPurchase(transactionId: string, storage: Pick<Storage, "getItem" | "setItem">): boolean {
	const key = `${PURCHASE_STORAGE_PREFIX}${transactionId}`;
	if (storage.getItem(key)) return false;
	storage.setItem(key, new Date().toISOString());
	return true;
}
