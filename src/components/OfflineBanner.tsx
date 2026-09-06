import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a calm in-app notice instead of letting the browser surface
 * technical errors (ERR_INTERNET_DISCONNECTED) when the device is offline.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 bg-destructive px-3 py-2 text-xs font-medium text-destructive-foreground">
      <WifiOff className="h-3.5 w-3.5" />
      <span>No internet connection — showing saved app screen</span>
    </div>
  );
}
