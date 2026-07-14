#!/usr/bin/env node

import fs from "node:fs";

const apply = process.argv.includes("--apply");
if (!apply && !process.argv.includes("--dry-run")) {
	throw new Error("Choose exactly one mode: --dry-run or --apply");
}

const apiUrl = process.env.SALEOR_API_URL ?? process.env.NEXT_PUBLIC_SALEOR_API_URL;
const token = process.env.SALEOR_CONFIGURATOR_TOKEN;
if (!apiUrl) throw new Error("SALEOR_API_URL is required");
if (apply && !token) throw new Error("SALEOR_CONFIGURATOR_TOKEN is required with --apply");

const products = [
	["summer-black-dress", "Summer Black Dress", "Women", "Black", 30000, 37500],
	["black-suit", "Black Suit", "Men", "Black", 45000, null],
	["black-long-dress", "Black Long Dress", "Women", "Black", 24000, 30000],
	["black-leather-jacket", "Black Leather Jacket", "Men", "Black", 60000, 75000],
	["blue-womens-suit", "Blue Women’s Suit", "Women", "Blue", 30000, 37500],
	["white-long-sleeve-shirt", "White Long-Sleeve Shirt", "Men", "White", 45000, null],
	["yellow-mens-suit", "Yellow Men’s Suit", "Men", "Yellow", 24000, 30000],
	["red-dress", "Red Dress", "Women", "Red", 60000, 75000],
];

const summary = {
	mode: apply ? "apply" : "dry-run",
	channel: "nigeria-ngn",
	warehouse: "Botflags Demo Warehouse",
	categories: ["Men", "Women", "Accessories"],
	collections: ["Popular Products", "Latest Products"],
	products: products.map(([, name]) => name),
	shipping: [3500, 5500, 7500, "free >= 150000"],
	tax: "NGN prices entered/displayed gross; 7.5% provisional rate metadata",
};

if (!apply) {
	console.log(JSON.stringify(summary, null, 2));
	process.exit(0);
}

