import { z } from "zod";

const schema = z.object({
	DATABASE_URL: z.string().url(),
	SALEOR_API_URL: z.string().url(),
	APP_API_BASE_URL: z.string().url(),
	STOREFRONT_URL: z.string().url(),
	PAYSTACK_SECRET_KEY: z.string().min(12),
	PAYSTACK_PUBLIC_KEY: z.string().min(12),
});

export const env = schema.parse(process.env);
