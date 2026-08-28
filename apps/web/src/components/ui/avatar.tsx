import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const avatarVariants = cva("relative flex shrink-0 overflow-hidden rounded-full", {
  variants: {
    size: {
      xs: "h-6 w-6",
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null;
  alt: string;
  fallback?: string;
}

function getDeterministicColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) % 360;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, fallback, ...props }, ref) => {
    const [error, setError] = React.useState(false);
    const initials =
      fallback ||
      alt
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    const color = getDeterministicColor(alt);

    return (
      <div ref={ref} className={cn(avatarVariants({ size, className }))} {...props}>
        {!error && src ? (
          <img
            src={src}
            alt={alt}
            className="aspect-square h-full w-full object-cover"
            loading="lazy"
            onError={() => setError(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
