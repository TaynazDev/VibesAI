type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export function VibesAiLogo({ className, alt = "VibesAI logo" }: BrandLogoProps) {
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <picture className={className}>
      <source media="(prefers-color-scheme: dark)" srcSet={`${baseUrl}branding/vibesai-logo-dark.jpg`} />
      <img src={`${baseUrl}branding/vibesai-logo-light.jpg`} alt={alt} />
    </picture>
  );
}

export function PrismSuiteLogo({ className, alt = "Prism suite logo" }: BrandLogoProps) {
  const baseUrl = import.meta.env.BASE_URL;
  return <img className={className} src={`${baseUrl}branding/prism-suite-logo.png`} alt={alt} />;
}
