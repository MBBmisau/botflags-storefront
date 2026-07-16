import "../globals.css";
import { Suspense, type ReactNode } from "react";
import { rootMetadata } from "@/lib/seo";
import { getDefaultLocaleSlug, resolveLocaleFromSlug } from "@/config/locale";
import { getRootHtmlFontProps } from "@/lib/fonts";
import { AnalyticsProvider } from "@/ui/components/analytics/analytics-provider";

export const metadata = rootMetadata;

/**
 * Root layout for locale-less top-level routes (`/` redirect and global fallbacks).
 *
 * One of the app's multiple root layouts: storefront (`[locale]`) and checkout each render
 * their own `<html>`. This one uses the default locale's `htmlLang` since it has no segment.
 */
export default function RootGroupLayout({ children }: { children: ReactNode }) {
	const htmlLang = resolveLocaleFromSlug(getDefaultLocaleSlug()).htmlLang;
	const htmlProps = getRootHtmlFontProps(htmlLang);

	return (
		<html {...htmlProps}>
			<body className="min-h-dvh font-sans">
				{children}
				<Suspense fallback={null}>
					<AnalyticsProvider privacyHref="/en/nigeria-ngn/privacy" />
				</Suspense>
			</body>
		</html>
	);
}
