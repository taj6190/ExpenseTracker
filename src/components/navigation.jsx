"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./sidebar";
import { ThemeToggle } from "./theme-toggle";

const Navigation = ({ children }) => {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/login" && pathname !== "/register") {
      router.push("/login");
    }
  }, [status, router, pathname]);

  // Render content based on status and pathname
  const renderContent = () => {
    // Don't show navigation on auth pages
    if (pathname === "/login" || pathname === "/register") {
      return children;
    }

    // Show loading state while checking authentication
    if (status === "loading") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Show error state if authentication fails
    if (status === "error") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">There was a problem authenticating your session.</p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Return to Login
            </button>
          </div>
        </div>
      );
    }

    // Show main layout with navigation
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-6 bg-background">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>
          {children}
        </main>
      </div>
    );
  };

  return renderContent();
};

export default Navigation;
