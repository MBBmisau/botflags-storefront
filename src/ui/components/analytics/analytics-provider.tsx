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
import {
	initializeConsentDefaults,
	isAnalyticsDebugMode,
	prepareTagManager,
	trackPageView,
	updateAnalyticsConsent,
} from "@/lib/analytics/tag-manager";
import type { AnalyticsConsent } from "@/lib/analytics/types";
import { AnalyticsConsentBanner } from "./analytics-consent-banner";

const containerId = process.env.NEXT_PUBLIC_GTM_ID?.trim() ?? "";
const isConfigured = /^GTM-[A-Z0-9]+$/.test(containerId);

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
		const debugMode = isAnalyticsDebugMode(
			window.location.search,
			process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true",
		);
		if (saved) {
			updateAnalyticsConsent(saved);
			if (saved === "granted") prepareTagManager(debugMode);
		}
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
		if (nextConsent === "granted") {
			prepareTagManager(
				isAnalyticsDebugMode(window.location.search, process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "true"),
			);
		} else {
			setTagReady(false);
		}
	};

	const shouldShowBanner = isConfigured && consent !== undefined && (consent === null || preferencesOpen);
	const shouldLoadTag = isConfigured && consent === "granted";

	return (
		<>
			{shouldLoadTag ? (
				<Script
					id="botflags-gtm"
					src={`https://www.googletagmanager.com/gtm.js?id=${containerId}`}
					strategy="afterInteractive"
					onReady={() => {
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
