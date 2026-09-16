"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Download, X, WifiOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  installApp: () => Promise<void>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  installApp: async () => {},
});

export const usePwa = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js", { scope: "/" })
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    // 3. Check if user recently dismissed the prompt (hide for 7 days)
    const lastDismissed = localStorage.getItem("learntrack_pwa_dismissed");
    if (lastDismissed) {
      const daysSinceDismissed =
        (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } else {
      setIsDismissed(false);
    }

    // 4. Listen for BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("[PWA] LearnTrack installed successfully.");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Online/Offline Network Status
    const handleOnline = () => {
      setIsOffline(false);
      setWasOffline(true);
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem("learntrack_pwa_dismissed", Date.now().toString());
    } catch {}
  };

  return (
    <>
      {/* Offline Status Notice */}
      {isOffline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-2 px-4 text-xs font-semibold shadow-md animate-in slide-in-from-top-2"
          role="alert"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>You are currently offline. Actions requiring cloud sync will resume once connected.</span>
        </div>
      )}

      {/* Back Online Notice */}
      {wasOffline && !isOffline && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 px-4 text-xs font-semibold shadow-md animate-in slide-in-from-top-2"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Connection restored. Back online!</span>
        </div>
      )}

      {/* Unobtrusive Floating PWA Install Banner */}
      {isInstallable && !isDismissed && (
        <div
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm rounded-xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
          role="dialog"
          aria-label="Install App"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Install LearnTrack</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                  Install on your device for instant focus blocks & offline support.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              aria-label="Dismiss install prompt"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 text-xs px-2.5 text-muted-foreground hover:text-foreground"
            >
              Not now
            </Button>
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="h-8 text-xs font-semibold gap-1.5 px-3 shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Install</span>
            </Button>
          </div>
        </div>
      )}

      <PwaContext.Provider
        value={{
          isInstallable,
          isInstalled,
          installApp: handleInstallClick,
        }}
      >
        {children}
      </PwaContext.Provider>
    </>
  );
}
