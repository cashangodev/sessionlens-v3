import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-warm">
      <div className="text-center">
        <h1 className="text-5xl font-playfair font-bold text-primary mb-4">
          SessionLens
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          AI Clinical Decision Support for Therapy Sessions
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
