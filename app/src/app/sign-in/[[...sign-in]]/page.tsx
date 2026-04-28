// Sign-in page. See sign-up/page.tsx for the rationale on static import +
// render-time conditional (instead of dynamic require + module-load
// conditional).

import { SignIn } from '@clerk/nextjs';

const hasRealClerkKey =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">SessionLens</h1>
          <p className="text-gray-500 mt-2 font-sans">AI Clinical Decision Support</p>
        </div>
        {hasRealClerkKey ? (
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            forceRedirectUrl="/dashboard"
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-400">
            Sign In — awaiting Clerk setup (add keys to .env.local)
          </div>
        )}
      </div>
    </div>
  );
}
