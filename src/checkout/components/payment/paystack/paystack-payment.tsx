"use client";

import { useState, type FC } from "react";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import type { AddressFragment, CheckoutFragment } from "@/checkout/graphql";
import type { BillingAddressData } from "@/checkout/components/payment/billing-address-section";
import { PaymentTrustSignals } from "@/checkout/components/payment/payment-trust-signals";
import { FreeOrderCheckout } from "@/checkout/components/payment/stripe/free-order-checkout";
import { useCheckoutData } from "@/checkout/providers/checkout-data";
import { getCheckoutTransport } from "@/checkout/lib/checkout-transport";
import {
	buildCheckoutPriceChangeNotice,
	getCheckoutPayAmount,
	getCheckoutPayCurrency,
	hasMaterialCheckoutTotalChange,
	isCheckoutFreeOrder,
	type CheckoutPriceChangeNotice,
} from "@/checkout/lib/payment/checkout-pay-amount";
import {
	markPaymentCompleting,
	clearPaymentCompleting,
} from "@/checkout/lib/payment/checkout-payment-completion";
import {
	getPaystackAuthorizationUrl,
	getPaystackTransactionError,
	PAYSTACK_GATEWAY_ID,
} from "@/checkout/lib/payment/providers/paystack";
import { storePaystackTransactionId } from "@/checkout/lib/payment/paystack-transaction-storage";
import { updateCheckoutBilling } from "@/checkout/lib/payment/update-billing";
import { Button } from "@/ui/components/ui/button";
import { LoadingSpinner } from "@/checkout/ui-kit/loading-spinner";
import { cartValue, commerceLineToAnalyticsItem } from "@/lib/analytics/ecommerce";
import { trackEvent } from "@/lib/analytics/gtag";

type PaystackBillingContext = {
	billingData: BillingAddressData;
	sameAsBilling: boolean;
	hasShippingAddress: boolean;
	shippingAddress: AddressFragment | null | undefined;
	userAddresses: ReadonlyArray<AddressFragment> | undefined;
	authenticated: boolean;
};

type PaystackPaymentProps = {
	checkout: CheckoutFragment;
	billing: PaystackBillingContext;
	onPaymentError: (message: string) => void;
	onBillingErrors: (errors: Record<string, string>, focusField?: string) => void;
	onPriceChangeNotice: (notice: CheckoutPriceChangeNotice) => void;
	onPaymentActivityChange?: (active: boolean) => void;
};

export const PaystackPayment: FC<PaystackPaymentProps> = ({
	checkout,
	billing,
	onPaymentError,
	onBillingErrors,
	onPriceChangeNotice,
	onPaymentActivityChange,
}) => {
	const t = useTranslations("checkout.payment");
	const { refreshCheckout } = useCheckoutData();
	const [isLoading, setIsLoading] = useState(false);

	if (isCheckoutFreeOrder(checkout)) {
		return (
			<FreeOrderCheckout
				checkout={checkout}
				billing={billing}
				onError={onPaymentError}
				onBillingErrors={onBillingErrors}
				onPaymentActivityChange={onPaymentActivityChange}
			/>
		);
	}

	const handlePay = async () => {
		let redirectStarted = false;
		onPaymentError("");
		setIsLoading(true);
		onPaymentActivityChange?.(true);

		try {
			const billingResult = await updateCheckoutBilling({ checkoutId: checkout.id, ...billing });
			if (!billingResult.ok) {
				onBillingErrors(billingResult.errors, billingResult.focusField);
				return;
			}

			const liveCheckout = await refreshCheckout({ updateState: false });
			if (!liveCheckout) {
				onPaymentError(t("totalsRefreshFailed"));
				return;
			}

			const displayedAmount = getCheckoutPayAmount(checkout);
			const amount = getCheckoutPayAmount(liveCheckout);
			const currency = getCheckoutPayCurrency(liveCheckout);
			if (amount === null || !currency) {
				onPaymentError(t("totalUnavailable"));
				return;
			}
			if (currency !== "NGN") {
				onPaymentError(t("paystackOnlyNgn"));
				return;
			}
			if (displayedAmount !== null && hasMaterialCheckoutTotalChange(displayedAmount, amount)) {
				onPriceChangeNotice(buildCheckoutPriceChangeNotice(displayedAmount, amount, currency));
				return;
			}

			const result = await getCheckoutTransport().initializeTransaction({
				checkoutId: liveCheckout.id,
				amount,
				paymentGateway: { id: PAYSTACK_GATEWAY_ID, data: {} },
			});
			if (!result.ok) {
				onPaymentError(result.error);
				return;
			}

			const transactionError = getPaystackTransactionError(result.data);
			const authorizationUrl = getPaystackAuthorizationUrl(result.data.data);
			const transactionId = result.data.transaction?.id;
			if (transactionError) {
				onPaymentError(transactionError);
				return;
			}
			if (!authorizationUrl || !transactionId) {
				onPaymentError(t("paystackDetailsUnavailable"));
				return;
			}

			trackEvent("add_payment_info", {
				currency,
				value: cartValue(liveCheckout.lines),
				coupon: liveCheckout.voucherCode || undefined,
				payment_type: "Paystack",
				items: liveCheckout.lines.map(commerceLineToAnalyticsItem),
			});

			storePaystackTransactionId(transactionId);
			markPaymentCompleting(liveCheckout.id);
			redirectStarted = true;
			window.location.assign(authorizationUrl);
		} catch (error) {
			console.error("Paystack payment initialization failed:", error);
			onPaymentError(t("unexpectedError"));
		} finally {
			if (!redirectStarted) {
				clearPaymentCompleting();
				setIsLoading(false);
				onPaymentActivityChange?.(false);
			}
		}
	};

	return (
		<div className="rounded-card border border-border bg-card p-5 shadow-card sm:p-6">
			<p className="text-sm text-muted-foreground">{t("paystackIntro")}</p>
			<PaymentTrustSignals provider="paystack" className="mt-5 justify-start" />
			<Button
				type="button"
				size="lg"
				className="mt-5 w-full sm:w-auto"
				disabled={isLoading}
				onClick={() => void handlePay()}
			>
				{isLoading ? (
					<span className="flex items-center gap-2">
						<LoadingSpinner />
						{t("paystackRedirecting")}
					</span>
				) : (
					<span className="flex items-center gap-2">
						{t("paystackRedirect")}
						<ExternalLink className="h-4 w-4" aria-hidden />
					</span>
				)}
			</Button>
		</div>
	);
};
