import gql from "graphql-tag";
import { SaleorSyncWebhook } from "@saleor/app-sdk/handlers/next-app-router";
import { saleorApp } from "@/lib/saleor-app";

export type TransactionInitializePayload = {
	version?: string | null;
	action: { amount?: number | null; currency?: string | null; actionType?: string | null };
	data?: unknown;
	transaction?: { id?: string | null } | null;
	sourceObject?: {
		__typename?: string;
		id?: string;
		email?: string | null;
		channel?: { slug: string; currencyCode: string };
	} | null;
	idempotencyKey?: string | null;
};

export type TransactionProcessPayload = {
	action: { amount?: number | null; actionType?: string | null };
	transaction?: { id?: string | null; pspReference?: string | null } | null;
	sourceObject?: {
		__typename?: string;
		id?: string;
		channel?: { slug: string; currencyCode: string };
	} | null;
};

export type ShippingCheckoutPayload = {
	checkout?: {
		id: string;
		channel: { slug: string; currencyCode: string };
		shippingAddress?: { countryArea?: string | null; country?: { code?: string | null } | null } | null;
		lines?: Array<{
			undiscountedTotalPrice?: { amount?: number | null; currency?: string | null } | null;
		}> | null;
	} | null;
};

export type FilterShippingPayload = {
	shippingMethods?: Array<{ id: string; name: string }> | null;
	checkout?: ShippingCheckoutPayload["checkout"];
	order?: {
		id: string;
		channel: { slug: string; currencyCode: string };
		shippingAddress?: { countryArea?: string | null; country?: { code?: string | null } | null } | null;
		subtotal?: { gross?: { amount?: number | null; currency?: string | null } | null } | null;
	} | null;
};

const transactionInitializeQuery = gql`
	subscription BotflagsTransactionInitializeSession {
		event {
			... on TransactionInitializeSession {
				version
				action {
					amount
					currency
					actionType
				}
				data
				transaction {
					id
				}
				sourceObject {
					__typename
					... on Checkout {
						id
						email
						channel {
							slug
							currencyCode
						}
					}
				}
				idempotencyKey
			}
		}
	}
`;

const transactionProcessQuery = gql`
	subscription BotflagsTransactionProcessSession {
		event {
			... on TransactionProcessSession {
				action {
					amount
					actionType
				}
				transaction {
					id
					pspReference
				}
				sourceObject {
					__typename
					... on Checkout {
						id
						channel {
							slug
							currencyCode
						}
					}
				}
			}
		}
	}
`;

const gatewayInitializeQuery = gql`
	subscription BotflagsPaymentGatewayInitializeSession {
		event {
			... on PaymentGatewayInitializeSession {
				sourceObject {
					__typename
				}
			}
		}
	}
`;

const shippingCheckoutQuery = gql`
	subscription BotflagsShippingListMethodsForCheckout {
		event {
			... on ShippingListMethodsForCheckout {
				checkout {
					id
					channel {
						slug
						currencyCode
					}
					shippingAddress {
						countryArea
						country {
							code
						}
					}
					lines {
						undiscountedTotalPrice {
							amount
							currency
						}
					}
				}
			}
		}
	}
`;

const checkoutFilterQuery = gql`
	subscription BotflagsCheckoutFilterShippingMethods {
		event {
			... on CheckoutFilterShippingMethods {
				checkout {
					id
					channel {
						slug
						currencyCode
					}
					shippingAddress {
						countryArea
						country {
							code
						}
					}
					lines {
						undiscountedTotalPrice {
							amount
							currency
						}
					}
				}
				shippingMethods {
					id
					name
				}
			}
		}
	}
`;

const orderFilterQuery = gql`
	subscription BotflagsOrderFilterShippingMethods {
		event {
			... on OrderFilterShippingMethods {
				order {
					id
					channel {
						slug
						currencyCode
					}
					shippingAddress {
						countryArea
						country {
							code
						}
					}
					subtotal {
						gross {
							amount
							currency
						}
					}
				}
				shippingMethods {
					id
					name
				}
			}
		}
	}
`;

export const transactionInitializeWebhook = new SaleorSyncWebhook<TransactionInitializePayload>({
	apl: saleorApp.apl,
	event: "TRANSACTION_INITIALIZE_SESSION",
	name: "Botflags Paystack transaction initialize",
	isActive: true,
	query: transactionInitializeQuery,
	webhookPath: "api/webhooks/saleor/transaction-initialize",
});

export const transactionProcessWebhook = new SaleorSyncWebhook<TransactionProcessPayload>({
	apl: saleorApp.apl,
	event: "TRANSACTION_PROCESS_SESSION",
	name: "Botflags Paystack transaction process",
	isActive: true,
	query: transactionProcessQuery,
	webhookPath: "api/webhooks/saleor/transaction-process",
});

export const gatewayInitializeWebhook = new SaleorSyncWebhook<Record<string, unknown>>({
	apl: saleorApp.apl,
	event: "PAYMENT_GATEWAY_INITIALIZE_SESSION",
	name: "Botflags Paystack gateway initialize",
	isActive: true,
	query: gatewayInitializeQuery,
	webhookPath: "api/webhooks/saleor/payment-gateway-initialize",
});

export const shippingCheckoutWebhook = new SaleorSyncWebhook<ShippingCheckoutPayload>({
	apl: saleorApp.apl,
	event: "SHIPPING_LIST_METHODS_FOR_CHECKOUT",
	name: "Botflags Nigeria checkout delivery rates",
	isActive: true,
	query: shippingCheckoutQuery,
	webhookPath: "api/webhooks/saleor/shipping-checkout",
});

export const checkoutFilterWebhook = new SaleorSyncWebhook<FilterShippingPayload>({
	apl: saleorApp.apl,
	event: "CHECKOUT_FILTER_SHIPPING_METHODS",
	name: "Botflags hide staff delivery methods at checkout",
	isActive: true,
	query: checkoutFilterQuery,
	webhookPath: "api/webhooks/saleor/shipping-checkout-filter",
});

export const orderFilterWebhook = new SaleorSyncWebhook<FilterShippingPayload>({
	apl: saleorApp.apl,
	event: "ORDER_FILTER_SHIPPING_METHODS",
	name: "Botflags Nigeria draft order delivery rates",
	isActive: true,
	query: orderFilterQuery,
	webhookPath: "api/webhooks/saleor/shipping-order-filter",
});
