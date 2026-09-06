import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, Send } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";
import { CONTACT, whatsappHref } from "@/lib/contact";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — GD BOSS777" },
      { name: "description", content: "Get help via WhatsApp, email or phone." },
      { property: "og:title", content: "Support — GD BOSS777" },
      { property: "og:description", content: "Contact support channels." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-background">
      <AppHeader title="Support" />
      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain mx-auto w-full max-w-md px-4 py-5 pb-24 space-y-3">
        <a
          href={whatsappHref(CONTACT.supportHelpMessage)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white font-bold py-4 shadow-md active:scale-[0.98] transition"
        >
          <WhatsAppLogo className="h-6 w-6" />
          Chat on WhatsApp
        </a>
        <a
          href={CONTACT.telegram}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#229ED9] text-white font-bold py-4 shadow-md active:scale-[0.98] transition"
        >
          <Send className="h-6 w-6" />
          Chat on Telegram
        </a>
        <a
          href={whatsappHref()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="h-11 w-11 rounded-xl bg-[#25D366] text-white grid place-items-center shrink-0">
            <WhatsAppLogo className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">Business WhatsApp Support</div>
            <div className="text-xs text-muted-foreground">Chat with an agent · 24×7</div>
          </div>
          <span className="text-xs font-semibold text-[#25D366] shrink-0">Chat →</span>
        </a>
        <a
          href={CONTACT.telegram}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="h-11 w-11 rounded-xl bg-[#229ED9] text-white grid place-items-center shrink-0">
            <Send className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">Telegram Support</div>
            <div className="text-xs text-muted-foreground">Fast replies on Telegram · 24×7</div>
          </div>
          <span className="text-xs font-semibold text-[#229ED9] shrink-0">Chat →</span>
        </a>

        <a
          href={`mailto:${CONTACT.email}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="h-11 w-11 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] grid place-items-center shrink-0">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">Email Us</div>
            <div className="text-xs text-muted-foreground">{CONTACT.email}</div>
          </div>
          <span className="text-xs font-semibold text-[var(--brand)] shrink-0">Mail →</span>
        </a>
        <a
          href={`tel:${CONTACT.phone}`}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="h-11 w-11 rounded-xl gold-gradient text-[var(--brand-deep)] grid place-items-center shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold">Call Us</div>
            <div className="text-xs text-muted-foreground">{CONTACT.phone}</div>
          </div>
        </a>
      </main>
      <BottomNav />
    </div>
  );
}
