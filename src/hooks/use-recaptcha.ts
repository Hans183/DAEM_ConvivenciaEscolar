"use client";

import { useCallback, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

/**
 * Hook to load the Google reCAPTCHA v3 script and expose a function
 * to execute the challenge and get a token.
 *
 * Usage:
 *   const { executeRecaptcha, isReady } = useRecaptcha();
 *   const token = await executeRecaptcha("login");
 */
export function useRecaptcha() {
  const [isReady, setIsReady] = useState(false);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (scriptLoadedRef.current || !SITE_KEY) return;
    scriptLoadedRef.current = true;

    // Check if script is already present (e.g. navigating back)
    const existingScript = document.querySelector(
      `script[src*="recaptcha/api.js"]`,
    );

    if (existingScript) {
      window.grecaptcha?.ready(() => setIsReady(true));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.grecaptcha?.ready(() => setIsReady(true));
    };

    document.head.appendChild(script);
  }, []);

  const executeRecaptcha = useCallback(
    async (action: string): Promise<string> => {
      if (!SITE_KEY) {
        console.warn("[reCAPTCHA] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set.");
        return "";
      }

      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(SITE_KEY, { action });
            resolve(token);
          } catch (err) {
            reject(err);
          }
        });
      });
    },
    [],
  );

  return { executeRecaptcha, isReady };
}
