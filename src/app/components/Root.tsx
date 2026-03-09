import { Outlet, useNavigate } from "react-router";
import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAuth } from "../../config/auth-context";
import { storage } from "../../config/storage";
import { MobileNavigation } from "./ui/navigation";

export function Root() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // If no user is authenticated, redirect to signin
    if (!user) {
      navigate("/signin");
      return;
    }

    // If user is authenticated but has no profile, redirect to onboarding
    const state = storage.get();
    if (!state?.profile) {
      navigate("/onboarding");
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light">
        <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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