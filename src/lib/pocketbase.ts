import PocketBase from "pocketbase";

export const pb = new PocketBase("https://apiconvivencia.daemlu.cl");

// Configure global fetch for PocketBase to avoid caching issues in Next.js
pb.beforeSend = (url, options) => {
  options.cache = "no-store";
  return { url, options };
};
