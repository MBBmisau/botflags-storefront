"use client";

import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { buildStorefrontPath } from "@/lib/storefront-path";
import { trackEvent } from "@/lib/analytics/gtag";

export const SearchBar = ({
	locale,
	channel,
	placeholder,
	srOnlyLabel,
}: {
	locale: string;
	channel: string;
	placeholder: string;
	srOnlyLabel: string;
}) => {
	const router = useRouter();
	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const search = new FormData(event.currentTarget).get("search")?.toString().trim() ?? "";
		if (!search) return;
		trackEvent("search", { search_term: search });
		router.push(`${buildStorefrontPath(locale, channel, "/search")}?query=${encodeURIComponent(search)}`);
	};

	return (
		<form onSubmit={onSubmit} className="group relative w-full max-w-md">
			<label className="relative block">
				<span className="sr-only">{srOnlyLabel}</span>
				{/* Search icon */}
				<span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
					<SearchIcon
						className="h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground"
						aria-hidden
					/>
				</span>
				{/* Input */}
				<input
					type="text"
					name="search"
					placeholder={placeholder}
					autoComplete="off"
					required
					className="focus:outline-hidden h-10 w-full rounded-lg border border-transparent bg-secondary py-2 pl-11 pr-4 text-sm text-foreground transition-all placeholder:text-muted-foreground hover:border-border hover:bg-secondary/80 focus:border-ring focus:bg-background focus:ring-1 focus:ring-ring"
				/>
			</label>
		</form>
	);
};
