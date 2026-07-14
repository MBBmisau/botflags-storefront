/**
 * Shared Logo Component
 *
 * - /public/logo.svg — default (light backgrounds)
 * - /public/logo-dark.svg — inverted surfaces (e.g. footer on bg-foreground)
 *
 * @example
 * <Logo className="h-7 w-auto" />
 * <Logo className="h-7 w-auto" inverted />
 */

interface LogoProps {
	className?: string;
	/** Accessible label for the logo */
	ariaLabel?: string;
	/** Light logo for dark/inverted backgrounds (footer) */
	inverted?: boolean;
}

export const Logo = ({ className, ariaLabel = "Botflags", inverted = false }: LogoProps) => {
	return (
		<span
			role="img"
			aria-label={ariaLabel}
			className={`inline-flex items-center font-sans text-xl font-extrabold tracking-tight ${
				inverted ? "text-background" : "text-foreground"
			} ${className ?? ""}`}
		>
			Botflags<span className="text-primary">.</span>
		</span>
	);
};
