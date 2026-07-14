import { brandConfig } from "@/config/brand";
import { STOREFRONT_CONTENT_VERSION, type StorefrontContent } from "@/lib/content/types";

/**
 * Code fallback for all storefront marketing copy.
 * Saleor PageType overrides merge on top when CONTENT_PROVIDER=saleor.
 *
 * English SoT for editorial copy — export to Configurator seed: pnpm content:export-seed
 */
export const defaultStorefrontContent = {
	version: STOREFRONT_CONTENT_VERSION,
	// Single source of truth for channel-wide facts. Copy references these via
	// `{freeShippingThreshold}` / `{returnsWindowDays}` tokens instead of baking the
	// numbers into strings, so the cart math, announcement, and trust labels never drift.
	policies: {
		shipping: {
			freeShippingThreshold: 150000,
		},
		returns: {
			windowDays: 30,
		},
	},
	chrome: {
		announcementBar: {
			id: "botflags-nigeria-launch",
			message: "Free delivery across Nigeria on orders over {freeShippingThreshold}",
			href: null,
			linkLabel: null,
			dismissible: true,
		},
		nav: {
			allProductsLabel: "All",
			viewAllLabel: "View all {label}",
		},
	},
	surfaces: {
		homepage: {
			hero: {
				eyebrow: "Botflags Edit 2026",
				heading: "Everyday style, made confident",
				subheading: brandConfig.tagline,
				primaryCtaLabel: "Shop the collection",
				slides: [
					{
						id: "new-season",
						eyebrow: "New season",
						heading: "Modern silhouettes for every day",
						subheading: "Clean lines, expressive colour, and easy pieces selected for life in motion.",
						image: "/brand/hero/hero-1.jpg",
						imageAlt: "Model wearing a contemporary Botflags fashion look",
						primaryCtaLabel: "Shop women",
						primaryCtaHref: "/categories/women",
						secondaryCtaLabel: "Shop all",
						secondaryCtaHref: "/products",
					},
					{
						id: "mens-edit",
						eyebrow: "The men's edit",
						heading: "Sharp dressing, without the fuss",
						subheading: "Versatile tailoring and relaxed staples for work, weekends, and everything between.",
						image: "/brand/hero/hero-2.jpg",
						imageAlt: "Model wearing a tailored menswear look",
						primaryCtaLabel: "Shop men",
						primaryCtaHref: "/categories/men",
					},
					{
						id: "accessories",
						eyebrow: "Finish the look",
						heading: "The details make it yours",
						subheading: "A considered selection of finishing pieces for effortless personal style.",
						image: "/brand/hero/hero-3.png",
						imageAlt: "A curated Botflags accessories and fashion campaign",
						primaryCtaLabel: "Shop accessories",
						primaryCtaHref: "/categories/accessories",
					},
				],
			},
			featuredCollection: {
				heading: "Popular right now",
				collectionSlug: "featured-products",
				limit: 8,
			},
			categories: {
				eyebrow: "Find your style",
				heading: "Shop by category",
				tiles: [
					{
						title: "Women",
						href: "/categories/women",
						image: "/brand/categories/women.jpg",
						imageAlt: "Women's fashion collection",
					},
					{
						title: "Men",
						href: "/categories/men",
						image: "/brand/categories/men.jpg",
						imageAlt: "Men's fashion collection",
					},
					{
						title: "Accessories",
						href: "/categories/accessories",
						image: "/brand/categories/accessories.jpg",
						imageAlt: "Fashion accessories collection",
					},
				],
			},
			photoCredits: [],
			brandStory: {
				heading: "Style that moves with you",
				paragraphs: [
					"Botflags brings together expressive, wearable pieces for people who want to look considered without feeling overdone.",
					"This protected preview uses a temporary fashion collection while we prepare the final Botflags product range and photography.",
				],
			},
			values: {
				heading: "Why shop with us",
				columns: [
					{
						title: "Curated style",
						text: "A focused edit of versatile pieces, selected to work harder in your wardrobe.",
					},
					{
						title: "Nigeria-wide delivery",
						text: "Clear state-based delivery pricing, with free delivery from {freeShippingThreshold}.",
					},
					{
						title: "Real support",
						text: "Questions about an order? Reach Botflags directly at support@botflags.com.",
					},
				],
				columnsDesktop: 3,
			},
			editorial: {
				heading: "Fresh looks, confident energy",
				paragraphs: [
					"From polished tailoring to bold occasion pieces, discover an edit designed to make getting dressed feel easy.",
				],
				imagePosition: "left",
				ctaLabel: "Explore new arrivals",
				image: "/brand/editorial/banner.jpg",
				imageAlt: "Botflags new-season fashion campaign",
			},
		},
		products: {
			title: "Shop Botflags",
			description: "Explore our current fashion edit, with delivery across Nigeria.",
		},
		cart: {
			empty: {
				title: "Your bag is empty",
				body: "Looks like you haven't added anything to your bag yet.",
				ctaLabel: "Start Shopping",
			},
			trust: {
				freeShippingPrefix: "Free delivery over",
				returnsLabel: "{returnsWindowDays}-day returns",
			},
			drawer: {
				title: "Your Bag",
				addForFreeShipping: "Add {amount} more for free shipping",
				freeShippingQualified: "You qualify for free shipping!",
			},
		},
		checkout: {
			emptyCart: {
				title: "Your cart is empty",
				body: "Looks like you haven't added anything to your cart yet.",
				startShoppingLabel: "Start Shopping",
				goBackLabel: "Go back",
			},
			emptySession: {
				title: "Your cart is empty",
				message: "Add items from the store, then return here to complete your purchase.",
			},
			marketingOptInLabel: "Email me with news and offers",
			trust: {
				secureCheckout: "Secure checkout",
				stripeProcessor: "Secure payments powered by Paystack",
			},
		},
	},
} satisfies StorefrontContent;
