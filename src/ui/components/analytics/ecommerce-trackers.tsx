"use client";

import { useEffect, useRef } from "react";
import { ANALYTICS_READY_EVENT } from "@/lib/analytics/consent";
import { canTrackAnalytics, trackEvent } from "@/lib/analytics/gtag";
import {
	cartValue,
	claimPurchase,
	commerceLineToAnalyticsItem,
	type CommerceLine,
} from "@/lib/analytics/ecommerce";
import type { AnalyticsEventName, AnalyticsEventPayloads, AnalyticsItem } from "@/lib/analytics/types";

function useTrackWhenReady<Name extends AnalyticsEventName>(
	name: Name,
	payload: AnalyticsEventPayloads[Name],
	dedupeKey: string,
) {
	const payloadRef = useRef(payload);
	useEffect(() => {
		payloadRef.current = payload;
	}, [payload]);

	useEffect(() => {
		let sent = false;
		const send = () => {
			if (sent || !canTrackAnalytics()) return;
			trackEvent(name, payloadRef.current);
			sent = true;
		};
		send();
		window.addEventListener(ANALYTICS_READY_EVENT, send);
		return () => window.removeEventListener(ANALYTICS_READY_EVENT, send);
	}, [dedupeKey, name]);
}

export function productCardToAnalyticsItem(product: {
	id: string;
	name: string;
	price: number;
	category?: { name: string } | null;
}): AnalyticsItem {
	return {
		item_id: product.id,
		item_name: product.name,
		price: product.price,
		item_category: product.category?.name,
	};
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
	);
	return null;
}

export function ViewItemTracker({ item, currency }: { item: AnalyticsItem; currency: string }) {
	useTrackWhenReady("view_item", { currency, value: item.price, items: [item] }, item.item_id);
	return null;
}

export function SearchTracker({ searchTerm }: { searchTerm: string }) {
	useTrackWhenReady("search", { currency: "NGN", value: 0, items: [], search_term: searchTerm }, searchTerm);
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

export function CheckoutTracker({ lines }: { lines: CommerceLine[] }) {
	const currency = lines[0]?.totalPrice.gross.currency ?? "NGN";
	const items = lines.map(commerceLineToAnalyticsItem);
	useTrackWhenReady(
		"begin_checkout",
		{ currency, value: cartValue(lines), items },
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
	useEffect(() => {
		const send = () => {
			if (!canTrackAnalytics() || !claimPurchase(props.transactionId, window.localStorage)) return;
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
