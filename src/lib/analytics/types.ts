export type AnalyticsConsent = "granted" | "denied";

export type AnalyticsItem = {
	item_id: string;
	item_name: string;
	price: number;
	quantity?: number;
	item_variant?: string;
	item_category?: string;
	item_list_id?: string;
	item_list_name?: string;
	index?: number;
};

export type EcommercePayload = {
	currency: string;
	value: number;
	items: AnalyticsItem[];
	coupon?: string;
	shipping?: number;
	tax?: number;
	transaction_id?: string;
	shipping_tier?: string;
	payment_type?: string;
	search_term?: string;
};

export type AnalyticsEventName =
	| "view_item"
	| "view_item_list"
	| "select_item"
	| "search"
	| "add_to_cart"
	| "remove_from_cart"
	| "view_cart"
	| "begin_checkout"
	| "add_shipping_info"
	| "add_payment_info"
	| "purchase";

export type AnalyticsEventPayloads = Record<AnalyticsEventName, EcommercePayload>;
