import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — GD BOSS777" },
      {
        name: "description",
        content:
          "How GD BOSS777 collects, uses and protects your account, payment and device information.",
      },
      { property: "og:title", content: "Privacy Policy — GD BOSS777" },
      { property: "og:description", content: "How GD BOSS777 handles your data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-8 pb-24 space-y-5">
        <h1 className="text-2xl font-extrabold">Privacy Policy</h1>
        <section className="space-y-3 text-sm text-muted-foreground">
          <p>
            We collect only the information needed to run your account: your mobile number, name,
            wallet transactions and payment references you submit.
          </p>
          <p>
            Payment details you provide (UPI ID, bank details) are used only to process your
            deposits and withdrawals. We never sell or share your data with advertisers.
          </p>
          <p>
            The Android app requests only the permissions required for network access and
            notifications. You can request deletion of your account and data at any time through
            support.
          </p>
        </section>
        <Link to="/download" className="inline-block text-sm font-bold text-[var(--brand)]">
          ← Back to download
        </Link>
      </main>
    </div>
  );
}
