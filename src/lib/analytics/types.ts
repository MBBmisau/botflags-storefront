export type AnalyticsConsent = "granted" | "denied";

export type AnalyticsItem = {
	item_id: string;
	item_name: string;
	affiliation?: string;
	coupon?: string;
	discount?: number;
	item_brand?: string;
	item_category?: string;
	item_category2?: string;
	item_category3?: string;
	item_category4?: string;
	item_category5?: string;
	price?: number;
	quantity?: number;
	item_variant?: string;
	item_list_id?: string;
	item_list_name?: string;
	index?: number;
	promotion_id?: string;
	promotion_name?: string;
	creative_name?: string;
	creative_slot?: string;
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
};

export type PurchasePayload = EcommercePayload & { transaction_id: string };
export type SearchPayload = { search_term: string };
export type AuthPayload = { method: "email" };
export type PromotionPayload = {
	creative_name: string;
	creative_slot: string;
	promotion_id: string;
	promotion_name: string;
	items: AnalyticsItem[];
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
	| "purchase"
	| "login"
	| "sign_up"
	| "view_promotion"
	| "select_promotion";

export type AnalyticsEventPayloads = {
	view_item: EcommercePayload;
	view_item_list: EcommercePayload;
	select_item: EcommercePayload;
	add_to_cart: EcommercePayload;
	remove_from_cart: EcommercePayload;
	view_cart: EcommercePayload;
	begin_checkout: EcommercePayload;
	add_shipping_info: EcommercePayload;
	add_payment_info: EcommercePayload;
	purchase: PurchasePayload;
	search: SearchPayload;
	login: AuthPayload;
	sign_up: AuthPayload;
	view_promotion: PromotionPayload;
	select_promotion: PromotionPayload;
};
