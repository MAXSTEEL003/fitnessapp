import { Outlet, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";
import { useAuth } from "../../config/auth-context";
import { storage } from "../../config/storage";
import { MobileNavigation } from "./ui/navigation";

export function Root() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    if (loading) return;

    // If no user is authenticated, redirect to signin
    if (!user) {
      navigate("/signin");
      setCheckingProfile(false);
      return;
    }

    const checkUserProfile = async () => {
      let state = storage.get();
      if (!state?.profile) {
        // Attempt to load from Firebase in case localStorage is empty (e.g. new device/tab)
        try {
          state = await storage.loadFromFirebase();
        } catch (e) {
          console.warn("Could not load from Firebase:", e);
        }
      }

      if (!state?.profile) {
        navigate("/onboarding");
      }
      setCheckingProfile(false);
    };

    checkUserProfile();
  }, [user, loading, navigate]);

  // Show loading state while checking auth and profile
  if (loading || checkingProfile) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading fitness tracker...</p>
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
