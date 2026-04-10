import type { Metadata } from "next";
import "./globals.css";

// Dynamically import ClerkProvider only when a real key is set
let ClerkProvider: React.ComponentType<{ children: React.ReactNode; publishableKey?: string }> | null = null;
try {
  const hasRealKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");
  if (hasRealKey) {
    ClerkProvider = require("@clerk/nextjs").ClerkProvider;
  }
} catch {
  // Clerk not available
}

export const metadata: Metadata = {
  title: "SessionLens — AI Clinical Decision Support",
  description:
    "AI-powered therapy session analysis using phenomenological structure coding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = (
    <html lang="en">
      <body className="bg-bg-warm font-sans antialiased">
        {children}
      </body>
    </html>
  );

  if (ClerkProvider) {
    return (
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
