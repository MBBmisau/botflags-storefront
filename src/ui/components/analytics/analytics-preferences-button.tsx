"use client";

import { OPEN_ANALYTICS_PREFERENCES_EVENT } from "@/lib/analytics/consent";
import { cn } from "@/lib/utils";

export function AnalyticsPreferencesButton({ inverted = false }: { inverted?: boolean }) {
	return (
		<button
			type="button"
			className={cn(
				"text-xs underline underline-offset-4 transition-colors",
				inverted ? "text-inverse-muted hover:text-inverse-subtle" : "text-foreground hover:text-primary",
			)}
			onClick={() => window.dispatchEvent(new Event(OPEN_ANALYTICS_PREFERENCES_EVENT))}
		>
			Cookie preferences
		</button>
	);
}
