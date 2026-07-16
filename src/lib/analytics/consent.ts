import type { AnalyticsConsent } from "./types";

export const ANALYTICS_CONSENT_COOKIE = "botflags_analytics_consent_v1";
export const OPEN_ANALYTICS_PREFERENCES_EVENT = "botflags:open-analytics-preferences";
export const ANALYTICS_READY_EVENT = "botflags:analytics-ready";

export function parseConsentCookie(cookieHeader: string): AnalyticsConsent | null {
	const value = cookieHeader
		.split(";")
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
		?.split("=")[1];

	return value === "granted" || value === "denied" ? value : null;
}

export function serializeConsentCookie(consent: AnalyticsConsent, secure: boolean): string {
	return [
		`${ANALYTICS_CONSENT_COOKIE}=${consent}`,
		"Path=/",
		"Max-Age=15552000",
		"SameSite=Lax",
		secure ? "Secure" : "",
	]
		.filter(Boolean)
		.join("; ");
}
