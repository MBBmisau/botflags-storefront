import { type PaymentGatewayLike, type TransactionInitializePayload } from "../types";

export const PAYSTACK_GATEWAY_ID = "com.botflags.paystack";
export const PAYSTACK_PAYMENT_NOT_ENABLED_MESSAGE =
	"Paystack payments are not enabled in this environment. Set NEXT_PUBLIC_ENABLE_PAYSTACK_PAYMENTS=true.";

export function isPaystackGateway(gatewayId: string): boolean {
	return gatewayId === PAYSTACK_GATEWAY_ID;
}

export function findPaystackGateway(
	gateways: ReadonlyArray<PaymentGatewayLike> | null | undefined,
): PaymentGatewayLike | undefined {
	return gateways?.find((gateway) => isPaystackGateway(gateway.id));
}

export function isPaystackPaymentEnabled(): boolean {
	return (
		process.env.ENABLE_PAYSTACK_PAYMENTS === "true" ||
		process.env.NEXT_PUBLIC_ENABLE_PAYSTACK_PAYMENTS === "true"
	);
}

export function getPaystackPaymentGuardError(gatewayId: string | null | undefined): string | null {
	if (!gatewayId || !isPaystackGateway(gatewayId)) return null;
	return isPaystackPaymentEnabled() ? null : PAYSTACK_PAYMENT_NOT_ENABLED_MESSAGE;
}

type PaystackTransactionData = {
	paystack?: {
		authorizationUrl?: string;
		reference?: string;
	};
};

export function parsePaystackTransactionData(data: unknown): PaystackTransactionData | null {
	if (!data || typeof data !== "object") return null;
	const paystack = (data as Record<string, unknown>).paystack;
	if (!paystack || typeof paystack !== "object") return null;
	const record = paystack as Record<string, unknown>;
	return {
		paystack: {
			authorizationUrl: typeof record.authorizationUrl === "string" ? record.authorizationUrl : undefined,
			reference: typeof record.reference === "string" ? record.reference : undefined,
		},
	};
}

export function getPaystackAuthorizationUrl(data: unknown): string | null {
	const value = parsePaystackTransactionData(data)?.paystack?.authorizationUrl;
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && url.hostname.endsWith("paystack.com") ? url.toString() : null;
	} catch {
		return null;
	}
}

const FAILED_EVENT_TYPES = new Set([
	"AUTHORIZATION_FAILURE",
	"AUTHORIZATION_ADJUSTMENT_FAILURE",
	"CHARGE_FAILURE",
	"REFUND_FAILURE",
	"CANCEL_FAILURE",
]);

export function getPaystackTransactionError(payload: TransactionInitializePayload): string | null {
	if (payload?.errors?.length) {
		return payload.errors[0]?.message || "Paystack payment failed";
	}
	const eventType = payload?.transactionEvent?.type;
	if (eventType && FAILED_EVENT_TYPES.has(eventType)) {
		return payload.transactionEvent?.message || "Paystack payment failed";
	}
	if (!payload?.transaction?.id) {
		return "Paystack could not create a payment transaction. Check that the Botflags Commerce app is active.";
	}
	return null;
}
