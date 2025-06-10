// Avatar.tsx
import type { FC } from "react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Avatar: FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  size = "md",
  className,
}) => {
  const avatarSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  };

  return (
    <div
      className={`rounded-full overflow-hidden ${avatarSizes[size]} ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      ) : (
        <div className="flex items-center justify-center bg-muted text-white">
          {alt.charAt(0)}
        </div>
      )}
    </div>
  );
};

export { Avatar };
