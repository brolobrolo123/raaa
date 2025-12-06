"use client";

import Link, { type LinkProps } from "next/link";
import { useCallback, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";

type NextLinkProps = ComponentPropsWithoutRef<typeof Link>;

type FullReloadLinkProps = Omit<NextLinkProps, "href" | "onClick" | "prefetch"> & {
  href: string;
  children: ReactNode;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  prefetch?: LinkProps["prefetch"];
};

export function FullReloadLink({ href, children, onClick, prefetch = false, ...rest }: FullReloadLinkProps) {
  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) {
        return;
      }
      event.preventDefault();
      window.location.href = href;
    },
    [href, onClick],
  );

  return (
    <Link
      {...rest}
      href={href}
      prefetch={prefetch}
      onClick={handleClick}
    >
      {children}
    </Link>
  );
}
