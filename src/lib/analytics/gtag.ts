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
let analyticsConsent: AnalyticsConsent = "denied";

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
	window.dataLayer = window.dataLayer || [];
	window.gtag =
		window.gtag ||
		function gtag() {
			// Google Tag's command queue requires the native `arguments` object.
			// A rest-parameter array looks equivalent but is silently ignored by gtag.js.
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

export function trackEvent<Name extends AnalyticsEventName>(
	name: Name,
	payload: AnalyticsEventPayloads[Name],
) {
	if (analyticsConsent !== "granted") return;
	window.gtag?.("event", name, sanitizeAnalyticsValue(payload));
}

export function trackPageView(pathname: string, title?: string) {
	if (analyticsConsent !== "granted") return;
	window.gtag?.("event", "page_view", {
		page_path: sanitizePathname(pathname),
		page_title: title,
	});
}

export function canTrackAnalytics(): boolean {
	return analyticsConsent === "granted";
}
