import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, ShieldCheck, Smartphone, LifeBuoy } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { APK_URL, APK_PACKAGE, APK_VERSION } from "@/lib/download-config";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download GD BOSS777 App - Official" },
      {
        name: "description",
        content:
          "GD BOSS777 download — official Satta app APK for Android. Get the latest Matka app APK, safe and secure, with fast install steps.",
      },
      {
        name: "keywords",
        content: "GD BOSS777 download, Satta app, Matka app APK, GD BOSS777 APK, online matka app",
      },
      { property: "og:title", content: "Download GD BOSS777 App - Official" },
      {
        property: "og:description",
        content: "Get the latest version of GD BOSS777 for Android. Safe and secure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DownloadPage,
});

const steps = [
  "Tap Download Android App.",
  'Open your phone\'s "Downloads" folder.',
  "Tap the gdboss777.apk file.",
  "Allow installation from unknown sources if prompted.",
  "Install and enjoy!",
];

function DownloadPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-8 pb-24 space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <BrandLogo className="h-16 w-auto" />
          <h1 className="text-2xl font-extrabold">GD BOSS777</h1>
          <p className="text-sm text-muted-foreground">
            Live market results, fast deposits and instant withdrawals — all in one lightweight
            Android app. Play every market from your phone.
          </p>
        </div>

        {APK_URL ? (
          <a
            href={APK_URL}
            className="flex items-center justify-center gap-2 rounded-2xl brand-gradient text-white py-4 text-lg font-extrabold shadow-md"
          >
            <Download className="h-5 w-5" /> Download Android App
          </a>
        ) : (
          <div className="space-y-2">
            <button
              disabled
              aria-disabled="true"
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-muted text-muted-foreground py-4 text-lg font-extrabold cursor-not-allowed"
            >
              <Download className="h-5 w-5" /> Download Android App
            </button>
            <p className="text-center text-xs text-muted-foreground">
              The Android app is not released yet. Use the website in the meantime.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[var(--brand)]" /> Virus free
          </div>
          <div className="rounded-xl border border-border bg-card p-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[var(--gold)]" /> Android 6.0+
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-base font-bold mb-3">How to Install</h2>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-5">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </section>

        <div className="flex items-center justify-center gap-4 text-xs font-bold">
          <Link to="/privacy-policy" className="text-[var(--brand)]">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/support" className="inline-flex items-center gap-1 text-[var(--brand)]">
            <LifeBuoy className="h-3.5 w-3.5" /> Support
          </Link>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Official GD BOSS777 APK · {APK_PACKAGE} · v{APK_VERSION}
        </p>
      </main>
    </div>
  );
}
