import "../globals.css";
import { Suspense, type ReactNode } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getDefaultLocaleSlug, resolveLocaleFromSlug } from "@/config/locale";
import { getRootHtmlFontProps } from "@/lib/fonts";
import { AnalyticsProvider } from "@/ui/components/analytics/analytics-provider";

const defaultHtmlLang = resolveLocaleFromSlug(getDefaultLocaleSlug()).htmlLang;

/**
 * Checkout surface root layout — its own `<html>`/`<body>` (multiple root layouts).
 *
 * Locale-less surface: no `cookies()` here (blocks the route outside Suspense).
 * `html lang` defaults to `NEXT_PUBLIC_DEFAULT_LOCALE`; `CheckoutBrowseProvider`
 * syncs the resolved browse locale after RSC loads inside page Suspense.
 */
export default function CheckoutLayout(props: { children: ReactNode }) {
	const htmlProps = getRootHtmlFontProps(defaultHtmlLang);

	return (
		<html {...htmlProps}>
			<body className="min-h-dvh font-sans">
				<main className="min-h-dvh">{props.children}</main>
				<Suspense fallback={null}>
					<AnalyticsProvider privacyHref="/en/nigeria-ngn/privacy" />
				</Suspense>
				<SpeedInsights />
			</body>
		</html>
	);
}
