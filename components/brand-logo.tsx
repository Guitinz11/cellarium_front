import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({ className = "", priority = false }: BrandLogoProps) {
  return (
    <span className={`relative block aspect-[5.45/1] overflow-hidden ${className}`}>
      <Image
        src="/logo.png"
        alt="Marcon"
        fill
        priority={priority}
        sizes="180px"
        className="object-cover"
      />
    </span>
  );
}
