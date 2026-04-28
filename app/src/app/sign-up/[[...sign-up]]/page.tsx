// Sign-up page. When Clerk is configured (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
// set and not a placeholder) the real <SignUp/> widget is rendered. Otherwise
// a placeholder text shows, so the demo build keeps working without keys.
//
// IMPORTANT: <SignUp/> is a React client component. It MUST be imported
// statically — dynamic require() doesn't work because Next.js needs to see
// the import at build time to set up the server/client component boundary.
// The conditional happens at *render* time (env-var check inside the JSX),
// not at module-load time.

import { SignUp } from '@clerk/nextjs';

const hasRealClerkKey =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('placeholder');

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">SessionLens</h1>
          <p className="text-gray-500 mt-2 font-sans">AI Clinical Decision Support</p>
        </div>
        {hasRealClerkKey ? (
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/sign-in"
            forceRedirectUrl="/dashboard?onboarding=1"
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-400">
            Sign Up — awaiting Clerk setup (add keys to .env.local)
          </div>
        )}
      </div>
    </div>
  );
}
