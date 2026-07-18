"use client";

import Link from "next/link";
import { Button } from "@/ui/components/ui/button";

export function AnalyticsConsentBanner({
	privacyHref,
	isPreferences,
	onAccept,
	onReject,
}: {
	privacyHref: string;
	isPreferences: boolean;
	onAccept: () => void;
	onReject: () => void;
}) {
	return (
		<section
			role="dialog"
			aria-modal="false"
			aria-labelledby="analytics-consent-title"
			className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-2xl rounded-card border border-border bg-background p-5 shadow-xl sm:p-6"
		>
			<h2 id="analytics-consent-title" className="font-semibold">
				{isPreferences ? "Analytics preferences" : "Your privacy choices"}
			</h2>
			<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
				We use optional Google analytics cookies, managed through Google Tag Manager, to understand how the
				Botflags store is used and improve the shopping experience. Analytics is off unless you accept.
				Advertising and personalization remain off. Read our{" "}
				<Link href={privacyHref} className="font-medium text-foreground underline underline-offset-4">
					privacy and cookie notice
				</Link>
				.
			</p>
			<div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
				<Button type="button" variant="outline-solid" onClick={onReject}>
					Reject analytics
				</Button>
				<Button type="button" onClick={onAccept}>
					Accept analytics
				</Button>
			</div>
		</section>
	);
}
