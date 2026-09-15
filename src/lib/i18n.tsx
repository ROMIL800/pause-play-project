import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English", short: "EN" },
  { code: "hi", label: "हिंदी", short: "हि" },
  { code: "ta", label: "தமிழ்", short: "த" },
  { code: "te", label: "తెలుగు", short: "తె" },
  { code: "gu", label: "ગુજરાતી", short: "ગુ" },
  { code: "mr", label: "मराठी", short: "म" },
  { code: "ur", label: "اردو", short: "ار" },
  { code: "kn", label: "ಕನ್ನಡ", short: "ಕ" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

type TranslationKey =
  | "online"
  | "guest"
  | "balance"
  | "secure"
  | "deposit"
  | "withdraw"
  | "support"
  | "gali"
  | "galiDesc"
  | "charts"
  | "chartsDesc"
  | "liveResult"
  | "updated"
  | "markets"
  | "fetching"
  | "unavailable"
  | "openMarkets"
  | "upcomingMarkets"
  | "closedMarkets"
  | "play"
  | "chart"
  | "openBids"
  | "closeBids"
  | "waiting"
  | "running"
  | "closed"
  | "recentActivity"
  | "verifiedActivity"
  | "noActivity"
  | "myBids"
  | "payments"
  | "home"
  | "funds"
  | "rateExample";

const en: Record<TranslationKey, string> = {
  online: "Online",
  guest: "Guest User",
  balance: "Wallet Balance",
  secure: "Secure account",
  deposit: "Deposit",
  withdraw: "Withdraw",
  support: "Support",
  gali: "Gali Disawar",
  galiDesc: "Fast chart & play",
  charts: "Live Charts",
  chartsDesc: "Kalyan & all markets",
  liveResult: "Live Results",
  updated: "Updated",
  markets: "markets",
  fetching: "Fetching live results…",
  unavailable: "Live feed unavailable",
  openMarkets: "Open Markets",
  upcomingMarkets: "Opening Soon",
  closedMarkets: "Closed Markets",
  play: "Play Game",
  chart: "Chart",
  openBids: "Open",
  closeBids: "Close",
  waiting: "Waiting",
  running: "Open now",
  closed: "Closed today",
  recentActivity: "Recent Payments",
  verifiedActivity: "Approved deposits & withdrawals",
  noActivity: "No approved activity yet",
  myBids: "My Bids",
  payments: "Payments",
  home: "Home",
  funds: "Funds",
  rateExample: "₹10 pays ₹95",
};

const overrides: Record<Exclude<LanguageCode, "en">, Partial<Record<TranslationKey, string>>> = {
  hi: {
    online: "ऑनलाइन",
    guest: "अतिथि",
    balance: "वॉलेट बैलेंस",
    secure: "सुरक्षित खाता",
    deposit: "जमा",
    withdraw: "निकासी",
    support: "सहायता",
    liveResult: "लाइव परिणाम",
    openMarkets: "खुले मार्केट",
    upcomingMarkets: "जल्द खुलेंगे",
    closedMarkets: "बंद मार्केट",
    play: "गेम खेलें",
    chart: "चार्ट",
    running: "अभी खुला",
    closed: "आज बंद",
    recentActivity: "हाल के भुगतान",
    verifiedActivity: "स्वीकृत जमा और निकासी",
    myBids: "मेरी बिड",
    payments: "भुगतान",
    home: "होम",
    funds: "फंड",
    rateExample: "₹10 पर ₹95",
  },
  ta: {
    online: "ஆன்லைன்",
    balance: "வாலெட் இருப்பு",
    deposit: "டெபாசிட்",
    withdraw: "பணம் எடு",
    support: "உதவி",
    liveResult: "நேரடி முடிவுகள்",
    openMarkets: "திறந்த சந்தைகள்",
    upcomingMarkets: "விரைவில் திறக்கும்",
    closedMarkets: "மூடிய சந்தைகள்",
    play: "விளையாடு",
    chart: "விளக்கப்படம்",
    home: "முகப்பு",
    funds: "நிதி",
    rateExample: "₹10க்கு ₹95",
  },
  te: {
    online: "ఆన్‌లైన్",
    balance: "వాలెట్ బ్యాలెన్స్",
    deposit: "డిపాజిట్",
    withdraw: "విత్‌డ్రా",
    support: "సహాయం",
    liveResult: "లైవ్ ఫలితాలు",
    openMarkets: "తెరిచిన మార్కెట్లు",
    upcomingMarkets: "త్వరలో తెరుస్తాయి",
    closedMarkets: "మూసిన మార్కెట్లు",
    play: "గేమ్ ఆడండి",
    chart: "చార్ట్",
    home: "హోమ్",
    funds: "నిధులు",
    rateExample: "₹10కి ₹95",
  },
  gu: {
    online: "ઓનલાઇન",
    balance: "વૉલેટ બેલેન્સ",
    deposit: "જમા",
    withdraw: "ઉપાડ",
    support: "સહાય",
    liveResult: "લાઇવ પરિણામ",
    openMarkets: "ખુલ્લા માર્કેટ",
    upcomingMarkets: "ટૂંક સમયમાં ખુલશે",
    closedMarkets: "બંધ માર્કેટ",
    play: "ગેમ રમો",
    chart: "ચાર્ટ",
    home: "હોમ",
    funds: "ફંડ",
    rateExample: "₹10 પર ₹95",
  },
  mr: {
    online: "ऑनलाइन",
    balance: "वॉलेट शिल्लक",
    deposit: "जमा",
    withdraw: "पैसे काढा",
    support: "मदत",
    liveResult: "लाईव्ह निकाल",
    openMarkets: "खुले मार्केट",
    upcomingMarkets: "लवकरच सुरू",
    closedMarkets: "बंद मार्केट",
    play: "गेम खेळा",
    chart: "चार्ट",
    home: "होम",
    funds: "फंड",
    rateExample: "₹10 वर ₹95",
  },
  ur: {
    online: "آن لائن",
    balance: "والیٹ بیلنس",
    deposit: "جمع",
    withdraw: "نکلوائیں",
    support: "مدد",
    liveResult: "لائیو نتائج",
    openMarkets: "کھلی مارکیٹس",
    upcomingMarkets: "جلد کھلیں گی",
    closedMarkets: "بند مارکیٹس",
    play: "گیم کھیلیں",
    chart: "چارٹ",
    home: "ہوم",
    funds: "فنڈز",
    rateExample: "₹10 پر ₹95",
  },
  kn: {
    online: "ಆನ್‌ಲೈನ್",
    balance: "ವಾಲೆಟ್ ಬ್ಯಾಲೆನ್ಸ್",
    deposit: "ಠೇವಣಿ",
    withdraw: "ಹಿಂಪಡೆಯಿರಿ",
    support: "ಸಹಾಯ",
    liveResult: "ಲೈವ್ ಫಲಿತಾಂಶ",
    openMarkets: "ತೆರೆದ ಮಾರುಕಟ್ಟೆಗಳು",
    upcomingMarkets: "ಶೀಘ್ರ ತೆರೆಯುತ್ತದೆ",
    closedMarkets: "ಮುಚ್ಚಿದ ಮಾರುಕಟ್ಟೆಗಳು",
    play: "ಗೇಮ್ ಆಡಿ",
    chart: "ಚಾರ್ಟ್",
    home: "ಮುಖಪುಟ",
    funds: "ಹಣ",
    rateExample: "₹10ಗೆ ₹95",
  },
};

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem("gd-language");
    if (LANGUAGES.some((item) => item.code === saved)) setLanguageState(saved as LanguageCode);
  }, []);

  const setLanguage = (next: LanguageCode) => {
    setLanguageState(next);
    window.localStorage.setItem("gd-language", next);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ur" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) =>
        overrides[language as Exclude<LanguageCode, "en">]?.[key] ?? en[key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
