import { createAppRegisterHandler } from "@saleor/app-sdk/handlers/next-app-router";
import { env } from "@/lib/env";
import { saleorApp } from "@/lib/saleor-app";

export const POST = createAppRegisterHandler({
	apl: saleorApp.apl,
	allowedSaleorUrls: [(url) => url.replace(/\/$/, "") === env.SALEOR_API_URL.replace(/\/$/, "")],
});
