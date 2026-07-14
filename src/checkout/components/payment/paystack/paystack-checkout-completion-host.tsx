"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useCheckoutSession } from "@/checkout/providers/checkout-session";
import { useCheckoutPaymentReturnError } from "@/checkout/providers/checkout-payment-return-error";
import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import {
	clearPaymentCompleting,
	markPaymentCompleting,
	stashPaymentCompletionError,
} from "@/checkout/lib/payment/checkout-payment-completion";
import { finalizeCheckoutOrder } from "@/checkout/lib/payment/finalize-checkout-order";
import { getPaystackTransactionError } from "@/checkout/lib/payment/providers/paystack";
import {
	clearPaystackTransactionId,
	getStoredPaystackTransactionId,
} from "@/checkout/lib/payment/paystack-transaction-storage";
import { useTranslations } from "next-intl";

export function PaystackCheckoutCompletionHost() {
	const { checkoutId } = useCheckoutSession();
	const searchParams = useSearchParams();
	const { setError } = useCheckoutPaymentReturnError();
	const t = useTranslations("checkout.payment");
	const started = useRef(false);
	const reference = searchParams.get("paystackReference") ?? searchParams.get("reference");
	const queryTransactionId = searchParams.get("paystackTransaction");

	useEffect(() => {
		if (!checkoutId || !reference || started.current) return;
		const transactionId = queryTransactionId || getStoredPaystackTransactionId();
		if (!transactionId) {
			setError(t("sessionExpired"));
			clearPaymentCompleting();
			return;
		}

		started.current = true;
		markPaymentCompleting(checkoutId);
		void (async () => {
			try {
				const processResult = await getCheckoutTransport().processTransaction({ id: transactionId });
				if (!processResult.ok) throw new Error(processResult.error);
				const paymentError = getPaystackTransactionError(processResult.data);
				if (paymentError) throw new Error(paymentError);

				const synced = await getCheckoutTransport().fetchCheckout(checkoutId);
				if (!synced.ok || !synced.checkout) throw new Error(t("verificationUnavailable"));
				clearPaystackTransactionId();
				const completeResult = await finalizeCheckoutOrder(checkoutId, synced.checkout.channel.slug);
				if (!completeResult.ok) throw new Error(completeResult.error);
			} catch (error) {
				const message = error instanceof Error && error.message ? error.message : t("paystackReturnFailed");
				console.error("Paystack return completion failed:", error);
				stashPaymentCompletionError(message);
				setError(message);
				clearPaymentCompleting();
				started.current = false;
			}
		})();
	}, [checkoutId, queryTransactionId, reference, setError, t]);

	return null;
}
