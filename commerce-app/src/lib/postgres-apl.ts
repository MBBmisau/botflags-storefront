import type { APL, AuthData } from "@saleor/app-sdk/APL";
import { ensureSchema, pool } from "@/lib/db";

export class PostgresAPL implements APL {
	async get(saleorApiUrl: string): Promise<AuthData | undefined> {
		await ensureSchema();
		const result = await pool.query(
			"SELECT token, saleor_api_url, app_id, jwks FROM app_installations WHERE saleor_api_url = $1",
			[saleorApiUrl],
		);
		const row = result.rows[0] as
			| { token: string; saleor_api_url: string; app_id: string; jwks: string | null }
			| undefined;
		if (!row) return undefined;
		return {
			token: row.token,
			saleorApiUrl: row.saleor_api_url,
			appId: row.app_id,
			...(row.jwks ? { jwks: row.jwks } : {}),
		};
	}

	async set(authData: AuthData): Promise<void> {
		await ensureSchema();
		await pool.query(
			`INSERT INTO app_installations (saleor_api_url, token, app_id, jwks)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (saleor_api_url) DO UPDATE
       SET token = EXCLUDED.token, app_id = EXCLUDED.app_id, jwks = EXCLUDED.jwks, updated_at = now()`,
			[authData.saleorApiUrl, authData.token, authData.appId, authData.jwks ?? null],
		);
	}

	async delete(saleorApiUrl: string): Promise<void> {
		await ensureSchema();
		await pool.query("DELETE FROM app_installations WHERE saleor_api_url = $1", [saleorApiUrl]);
	}

	async getAll(): Promise<AuthData[]> {
		await ensureSchema();
		const result = await pool.query("SELECT token, saleor_api_url, app_id, jwks FROM app_installations");
		return result.rows.map((row) => ({
			token: row.token as string,
			saleorApiUrl: row.saleor_api_url as string,
			appId: row.app_id as string,
			...(row.jwks ? { jwks: row.jwks as string } : {}),
		}));
	}

	async isReady() {
		try {
			await ensureSchema();
			await pool.query("SELECT 1");
			return { ready: true as const };
		} catch (error) {
			return { ready: false as const, error: error instanceof Error ? error : new Error(String(error)) };
		}
	}

	async isConfigured() {
		return { configured: true as const };
	}
}