async function gql(query, variables = {}) {
	const response = await fetch(apiUrl, {
		method: "POST",
		headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
		body: JSON.stringify({ query, variables }),
	});
	const body = await response.json();
	if (!response.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
	const mutation = Object.values(body.data ?? {})[0];
	if (mutation?.errors?.length) throw new Error(JSON.stringify(mutation.errors));
	return body.data;
}

async function uploadProductImage(productId, index, alt) {
	const imagePath = new URL(`../public/brand/products/${index}.jpg`, import.meta.url);
	const form = new FormData();
	form.set(
		"operations",
		JSON.stringify({
			query: `mutation BotflagsMedia($input: ProductMediaCreateInput!) { productMediaCreate(input: $input) { errors { field message code } media { id } } }`,
			variables: { input: { product: productId, alt, image: null } },
		}),
	);
	form.set("map", JSON.stringify({ 0: ["variables.input.image"] }));
	form.set("0", new Blob([fs.readFileSync(imagePath)], { type: "image/jpeg" }), `${index}.jpg`);
	const response = await fetch(apiUrl, {
		method: "POST",
		headers: { authorization: `Bearer ${token}` },
		body: form,
	});
	const body = await response.json();
	if (!response.ok || body.errors || body.data?.productMediaCreate?.errors?.length) {
		throw new Error(JSON.stringify(body.errors ?? body.data?.productMediaCreate?.errors ?? body));
	}
}

async function inventory() {
	const data = await gql(`query BotflagsInventory {
		channels { id slug currencyCode taxConfiguration { id } }
		warehouses(first: 100) { edges { node { id slug name } } }
		categories(first: 100, level: 0) { edges { node { id slug name } } }
		collections(first: 100) { edges { node { id slug name } } }
		attributes(first: 100) { edges { node { id slug name } } }
		productTypes(first: 100) { edges { node { id slug name } } }
		shippingZones(first: 100) { edges { node { id name shippingMethods { id name } } } }
		products(first: 100) { edges { node { id slug media { id } variants { id name } } } }
	}`);
	return data;
}

await gql(
	`mutation BotflagsShop($input: ShopSettingsInput!) {
	shopSettingsUpdate(input: $input) { errors { field message code } shop { name domain { host } } }
}`,
	{
		input: {
			name: "Botflags Technologies",
			description: "Botflags fashion and lifestyle storefront for Nigeria.",
			defaultMailSenderName: "Botflags Technologies",
			defaultMailSenderAddress: "support@botflags.com",
			displayGrossPrices: true,
			includeTaxesInPrices: true,
			metadata: [
				{ key: "botflags.localization", value: "en-NG" },
				{ key: "botflags.provisionalVatRate", value: "7.5" },
			],
		},
	},
);

let state = await inventory();
let channel = state.channels.find((item) => item.slug === "nigeria-ngn");
if (!channel) {
	const data = await gql(
		`mutation BotflagsChannel($input: ChannelCreateInput!) {
		channelCreate(input: $input) { errors { field message code } channel { id slug currencyCode } }
	}`,
		{
			input: {
				name: "Nigeria NGN",
				slug: "nigeria-ngn",
				currencyCode: "NGN",
				defaultCountry: "NG",
				isActive: true,
			},
		},
	);
	channel = data.channelCreate.channel;
}

let warehouse = state.warehouses.edges
	.map(({ node }) => node)
	.find((item) => item.slug === "botflags-demo-warehouse");
if (!warehouse) {
	const data = await gql(
		`mutation BotflagsWarehouse($input: WarehouseCreateInput!) {
		createWarehouse(input: $input) { errors { field message code } warehouse { id slug } }
	}`,
		{
			input: {
				name: "Botflags Demo Warehouse",
				slug: "botflags-demo-warehouse",
				email: "support@botflags.com",
				externalReference: "botflags-demo-warehouse",
				address: {
					firstName: "Botflags",
					lastName: "Technologies",
					companyName: "Botflags Technologies",
					streetAddress1: "Demo Warehouse, Bauchi",
					city: "Bauchi",
					countryArea: "Bauchi",
					postalCode: "",
					country: "NG",
					phone: "+2348067476584",
				},
			},
		},
	);
	warehouse = data.createWarehouse.warehouse;
}

await gql(
	`mutation BotflagsChannelWarehouses($id: ID!, $input: ChannelUpdateInput!) {
	channelUpdate(id: $id, input: $input) { errors { field message code } channel { id } }
}`,
	{ id: channel.id, input: { addWarehouses: [warehouse.id], isActive: true, defaultCountry: "NG" } },
);

await gql(
	`mutation BotflagsTax($id: ID!, $input: TaxConfigurationUpdateInput!) {
	taxConfigurationUpdate(id: $id, input: $input) { errors { field message code } taxConfiguration { chargeTaxes displayGrossPrices pricesEnteredWithTax } }
}`,
	{
		id: channel.taxConfiguration.id,
		input: {
			chargeTaxes: true,
			displayGrossPrices: true,
			pricesEnteredWithTax: true,
			taxCalculationStrategy: "FLAT_RATES",
		},
	},
);

state = await inventory();
let shippingZone = state.shippingZones.edges
	.map(({ node }) => node)
	.find((item) => item.name === "Botflags Nigeria Delivery");
if (!shippingZone) {
	const data = await gql(
		`mutation BotflagsShippingZone($input: ShippingZoneCreateInput!) {
		shippingZoneCreate(input: $input) { errors { field message code } shippingZone { id name shippingMethods { id name } } }
	}`,
		{
			input: {
				name: "Botflags Nigeria Delivery",
				description: "State-aware Botflags delivery; rates are filtered by the commerce app.",
				countries: ["NG"],
				addChannels: [channel.id],
				addWarehouses: [warehouse.id],
			},
		},
	);
	shippingZone = data.shippingZoneCreate.shippingZone;
}
for (const method of [
	{ name: "Botflags Staff — Lagos", price: 3500, maximumOrderPrice: 149999.99 },
	{ name: "Botflags Staff — Major Cities", price: 5500, maximumOrderPrice: 149999.99 },
	{ name: "Botflags Staff — Rest of Nigeria", price: 7500, maximumOrderPrice: 149999.99 },
	{ name: "Botflags Staff — Free Nigeria Delivery", price: 0, minimumOrderPrice: 150000 },
]) {
	let existing = shippingZone.shippingMethods.find((item) => item.name === method.name);
	if (!existing) {
		const data = await gql(
			`mutation BotflagsShippingMethod($input: ShippingPriceInput!) {
			shippingPriceCreate(input: $input) { errors { field message code } shippingMethod { id name } }
		}`,
			{
				input: {
					name: method.name,
					shippingZone: shippingZone.id,
					type: "PRICE",
					description: JSON.stringify({
						time: Date.now(),
						blocks: [
							{
								type: "paragraph",
								data: { text: "Internal fallback method filtered by the Botflags Commerce app." },
							},
						],
					}),
				},
			},
		);
		existing = data.shippingPriceCreate.shippingMethod;
	}
	await gql(
		`mutation BotflagsShippingMethodChannel($id: ID!, $input: ShippingMethodChannelListingInput!) {
		shippingMethodChannelListingUpdate(id: $id, input: $input) { errors { field message code } shippingMethod { id } }
	}`,
		{
			id: existing.id,
			input: {
				addChannels: [
					{
						channelId: channel.id,
						price: method.price,
						...(method.minimumOrderPrice ? { minimumOrderPrice: method.minimumOrderPrice } : {}),
						...(method.maximumOrderPrice ? { maximumOrderPrice: method.maximumOrderPrice } : {}),
					},
				],
			},
		},
	).catch((error) => {
		if (!String(error).includes("already")) throw error;
	});
}

const categoryIds = {};
for (const name of ["Men", "Women", "Accessories"]) {
	const slug = name.toLowerCase();
	let item = state.categories.edges.map(({ node }) => node).find((node) => node.slug === slug);
	if (!item) {
		const data = await gql(
			`mutation BotflagsCategory($input: CategoryInput!) {
			categoryCreate(input: $input) { errors { field message code } category { id slug } }
		}`,
			{
				input: {
					name,
					slug,
					seo: {
						title: `${name} | Botflags`,
						description: `Shop Botflags ${name.toLowerCase()} fashion in Nigeria.`,
					},
				},
			},
		);
		item = data.categoryCreate.category;
	}
	categoryIds[name] = item.id;
}

const attributeIds = {};
for (const spec of [
	{ name: "Size", slug: "size", inputType: "DROPDOWN", values: ["S", "M", "L", "XL"] },
	{ name: "Color", slug: "color", inputType: "SWATCH", values: ["Black", "Blue", "White", "Yellow", "Red"] },
]) {
	let item = state.attributes.edges.map(({ node }) => node).find((node) => node.slug === spec.slug);
	if (!item) {
		const data = await gql(
			`mutation BotflagsAttribute($input: AttributeCreateInput!) {
			attributeCreate(input: $input) { errors { field message code } attribute { id slug } }
		}`,
			{
				input: {
					name: spec.name,
					slug: spec.slug,
					type: "PRODUCT_TYPE",
					inputType: spec.inputType,
					isVariantOnly: true,
					visibleInStorefront: true,
					valueRequired: true,
					values: spec.values.map((name) => ({ name, value: name.toLowerCase() })),
				},
			},
		);
		item = data.attributeCreate.attribute;
	}
	attributeIds[spec.slug] = item.id;
}

let productType = state.productTypes.edges
	.map(({ node }) => node)
	.find((item) => item.slug === "botflags-fashion");
if (!productType) {
	const data = await gql(
		`mutation BotflagsProductType($input: ProductTypeInput!) {
		productTypeCreate(input: $input) { errors { field message code } productType { id slug } }
	}`,
		{
			input: {
				name: "Botflags Fashion",
				slug: "botflags-fashion",
				kind: "NORMAL",
				isShippingRequired: true,
				hasVariants: true,
				variantAttributes: [attributeIds.size, attributeIds.color],
			},
		},
	);
	productType = data.productTypeCreate.productType;
}

for (let index = 0; index < products.length; index++) {
	const [slug, name, category, color, price, priorPrice] = products[index];
	state = await inventory();
	let product = state.products.edges.map(({ node }) => node).find((item) => item.slug === slug);
	if (!product) {
		const data = await gql(
			`mutation BotflagsProduct($input: ProductCreateInput!) {
			productCreate(input: $input) { errors { field message code } product { id slug } }
		}`,
			{
				input: {
					name,
					slug,
					productType: productType.id,
					category: categoryIds[category],
					chargeTaxes: true,
					externalReference: `botflags-${slug}`,
					description: JSON.stringify({
						time: Date.now(),
						blocks: [
							{
								type: "paragraph",
								data: { text: `${name} is a Botflags demo fashion item for the protected preview catalog.` },
							},
						],
						version: "2.30.8",
					}),
					seo: {
						title: `${name} | Botflags`,
						description: `Shop ${name} from Botflags Technologies in Nigeria.`,
					},
				},
			},
		);
		product = data.productCreate.product;
	}
	await gql(
		`mutation BotflagsAssignProduct($id: ID!, $input: ProductChannelListingUpdateInput!) {
		productChannelListingUpdate(id: $id, input: $input) { errors { field message code } product { id } }
	}`,
		{
			id: product.id,
			input: { updateChannels: [{ channelId: channel.id, isPublished: false, visibleInListings: true }] },
		},
	);
	const variantIds = [];
	for (const [sizeIndex, size] of ["S", "M", "L", "XL"].entries()) {
		const variantName = `${color} / ${size}`;
		let variant = product.variants?.find((item) => item.name === variantName);
		if (!variant) {
			const data = await gql(
				`mutation BotflagsVariant($input: ProductVariantCreateInput!) {
				productVariantCreate(input: $input) { errors { field message code } productVariant { id name } }
			}`,
				{
					input: {
						product: product.id,
						name: variantName,
						sku: `BTF-${String(index + 1).padStart(3, "0")}-${size}`,
						trackInventory: true,
						stocks: [{ warehouse: warehouse.id, quantity: [7, 6, 6, 6][sizeIndex] }],
						attributes: [
							{ id: attributeIds.size, dropdown: { value: size } },
							{ id: attributeIds.color, swatch: { value: color } },
						],
					},
				},
			);
			variant = data.productVariantCreate.productVariant;
		}
		variantIds.push(variant.id);
		await gql(
			`mutation BotflagsVariantPrice($id: ID!, $input: [ProductVariantChannelListingAddInput!]!) {
			productVariantChannelListingUpdate(id: $id, input: $input) { errors { field message code } variant { id } }
		}`,
			{ id: variant.id, input: [{ channelId: channel.id, price, ...(priorPrice ? { priorPrice } : {}) }] },
		).catch((error) => {
			if (!String(error).includes("already exists")) throw error;
		});
	}
	await gql(
		`mutation BotflagsPublish($id: ID!, $input: ProductChannelListingUpdateInput!) {
		productChannelListingUpdate(id: $id, input: $input) { errors { field message code } product { id } }
	}`,
		{
			id: product.id,
			input: {
				updateChannels: [
					{ channelId: channel.id, isPublished: true, visibleInListings: true, isAvailableForPurchase: true },
				],
			},
		},
	);
	if (!product.media?.length) {
		await uploadProductImage(product.id, index + 1, name);
	}
}

state = await inventory();
const seededProductIds = state.products.edges
	.map(({ node }) => node)
	.filter((product) => products.some(([slug]) => slug === product.slug))
	.map((product) => product.id);
for (const [name, slug, selectedIds] of [
	["Popular Products", "popular-products", seededProductIds.slice(0, 4)],
	["Latest Products", "latest-products", seededProductIds],
]) {
	let collection = state.collections.edges.map(({ node }) => node).find((item) => item.slug === slug);
	if (!collection) {
		const data = await gql(
			`mutation BotflagsCollection($input: CollectionCreateInput!) {
			collectionCreate(input: $input) { errors { field message code } collection { id slug } }
		}`,
			{
				input: {
					name,
					slug,
					products: selectedIds,
					seo: { title: `${name} | Botflags`, description: `${name} from Botflags Technologies.` },
				},
			},
		);
		collection = data.collectionCreate.collection;
	} else {
		await gql(
			`mutation BotflagsCollectionProducts($id: ID!, $products: [ID!]!) {
			collectionAddProducts(collectionId: $id, products: $products) { errors { field message code } collection { id } }
		}`,
			{ id: collection.id, products: selectedIds },
		).catch((error) => {
			if (!String(error).includes("already")) throw error;
		});
	}
	await gql(
		`mutation BotflagsCollectionPublish($id: ID!, $input: CollectionChannelListingUpdateInput!) {
		collectionChannelListingUpdate(id: $id, input: $input) { errors { field message code } collection { id } }
	}`,
		{ id: collection.id, input: { addChannels: [{ channelId: channel.id, isPublished: true }] } },
	).catch((error) => {
		if (!String(error).includes("already")) throw error;
	});
}

console.log(JSON.stringify({ ...summary, result: "configuration applied" }, null, 2));
