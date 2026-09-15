// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro, VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection.

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Vercel deployment.
// Keep the Nitro target on the platform-compatible preset instead of
// forcing the self-hosted Node server.
const selfHostPreset = { preset: "vercel" as const };

export default defineConfig({
  nitro: selfHostPreset,

  tanstackStart: {
    // Use the project's custom SSR/server entry.
    server: {
      entry: "server",
    },
  },

  plugins: [
    VitePWA({
      // Registration happens only in src/lib/pwa.ts.
      injectRegister: null,

      registerType: "autoUpdate",

      filename: "sw.js",

      // TanStack Start browser output.
      outDir: "dist/client",

      devOptions: {
        enabled: false,
      },

      // Manifest is already provided from public/.
      manifest: false,

      includeAssets: [
        "offline.html",
        "favicon.png",
        "app-icon-192.png",
        "app-icon-512.png",
      ],

      workbox: {
        globPatterns: [
          "**/*.{js,css,ico,png,svg,webp,woff2}",
        ],

        globIgnores: [
          "**/node_modules/**",
          "**/_server/**",
          "sw-offline.js",
        ],

        importScripts: [
          "/sw-offline.js",
        ],

        navigateFallback: null,

        cleanupOutdatedCaches: true,

        clientsClaim: true,

        skipWaiting: true,

        runtimeCaching: [
          {
            // HTML navigation: network first.
            urlPattern: ({
              request,
            }: {
              request: Request;
            }) => request.mode === "navigate",

            handler: "NetworkFirst",

            options: {
              cacheName: "pages",

              networkTimeoutSeconds: 6,

              expiration: {
                maxEntries: 40,
                maxAgeSeconds: 60 * 60 * 24,
              },

              plugins: [
                {
                  handlerDidError: async () =>
                    caches.match("/offline.html"),
                },
              ],
            },
          },

          {
            // Static assets.
            urlPattern: ({
              request,
              sameOrigin,
            }: {
              request: Request;
              sameOrigin: boolean;
            }) =>
              sameOrigin &&
              [
                "style",
                "script",
                "worker",
                "image",
                "font",
              ].includes(request.destination),

            handler: "StaleWhileRevalidate",

            options: {
              cacheName: "assets",

              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
});
