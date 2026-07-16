"use client";

import { useTransition } from "react";
import { ariaDisabledClassName } from "@/ui/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics/gtag";
import type { AnalyticsItem } from "@/lib/analytics/types";

type Props = {
	deleteLine: () => Promise<void>;
	item: AnalyticsItem;
	currency: string;
};

export const DeleteLineButton = ({ deleteLine, item, currency }: Props) => {
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type="button"
			className={cn(
				"text-sm text-muted-foreground hover:text-foreground",
				ariaDisabledClassName,
				"aria-disabled:opacity-60",
			)}
			onClick={() => {
				if (isPending) return;
				trackEvent("remove_from_cart", {
					currency,
					value: item.price * (item.quantity ?? 1),
					items: [item],
				});
				startTransition(() => {
					void deleteLine();
				});
			}}
			aria-disabled={isPending}
		>
			{isPending ? "Removing" : "Remove"}
			<span className="sr-only">line from cart</span>
		</button>
	);
};
