import type { AnalyticsItem } from "./types";

export type CommerceLine = {
	quantity: number;
	totalPrice: { gross: { amount: number; currency: string } };
	variant: {
		id?: string | null;
		name?: string | null;
		product?: { id?: string | null; name?: string | null; category?: { name?: string | null } | null } | null;
	};
};

export function commerceLineToAnalyticsItem(line: CommerceLine): AnalyticsItem {
	const quantity = Math.max(line.quantity, 1);
	return {
		item_id: line.variant.product?.id || line.variant.id || "unknown-product",
		item_name: line.variant.product?.name || "Product",
		item_variant: line.variant.name || line.variant.id || undefined,
		item_category: line.variant.product?.category?.name || undefined,
		price: line.totalPrice.gross.amount / quantity,
		quantity,
	};
}

export function cartValue(lines: CommerceLine[]): number {
	return lines.reduce((total, line) => total + line.totalPrice.gross.amount, 0);
}

export const PURCHASE_STORAGE_PREFIX = "botflags_ga4_purchase_";

export function claimPurchase(transactionId: string, storage: Pick<Storage, "getItem" | "setItem">): boolean {
	const key = `${PURCHASE_STORAGE_PREFIX}${transactionId}`;
	if (storage.getItem(key)) return false;
	storage.setItem(key, new Date().toISOString());
	return true;
}
