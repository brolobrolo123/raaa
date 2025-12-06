"use client";

import { useEffect, useState } from "react";

export const BACKGROUND_STORAGE_KEY = "pixelBackgroundEnabled";
export const BACKGROUND_TOGGLE_EVENT = "pixel-background-toggle";
const DEFAULT_ENABLED = true;
const SLIDE_IMAGES = ["/fondo1.png", "/fondo2.png", "/fondo3.png"];

function readBackgroundPreference(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_ENABLED;
  }
  const stored = window.localStorage.getItem(BACKGROUND_STORAGE_KEY);
  if (stored === null) {
    return DEFAULT_ENABLED;
  }
  return stored === "1";
}

export function BackgroundSlideshow() {
  const [enabled, setEnabled] = useState(DEFAULT_ENABLED);
  const [image] = useState(() => SLIDE_IMAGES[Math.floor(Math.random() * SLIDE_IMAGES.length)]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    setEnabled(readBackgroundPreference());

    const handleToggle = (event: Event) => {
      if (event instanceof CustomEvent && typeof event.detail === "boolean") {
        setEnabled(event.detail);
      }
    };

    window.addEventListener(BACKGROUND_TOGGLE_EVENT, handleToggle);
    return () => window.removeEventListener(BACKGROUND_TOGGLE_EVENT, handleToggle);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      className="background-slideshow"
      style={{
        backgroundImage: `url(${image})`,
      }}
      aria-hidden="true"
    />
  );
}
