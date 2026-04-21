import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className="bg-bg-warm font-sans antialiased" style={{
          "--font-playfair": "Georgia, serif",
          "--font-sans": "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
          "--font-mono": "'Monaco', 'Courier New', monospace"
        } as React.CSSProperties}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
