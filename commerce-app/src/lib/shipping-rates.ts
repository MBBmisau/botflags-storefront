export const FREE_SHIPPING_THRESHOLD = 150_000;
export const STAFF_METHOD_PREFIX = "Botflags Staff — ";

const NIGERIAN_STATES = new Set([
	"abia",
	"adamawa",
	"akwa ibom",
	"anambra",
	"bauchi",
	"bayelsa",
	"benue",
	"borno",
	"cross river",
	"delta",
	"ebonyi",
	"edo",
	"ekiti",
	"enugu",
	"fct",
	"federal capital territory",
	"gombe",
	"imo",
	"jigawa",
	"kaduna",
	"kano",
	"katsina",
	"kebbi",
	"kogi",
	"kwara",
	"lagos",
	"nasarawa",
	"niger",
	"ogun",
	"ondo",
	"osun",
	"oyo",
	"plateau",
	"rivers",
	"sokoto",
	"taraba",
	"yobe",
	"zamfara",
]);

const MAJOR_STATES = new Set([
	"fct",
	"federal capital territory",
	"rivers",
	"oyo",
	"kano",
	"edo",
	"enugu",
	"kaduna",
	"delta",
	"ogun",
]);

function normalizeState(countryArea: string): string {
	return countryArea
		.trim()
		.toLowerCase()
		.replace(/\s+state$/, "")
		.replace(/\s+/g, " ");
}

export type BotflagsShippingRate = {
	id:
		| "botflags-shipping-free"
		| "botflags-shipping-lagos"
		| "botflags-shipping-major"
		| "botflags-shipping-rest";
	name: string;
	staffName: string;
	amount: number;
	currency: "NGN";
	description: string;
};

export function sumCheckoutLineTotals(
	lines?: Array<{ undiscountedTotalPrice?: { amount?: number | null } | null }> | null,
): number {
	return (lines ?? []).reduce((total, line) => total + (line.undiscountedTotalPrice?.amount ?? 0), 0);
}

export function resolveShippingRate(input: {
	countryCode?: string | null;
	countryArea?: string | null;
	subtotal?: number | null;
	currency?: string | null;
}): BotflagsShippingRate | null {
	const state = input.countryArea ? normalizeState(input.countryArea) : "";
	if (
		input.countryCode?.toUpperCase() !== "NG" ||
		input.currency?.toUpperCase() !== "NGN" ||
		!NIGERIAN_STATES.has(state)
	)
		return null;

	if ((input.subtotal ?? 0) >= FREE_SHIPPING_THRESHOLD) {
		return {
			id: "botflags-shipping-free",
			name: "Free Nigeria Delivery",
			staffName: `${STAFF_METHOD_PREFIX}Free Nigeria Delivery`,
			amount: 0,
			currency: "NGN",
			description: "Free delivery for qualifying Botflags orders.",
		};
	}

	if (state === "lagos") {
		return {
			id: "botflags-shipping-lagos",
			name: "Lagos Delivery",
			staffName: `${STAFF_METHOD_PREFIX}Lagos`,
			amount: 3_500,
			currency: "NGN",
			description: "Delivery within Lagos State.",
		};
	}

	if (MAJOR_STATES.has(state)) {
		return {
			id: "botflags-shipping-major",
			name: "Major City Delivery",
			staffName: `${STAFF_METHOD_PREFIX}Major Cities`,
			amount: 5_500,
			currency: "NGN",
			description: "Delivery to selected major Nigerian cities and states.",
		};
	}

	return {
		id: "botflags-shipping-rest",
		name: "Nigeria Delivery",
		staffName: `${STAFF_METHOD_PREFIX}Rest of Nigeria`,
		amount: 7_500,
		currency: "NGN",
		description: "Delivery to all other supported Nigerian states.",
	};
}
