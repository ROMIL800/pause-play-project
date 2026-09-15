// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Self-hosting (own domain / ALC Hosting): build with SELF_HOST=1 to emit a plain
// Node.js server (dist/server/index.mjs) instead of the default Cloudflare bundle.
const selfHostPreset = process.env["SELF_HOST"] ? { preset: "node-server" as const } : undefined;

export default defineConfig({
  ...(selfHostPreset ? { nitro: selfHostPreset } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      // Registration happens only in src/lib/pwa.ts (guarded against previews/iframes).
      injectRegister: null,
      registerType: "autoUpdate",
      filename: "sw.js",
      // TanStack Start emits the browser bundle into dist/client; the service
      // worker and its precache manifest must be generated from that folder.
      outDir: "dist/client",
      devOptions: { enabled: false },
      // The manifest is shipped as a static file in public/.
      manifest: false,
      includeAssets: ["offline.html", "favicon.png", "app-icon-192.png", "app-icon-512.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff2}"],
        globIgnores: ["**/node_modules/**", "**/_server/**", "sw-offline.js"],
        importScripts: ["/sw-offline.js"],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // HTML navigations are always network-first; offline falls back to the shell.
            urlPattern: ({ request }: { request: Request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "pages",
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 },
              plugins: [
                {
                  handlerDidError: async () => caches.match("/offline.html"),
                },
              ],
            },
          },
          {
            urlPattern: ({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) =>
              sameOrigin &&
              ["style", "script", "worker", "image", "font"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
