import { describe, expect, it } from "vitest";
import { ANALYTICS_CONSENT_COOKIE, parseConsentCookie, serializeConsentCookie } from "./consent";

describe("analytics consent", () => {
	it("returns only supported persisted choices", () => {
		expect(parseConsentCookie(`other=1; ${ANALYTICS_CONSENT_COOKIE}=granted`)).toBe("granted");
		expect(parseConsentCookie(`${ANALYTICS_CONSENT_COOKIE}=denied`)).toBe("denied");
		expect(parseConsentCookie(`${ANALYTICS_CONSENT_COOKIE}=maybe`)).toBeNull();
	});

	it("persists a first-party preference without making it server-readable", () => {
		const cookie = serializeConsentCookie("granted", true);
		expect(cookie).toContain(`${ANALYTICS_CONSENT_COOKIE}=granted`);
		expect(cookie).toContain("SameSite=Lax");
		expect(cookie).toContain("Secure");
		expect(cookie).not.toContain("HttpOnly");
	});
});
