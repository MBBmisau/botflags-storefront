import { SaleorApp } from "@saleor/app-sdk/saleor-app";
import { PostgresAPL } from "@/lib/postgres-apl";

export const saleorApp = new SaleorApp({ apl: new PostgresAPL() });
