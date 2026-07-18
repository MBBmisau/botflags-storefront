import type { AnalyticsConsent, AnalyticsEventName, AnalyticsEventPayloads } from "./types";

declare global {
	interface Window {
		dataLayer?: unknown[];
		gtag?: (...args: unknown[]) => void;
	}
}

const BLOCKED_KEYS = new Set([
	"email",
	"phone",
	"address",
	"first_name",
	"last_name",
	"customer_name",
	"checkout_id",
	"checkout_token",
	"token",
]);
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const ECOMMERCE_EVENTS = new Set<AnalyticsEventName>([
	"view_item",
	"view_item_list",
	"select_item",
	"add_to_cart",
	"remove_from_cart",
	"view_cart",
	"begin_checkout",
	"add_shipping_info",
	"add_payment_info",
	"purchase",
	"view_promotion",
	"select_promotion",
]);

let analyticsConsent: AnalyticsConsent = "denied";
let analyticsDebugMode = false;
let tagManagerStarted = false;

function getDataLayer(): unknown[] | undefined {
	if (typeof window === "undefined") return undefined;
	window.dataLayer = window.dataLayer || [];
	return window.dataLayer;
}

export function sanitizePathname(pathname: string): string {
	const path = pathname.split(/[?#]/, 1)[0] || "/";
	return path.startsWith("/") ? path : `/${path}`;
}

export function isAnalyticsDebugMode(search: string, environmentDebug = false): boolean {
	if (environmentDebug) return true;
	return new URLSearchParams(search).get("debug_mode") === "true";
}

export function sanitizeAnalyticsValue(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sanitizeAnalyticsValue);
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value)
				.filter(([key]) => !BLOCKED_KEYS.has(key.toLowerCase()))
				.map(([key, nested]) => [key, sanitizeAnalyticsValue(nested)]),
		);
	}
	if (typeof value === "string" && EMAIL_PATTERN.test(value)) return "[redacted]";
	return value;
}

export function initializeConsentDefaults() {
	if (typeof window === "undefined") return;
	getDataLayer();
	window.gtag =
		window.gtag ||
		function gtag() {
			// Consent commands must use the native `arguments` queue format expected by Google Tag Manager.
			window.dataLayer?.push(arguments);
		};
	window.gtag("consent", "default", {
		analytics_storage: "denied",
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
		wait_for_update: 500,
	});
}

export function updateAnalyticsConsent(consent: AnalyticsConsent) {
	analyticsConsent = consent;
	if (typeof window === "undefined") return;
	window.gtag?.("consent", "update", {
		analytics_storage: consent,
		ad_storage: "denied",
		ad_user_data: "denied",
		ad_personalization: "denied",
	});
}

export function prepareTagManager(debugMode: boolean, startedAt = Date.now()) {
	analyticsDebugMode = debugMode;
	if (tagManagerStarted) return;
	getDataLayer()?.push({ "gtm.start": startedAt, event: "gtm.js" });
	tagManagerStarted = true;
}

export function trackEvent<Name extends AnalyticsEventName>(
	name: Name,
	payload: AnalyticsEventPayloads[Name],
) {
	if (analyticsConsent !== "granted") return;
	const dataLayer = getDataLayer();
	if (!dataLayer) return;

	const sanitizedPayload = sanitizeAnalyticsValue(payload) as Record<string, unknown>;
	if (ECOMMERCE_EVENTS.has(name)) {
		dataLayer.push({ ecommerce: null });
		dataLayer.push({ event: name, debug_mode: analyticsDebugMode, ecommerce: sanitizedPayload });
		return;
	}

	dataLayer.push({ event: name, debug_mode: analyticsDebugMode, ...sanitizedPayload });
}

export function trackPageView(pathname: string, title?: string) {
	if (analyticsConsent !== "granted") return;
	getDataLayer()?.push({
		event: "page_view",
		debug_mode: analyticsDebugMode,
		page_path: sanitizePathname(pathname),
		page_title: title,
	});
}

export function canTrackAnalytics(): boolean {
	return analyticsConsent === "granted";
}

export function resetTagManagerStateForTests() {
	analyticsConsent = "denied";
	analyticsDebugMode = false;
	tagManagerStarted = false;
}
