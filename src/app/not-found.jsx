'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-gray-900">Page Not Found</h2>
            <p className="mt-2 text-gray-600">
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            
            <Button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto ml-0 sm:ml-4"
            >
              <Home className="mr-2 h-4 w-4" />
              Return Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 