import Image from "next/image";
import { cn } from "@/lib/cn";
import { getAvatarUrl } from "@/lib/media";

interface UserAvatarProps {
  image?: string | null;
  size?: number;
  alt?: string;
  className?: string;
}

export function UserAvatar({ image, size = 32, alt = "Avatar", className }: UserAvatarProps) {
  const dimension = Math.max(16, size);
  const src = getAvatarUrl(image);

  return (
    <Image
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      unoptimized
      className={cn("rounded-full object-cover", className)}
      style={{ width: dimension, height: dimension }}
    />
  );
}
