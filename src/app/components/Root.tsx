import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { storage } from "../../config/storage";
import { MobileNavigation } from "./ui/navigation";

export function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initPersonalApp = async () => {
      let state = storage.get();
      if (!state?.profile) {
        // Attempt to load from Firebase if available
        try {
          state = await storage.loadFromFirebase();
        } catch (e) {
          console.warn("Firebase personal sync check:", e);
        }
      }

      // Automatically initialize personal profile and master libraries if not present
      if (!state?.profile) {
        state = storage.createInitialState();
        storage.save(state);
      }
      setReady(true);
    };

    initPersonalApp();
  }, []);

  if (!ready) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Opening personal fitness tracker...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="min-h-screen bg-gray-50 dark:bg-black pb-24">
        <Outlet />
        <MobileNavigation />
      </div>
    </ThemeProvider>
  );
}
