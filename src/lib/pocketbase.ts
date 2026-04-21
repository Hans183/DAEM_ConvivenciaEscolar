import PocketBase from "pocketbase";

export const pb = new PocketBase("https://apiconvivencia.daemlu.cl");

// Load auth store from cookie if in browser to persist session
if (typeof document !== "undefined") {
  pb.authStore.loadFromCookie(document.cookie);
}

// Configure global fetch for PocketBase to avoid caching issues in Next.js
pb.beforeSend = (url, options) => {
  options.cache = "no-store";
  return { url, options };
};
