type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function VibesAiLogo({ className, alt = "VibesAI logo" }: BrandLogoProps) {
  return (
    <picture className={className}>
      <source media="(prefers-color-scheme: dark)" srcSet="/branding/vibesai-logo-dark.jpg" />
      <img src="/branding/vibesai-logo-light.jpg" alt={alt} />
    </picture>
  );
}

export function PrismSuiteLogo({ className, alt = "Prism suite logo" }: BrandLogoProps) {
  return <img className={className} src="/branding/prism-suite-logo.png" alt={alt} />;
}
