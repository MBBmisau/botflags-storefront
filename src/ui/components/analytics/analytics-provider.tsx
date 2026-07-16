"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
	ANALYTICS_READY_EVENT,
	OPEN_ANALYTICS_PREFERENCES_EVENT,
	parseConsentCookie,
	serializeConsentCookie,
} from "@/lib/analytics/consent";
import { initializeConsentDefaults, trackPageView, updateAnalyticsConsent } from "@/lib/analytics/gtag";
import type { AnalyticsConsent } from "@/lib/analytics/types";
import { AnalyticsConsentBanner } from "./analytics-consent-banner";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const isConfigured = /^G-[A-Z0-9]+$/.test(measurementId);

function ManualPageViews({ ready }: { ready: boolean }) {
	const pathname = usePathname();

	useEffect(() => {
		if (!ready) return;
		trackPageView(pathname, document.title);
	}, [pathname, ready]);

	return null;
}

export function AnalyticsProvider({ privacyHref }: { privacyHref: string }) {
	const [consent, setConsent] = useState<AnalyticsConsent | null | undefined>(undefined);
	const [preferencesOpen, setPreferencesOpen] = useState(false);
	const [tagReady, setTagReady] = useState(false);

	useEffect(() => {
		initializeConsentDefaults();
		const saved = parseConsentCookie(document.cookie);
		if (saved) updateAnalyticsConsent(saved);
		queueMicrotask(() => setConsent(saved));

		const openPreferences = () => setPreferencesOpen(true);
		window.addEventListener(OPEN_ANALYTICS_PREFERENCES_EVENT, openPreferences);
		return () => window.removeEventListener(OPEN_ANALYTICS_PREFERENCES_EVENT, openPreferences);
	}, []);

	const saveConsent = (nextConsent: AnalyticsConsent) => {
		document.cookie = serializeConsentCookie(nextConsent, window.location.protocol === "https:");
		setConsent(nextConsent);
		setPreferencesOpen(false);
		updateAnalyticsConsent(nextConsent);
		if (nextConsent === "denied") setTagReady(false);
	};

	const shouldShowBanner = isConfigured && consent !== undefined && (consent === null || preferencesOpen);
	const shouldLoadTag = isConfigured && consent === "granted";

	return (
		<>
			{shouldLoadTag ? (
				<Script
					id="botflags-ga4"
					src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
					strategy="afterInteractive"
					onReady={() => {
						window.gtag?.("js", new Date());
						window.gtag?.("config", measurementId, {
							send_page_view: false,
							allow_google_signals: false,
							allow_ad_personalization_signals: false,
							debug_mode: process.env.NEXT_PUBLIC_GA_DEBUG === "true",
						});
						setTagReady(true);
						window.dispatchEvent(new Event(ANALYTICS_READY_EVENT));
					}}
				/>
			) : null}
			<ManualPageViews ready={tagReady} />
			{shouldShowBanner ? (
				<AnalyticsConsentBanner
					privacyHref={privacyHref}
					isPreferences={preferencesOpen || consent !== null}
					onAccept={() => saveConsent("granted")}
					onReject={() => saveConsent("denied")}
				/>
			) : null}
		</>
	);
}
