// Heading.tsx
import { FC } from "react";

interface HeadingProps {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  children: React.ReactNode;
}

const Heading: FC<HeadingProps> = ({
  as = "h1",
  size = "xl",
  className,
  children,
}) => {
  const headingSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  };

  const HeadingTag = as;

  return (
    <HeadingTag className={`font-semibold ${headingSizes[size]} ${className}`}>
      {children}
    </HeadingTag>
  );
};

export { Heading };
