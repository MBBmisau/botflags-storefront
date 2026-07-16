"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_READY_EVENT } from "@/lib/analytics/consent";
import { canTrackAnalytics, trackEvent } from "@/lib/analytics/gtag";
import {
	cartValue,
	claimPurchase,
	commerceLineToAnalyticsItem,
	productCardToAnalyticsItem,
	promotionPayload,
	type AnalyticsPromotion,
	type CommerceLine,
} from "@/lib/analytics/ecommerce";
import type { AnalyticsEventName, AnalyticsEventPayloads, AnalyticsItem } from "@/lib/analytics/types";

function useTrackWhenReady<Name extends AnalyticsEventName>(
	name: Name,
	payload: AnalyticsEventPayloads[Name],
	dedupeKey: string,
	enabled = true,
) {
	const payloadRef = useRef(payload);
	useEffect(() => {
		payloadRef.current = payload;
	}, [payload]);

	useEffect(() => {
		let sent = false;
		const send = () => {
			if (sent || !enabled || !canTrackAnalytics()) return;
			trackEvent(name, payloadRef.current);
			sent = true;
		};
		send();
		window.addEventListener(ANALYTICS_READY_EVENT, send);
		return () => window.removeEventListener(ANALYTICS_READY_EVENT, send);
	}, [dedupeKey, enabled, name]);
}

export function ViewItemListTracker({
	products,
	listId = "product-grid",
	listName = "Product grid",
}: {
	products: Array<{
		id: string;
		name: string;
		price: number;
		analyticsPrice?: number;
		analyticsCompareAtPrice?: number | null;
		analyticsItemId?: string;
		currency: string;
		category?: { name: string } | null;
	}>;
	listId?: string;
	listName?: string;
}) {
	const items = products.map((product, index) => ({
		...productCardToAnalyticsItem(product),
		item_list_id: listId,
		item_list_name: listName,
		index,
	}));
	const currency = products[0]?.currency ?? "NGN";
	useTrackWhenReady(
		"view_item_list",
		{ currency, value: 0, items },
		`${listId}:${items.map((item) => item.item_id).join(",")}`,
		items.length > 0,
	);
	return null;
}

export function ViewItemTracker({
	item,
	currency,
	dedupeKey = item.item_id,
}: {
	item: AnalyticsItem;
	currency: string;
	dedupeKey?: string;
}) {
	useTrackWhenReady("view_item", { currency, value: item.price ?? 0, items: [item] }, dedupeKey);
	return null;
}

export function SearchTracker({ searchTerm }: { searchTerm: string }) {
	useTrackWhenReady("search", { search_term: searchTerm }, searchTerm, searchTerm.trim().length > 0);
	return null;
}

export function ViewCartTracker({ lines }: { lines: CommerceLine[] }) {
	const currency = lines[0]?.totalPrice.gross.currency ?? "NGN";
	const items = lines.map(commerceLineToAnalyticsItem);
	useTrackWhenReady(
		"view_cart",
		{ currency, value: cartValue(lines), items },
		items.map((item) => item.item_id).join(","),
	);
	return null;
}

export function CheckoutTracker({ lines, coupon }: { lines: CommerceLine[]; coupon?: string | null }) {
	const currency = lines[0]?.totalPrice.gross.currency ?? "NGN";
	const items = lines.map(commerceLineToAnalyticsItem);
	useTrackWhenReady(
		"begin_checkout",
		{ currency, value: cartValue(lines), coupon: coupon || undefined, items },
		items.map((item) => item.item_id).join(","),
	);
	return null;
}

export type PurchaseTrackerProps = {
	transactionId: string;
	currency: string;
	value: number;
	tax: number;
	shipping: number;
	coupon?: string;
	items: AnalyticsItem[];
};

export function PurchaseTracker(props: PurchaseTrackerProps) {
	const attemptedRef = useRef(false);
	useEffect(() => {
		const send = () => {
			if (
				attemptedRef.current ||
				!canTrackAnalytics() ||
				!claimPurchase(props.transactionId, window.localStorage)
			)
				return;
			attemptedRef.current = true;
			trackEvent("purchase", {
				transaction_id: props.transactionId,
				currency: props.currency,
				value: props.value,
				tax: props.tax,
				shipping: props.shipping,
				coupon: props.coupon,
				items: props.items,
			});
		};
		send();
		window.addEventListener(ANALYTICS_READY_EVENT, send);
		return () => window.removeEventListener(ANALYTICS_READY_EVENT, send);
	}, [props]);
	return null;
}

export function PromotionViewTracker({ promotion }: { promotion: AnalyticsPromotion }) {
	useTrackWhenReady(
		"view_promotion",
		promotionPayload(promotion),
		`${promotion.creativeSlot}:${promotion.id}`,
	);
	return null;
}
