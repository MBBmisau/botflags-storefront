"use client";

import Image from "next/image";
import type { HomepageHeroSlideContent } from "@/lib/content/types";
import { PLP_HERO_IMAGE_SIZES, PRODUCT_IMAGE_QUALITY } from "@/lib/images";
import { NavHrefLink } from "@/ui/atoms/nav-href-link";
import { buttonClassName } from "@/ui/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselDots,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
	useCarousel,
} from "@/ui/components/ui/carousel";
import { PromotionViewTracker } from "@/ui/components/analytics/ecommerce-trackers";
import { promotionPayload, type AnalyticsPromotion } from "@/lib/analytics/ecommerce";
import { trackEvent } from "@/lib/analytics/gtag";

function VisiblePromotionTracker({ promotions }: { promotions: readonly AnalyticsPromotion[] }) {
	const { selectedIndex } = useCarousel();
	const promotion = promotions[selectedIndex];

	return promotion ? <PromotionViewTracker promotion={promotion} /> : null;
}

export function FashionHeroCarousel({
	slides,
	promotions,
}: {
	slides: readonly HomepageHeroSlideContent[];
	promotions: readonly AnalyticsPromotion[];
}) {
	if (slides.length === 0) return null;
	const trackSelection = (promotion: AnalyticsPromotion | undefined) => {
		if (promotion) trackEvent("select_promotion", promotionPayload(promotion));
	};

	return (
		<Carousel opts={{ loop: true }} aria-label="Botflags featured collections">
			<VisiblePromotionTracker promotions={promotions} />
			<CarouselContent className="ml-0" viewportClassName="bg-foreground">
				{slides.map((slide, index) => {
					const headingId = `fashion-hero-${slide.id}`;
					const promotion = promotions[index];
					return (
						<CarouselItem key={slide.id} className="pl-0">
							<section
								className="relative isolate flex min-h-[calc(100svh-var(--chrome-offset))] items-end overflow-hidden bg-foreground"
								aria-labelledby={headingId}
							>
								<Image
									src={slide.image}
									alt={slide.imageAlt}
									fill
									priority={index === 0}
									sizes={PLP_HERO_IMAGE_SIZES}
									quality={PRODUCT_IMAGE_QUALITY}
									className="-z-10 object-cover"
								/>
								<div
									className="absolute inset-0 -z-10 bg-gradient-to-t from-foreground/80 via-foreground/30 to-foreground/5"
									aria-hidden="true"
								/>
								<div className="container-super-wide pb-section-md pt-section-lg">
									<div className="max-w-2xl">
										{slide.eyebrow ? (
											<p className="text-eyebrow uppercase text-background">{slide.eyebrow}</p>
										) : null}
										<h1 id={headingId} className="mt-4 text-balance text-display text-background">
											{slide.heading}
										</h1>
										{slide.subheading ? (
											<p className="mt-6 max-w-prose text-pretty text-lead text-background">
												{slide.subheading}
											</p>
										) : null}
										<div className="mt-9 flex flex-wrap gap-3">
											<NavHrefLink
												href={slide.primaryCtaHref}
												className={buttonClassName({ asLink: true, size: "lg" })}
												onClick={() => trackSelection(promotion)}
											>
												{slide.primaryCtaLabel}
											</NavHrefLink>
											{slide.secondaryCtaLabel && slide.secondaryCtaHref ? (
												<NavHrefLink
													href={slide.secondaryCtaHref}
													className={buttonClassName({
														asLink: true,
														size: "lg",
														variant: "outline-solid",
														className:
															"border-background/40 bg-background/10 text-background hover:bg-background/20",
													})}
													onClick={() => trackSelection(promotion)}
												>
													{slide.secondaryCtaLabel}
												</NavHrefLink>
											) : null}
										</div>
									</div>
								</div>
							</section>
						</CarouselItem>
					);
				})}
			</CarouselContent>
			<CarouselPrevious className="left-4 top-1/2 hidden h-11 w-11 border-background/30 bg-background/90 hover:bg-background sm:inline-flex lg:left-8" />
			<CarouselNext className="right-4 top-1/2 hidden h-11 w-11 border-background/30 bg-background/90 hover:bg-background sm:inline-flex lg:right-8" />
			<div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-button bg-background/90 px-3 py-2 shadow-card backdrop-blur-sm">
				<CarouselDots count={slides.length} />
			</div>
		</Carousel>
	);
}
