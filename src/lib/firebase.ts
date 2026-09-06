import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

/**
 * Firebase web config. Values come from the Firebase Web App registered in the
 * same project as google-services.json (matka777-2d113). API keys/app ids are
 * publishable client identifiers, so env fallbacks are safe.
 */
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] ?? "AIzaSyCVfzoZ4C8tT1xVhlaNh2T9D3GdmCcPjZk",
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] ?? "matka777-2d113.firebaseapp.com",
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] ?? "matka777-2d113",
  storageBucket:
    import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] ?? "matka777-2d113.firebasestorage.app",
  messagingSenderId: import.meta.env["VITE_FIREBASE_SENDER_ID"] ?? "183862274737",
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] ?? "1:183862274737:web:d5dcd8d975d333add3d090",
};

export function getFirebaseAuth() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // Keep the Firebase user across WebView/browser restarts. Fire-and-forget:
  // persistence is best-effort and must never block OTP delivery.
  void setPersistence(auth, browserLocalPersistence).catch(() => undefined);
  return auth;
}

let verifier: RecaptchaVerifier | null = null;

/** Invisible reCAPTCHA required by Firebase Phone Auth on web/webview. */
export function getRecaptcha(containerId = "firebase-recaptcha") {
  const auth = getFirebaseAuth();
  if (!verifier) {
    verifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return verifier;
}

export function resetRecaptcha() {
  try {
    verifier?.clear();
  } catch {
    // verifier already destroyed
  }
  verifier = null;
}

/**
 * Maps Firebase auth error codes to messages a player can act on. Without this
 * the UI surfaces raw strings like "Firebase: Error (auth/invalid-phone-number)."
 */
export function firebaseErrorMessage(err: unknown, fallback = "Could not send OTP") {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-phone-number":
      return "That mobile number is not valid. Please check and try again.";
    case "auth/missing-phone-number":
      return "Please enter your mobile number.";
    case "auth/quota-exceeded":
      return "SMS limit reached for now. Please try again later.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "auth/invalid-verification-code":
      return "Incorrect OTP. Please check the code and try again.";
    case "auth/code-expired":
      return "This OTP has expired. Please tap Resend OTP.";
    case "auth/missing-verification-code":
      return "Please enter the 6-digit OTP.";
    case "auth/captcha-check-failed":
    case "auth/invalid-app-credential":
      return "Security check failed. Please try again.";
    case "auth/network-request-failed":
      return "Network problem. Check your internet connection and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/operation-not-allowed":
      return "Phone login is temporarily unavailable. Please contact support.";
    default:
      return err instanceof Error && err.message && !err.message.startsWith("Firebase:")
        ? err.message
        : fallback;
  }
}

export async function sendFirebaseOtp(e164Phone: string) {
  const auth = getFirebaseAuth();
  // An invisible reCAPTCHA token is single-use: reusing a solved verifier makes
  // the *resend* fail with auth/captcha-check-failed. Always start clean.
  resetRecaptcha();
  try {
    return await signInWithPhoneNumber(auth, e164Phone, getRecaptcha());
  } catch (err) {
    resetRecaptcha();
    throw err;
  }
}
