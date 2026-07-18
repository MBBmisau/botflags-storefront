import { afterEach, describe, expect, it } from "vitest";
import {
	initializeConsentDefaults,
	isAnalyticsDebugMode,
	prepareTagManager,
	resetTagManagerStateForTests,
	sanitizeAnalyticsValue,
	sanitizePathname,
	trackEvent,
	trackPageView,
	updateAnalyticsConsent,
} from "./tag-manager";

afterEach(() => {
	resetTagManagerStateForTests();
	Reflect.deleteProperty(globalThis, "window");
});

describe("Google Tag Manager analytics", () => {
	it("queues consent commands in the native arguments format", () => {
		const dataLayer: unknown[] = [];
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dataLayer },
		});

		initializeConsentDefaults();

		expect(Array.isArray(dataLayer[0])).toBe(false);
		expect(Array.from(dataLayer[0] as IArguments)).toEqual([
			"consent",
			"default",
			expect.objectContaining({ analytics_storage: "denied" }),
		]);
	});

	it("drops query strings and fragments from manual page views", () => {
		expect(sanitizePathname("/checkout?checkout=secret&email=a@example.com#payment")).toBe("/checkout");
		expect(sanitizePathname("en/nigeria-ngn/products/dress?variant=123")).toBe(
			"/en/nigeria-ngn/products/dress",
		);
	});

	it("enables DebugView through an explicit query flag without including it in page paths", () => {
		expect(isAnalyticsDebugMode("?debug_mode=true")).toBe(true);
		expect(isAnalyticsDebugMode("?debug_mode=false")).toBe(false);
		expect(isAnalyticsDebugMode("", true)).toBe(true);
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

	it("queues the GTM bootstrap only once and carries debug mode into events", () => {
		const dataLayer: unknown[] = [];
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dataLayer },
		});

		prepareTagManager(true, 1234);
		prepareTagManager(true, 5678);
		updateAnalyticsConsent("granted");
		trackPageView("/en/nigeria-ngn/products?debug_mode=true", "Products");

		expect(dataLayer).toEqual([
			{ "gtm.start": 1234, event: "gtm.js" },
			{
				event: "page_view",
				debug_mode: true,
				page_path: "/en/nigeria-ngn/products",
				page_title: "Products",
			},
		]);
	});

	it("clears ecommerce state before each typed ecommerce event", () => {
		const dataLayer: unknown[] = [];
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dataLayer },
		});
		prepareTagManager(true, 1234);
		updateAnalyticsConsent("granted");
		const payload = {
			currency: "NGN",
			value: 30_000,
			items: [{ item_id: "p1", item_name: "Dress", price: 30_000 }],
		};

		trackEvent("view_item", payload);

		expect(dataLayer.slice(-2)).toEqual([
			{ ecommerce: null },
			{ event: "view_item", debug_mode: true, ecommerce: payload },
		]);
	});

	it("sends search and authentication parameters at event scope only after consent", () => {
		const dataLayer: unknown[] = [];
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { dataLayer },
		});
		prepareTagManager(false, 1234);

		trackEvent("search", { search_term: "ignored" });
		expect(dataLayer).toHaveLength(1);

		updateAnalyticsConsent("granted");
		trackEvent("search", { search_term: "black dress" });
		trackEvent("login", { method: "email" });
		trackEvent("sign_up", { method: "email" });

		expect(dataLayer.slice(-3)).toEqual([
			{ event: "search", debug_mode: false, search_term: "black dress" },
			{ event: "login", debug_mode: false, method: "email" },
			{ event: "sign_up", debug_mode: false, method: "email" },
		]);
	});
});
