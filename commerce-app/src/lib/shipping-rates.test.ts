import { describe, expect, it } from "vitest";
import { FREE_SHIPPING_THRESHOLD, resolveShippingRate } from "./shipping-rates";

const quote = (state: string, subtotal = 20_000) =>
	resolveShippingRate({ countryCode: "NG", countryArea: state, currency: "NGN", subtotal });

describe("resolveShippingRate", () => {
	it("uses the Lagos band", () => expect(quote("Lagos State")?.amount).toBe(3_500));

	it.each([
		"FCT",
		"Federal Capital Territory",
		"Rivers",
		"Oyo",
		"Kano",
		"Edo",
		"Enugu",
		"Kaduna",
		"Delta",
		"Ogun State",
	])("uses the middle band for %s", (state) => expect(quote(state)?.amount).toBe(5_500));

	it("uses the rest-of-Nigeria band for a valid remaining state", () =>
		expect(quote("Bauchi")?.amount).toBe(7_500));

	it("makes the threshold inclusive", () => expect(quote("Bauchi", FREE_SHIPPING_THRESHOLD)?.amount).toBe(0));

	it("charges immediately below the threshold", () =>
		expect(quote("Bauchi", FREE_SHIPPING_THRESHOLD - 0.01)?.amount).toBe(7_500));

	it.each([
		{ countryCode: "NG", countryArea: "", currency: "NGN" },
		{ countryCode: "NG", countryArea: "Not a state", currency: "NGN" },
		{ countryCode: "GH", countryArea: "Greater Accra", currency: "NGN" },
		{ countryCode: "NG", countryArea: "Lagos", currency: "USD" },
	])("returns no method for invalid address/currency input", (input) => {
		expect(resolveShippingRate({ ...input, subtotal: 20_000 })).toBeNull();
	});
});
