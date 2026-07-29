"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.log("Service workers are not supported by this browser.");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log(
          "KOPKOP ICT service worker registered:",
          registration.scope
        );
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    window.addEventListener("load", registerServiceWorker);

    return () => {
      window.removeEventListener("load", registerServiceWorker);
    };
  }, []);

  return null;
}