import { afterEach, describe, expect, it } from "vitest";
import { sanitizeAnalyticsValue, sanitizePathname, trackEvent, updateAnalyticsConsent } from "./gtag";

afterEach(() => {
	updateAnalyticsConsent("denied");
	Reflect.deleteProperty(globalThis, "window");
});

describe("analytics data safety", () => {
	it("drops query strings and fragments from manual page views", () => {
		expect(sanitizePathname("/checkout?checkout=secret&email=a@example.com#payment")).toBe("/checkout");
		expect(sanitizePathname("en/nigeria-ngn/products/dress?variant=123")).toBe(
			"/en/nigeria-ngn/products/dress",
		);
	});

	it("removes blocked PII fields and redacts accidental email strings", () => {
		expect(
			sanitizeAnalyticsValue({
				currency: "NGN",
				email: "buyer@example.com",
				phone: "+2348067476584",
				checkout_token: "secret",
				items: [{ item_name: "Contact buyer@example.com", item_id: "p1" }],
			}),
		).toEqual({
			currency: "NGN",
			items: [{ item_name: "[redacted]", item_id: "p1" }],
		});
	});

	it("sends typed events only after analytics consent is granted", () => {
		const calls: unknown[][] = [];
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { gtag: (...args: unknown[]) => calls.push(args) },
		});
		const payload = {
			currency: "NGN",
			value: 30_000,
			items: [{ item_id: "p1", item_name: "Dress", price: 30_000 }],
		};

		updateAnalyticsConsent("denied");
		trackEvent("view_item", payload);
		expect(calls.filter(([command]) => command === "event")).toHaveLength(0);

		updateAnalyticsConsent("granted");
		trackEvent("view_item", payload);
		expect(calls.at(-1)).toEqual(["event", "view_item", payload]);
	});
});
