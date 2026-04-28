import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// Whether to wrap the app in Clerk's provider. Render-time conditional based
// on the env var — the provider is statically imported (so Next.js wires up
// the client/server boundary correctly) but only mounted when a real key is
// configured. This way the demo build keeps working without Clerk credentials.
const hasRealClerkKey =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

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

  if (hasRealClerkKey) {
    return (
      <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
