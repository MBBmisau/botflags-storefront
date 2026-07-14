export const PAYSTACK_TRANSACTION_STORAGE_KEY = "paystackTransactionId";

export function storePaystackTransactionId(transactionId: string) {
	try {
		sessionStorage.setItem(PAYSTACK_TRANSACTION_STORAGE_KEY, transactionId);
	} catch {
		// Storage can be unavailable in strict browser modes; callback URL remains the fallback.
	}
}

export function getStoredPaystackTransactionId(): string | null {
	try {
		return sessionStorage.getItem(PAYSTACK_TRANSACTION_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function clearPaystackTransactionId() {
	try {
		sessionStorage.removeItem(PAYSTACK_TRANSACTION_STORAGE_KEY);
	} catch {
		// Ignore storage cleanup failures.
	}
}
