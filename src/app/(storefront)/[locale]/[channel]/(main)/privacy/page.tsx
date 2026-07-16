import type { Metadata } from "next";
import { AnalyticsPreferencesButton } from "@/ui/components/analytics/analytics-preferences-button";

export const metadata: Metadata = {
	title: "Privacy and Cookie Notice",
	description: "How Botflags Technologies uses cookies and analytics on its storefront.",
};

export default function PrivacyPage() {
	return (
		<article className="container-content max-w-3xl py-12 sm:py-16">
			<p className="text-eyebrow uppercase text-muted-foreground">Botflags Technologies</p>
			<h1 className="mt-3 text-balance text-h1">Privacy and Cookie Notice</h1>
			<p className="mt-4 text-sm text-muted-foreground">
				Temporary preview notice · Last updated 16 July 2026
			</p>

			<div className="prose prose-neutral mt-10 max-w-none">
				<p>
					We use the information needed to operate this storefront, process orders, deliver purchases, prevent
					fraud, and respond to support requests. Optional analytics is disabled unless you choose to accept
					it.
				</p>
				<h2>Google Analytics 4</h2>
				<p>
					If you accept analytics, Google Analytics 4 records sanitized page paths and ecommerce actions such
					as product views, cart activity, checkout progress, and completed purchase totals in NGN. We do not
					send your email address, phone number, delivery address, customer name, checkout token, or payment
					details to Google Analytics.
				</p>
				<h2>Your choice</h2>
				<p>
					Your analytics preference is stored in a first-party cookie for up to 180 days. Advertising storage,
					advertising user data, and ad personalization are always denied in this implementation. You can
					change your choice at any time.
				</p>
				<AnalyticsPreferencesButton />
				<h2>Contact</h2>
				<p>
					Questions about privacy can be sent to{" "}
					<a href="mailto:support@botflags.com">support@botflags.com</a>.
				</p>
				<p>
					This temporary notice must be reviewed and replaced with an approved Nigeria-specific privacy policy
					before commercial launch.
				</p>
			</div>
		</article>
	);
}
