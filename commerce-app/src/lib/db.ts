import { Pool } from "pg";
import { env } from "@/lib/env";

export const pool = new Pool({ connectionString: env.DATABASE_URL, max: 8 });

let schemaPromise: Promise<void> | null = null;

export function ensureSchema(): Promise<void> {
	if (!schemaPromise) {
		schemaPromise = (async () => {
			await pool.query(`
        CREATE TABLE IF NOT EXISTS app_installations (
          saleor_api_url text PRIMARY KEY,
          token text NOT NULL,
          app_id text NOT NULL,
          jwks text,
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS paystack_payments (
          reference text PRIMARY KEY,
          transaction_id text NOT NULL UNIQUE,
          checkout_id text NOT NULL,
          saleor_api_url text NOT NULL,
          expected_amount numeric(18,2) NOT NULL,
          currency text NOT NULL,
          authorization_url text NOT NULL,
          status text NOT NULL DEFAULT 'initialized',
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS paystack_webhook_events (
          event_key text PRIMARY KEY,
          received_at timestamptz NOT NULL DEFAULT now()
        );
      `);
			await pool.query("ALTER TABLE paystack_payments ADD COLUMN IF NOT EXISTS authorization_url text");
		})().catch((error) => {
			schemaPromise = null;
			throw error;
		});
	}
	return schemaPromise;
}
