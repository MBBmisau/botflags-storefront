import { ensureSchema } from "@/lib/db";

export async function GET() {
	try {
		await ensureSchema();
		return Response.json({ ok: true, service: "botflags-commerce" });
	} catch {
		return Response.json({ ok: false }, { status: 503 });
	}
}
