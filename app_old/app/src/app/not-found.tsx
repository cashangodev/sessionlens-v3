import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-warm">
      <div className="text-center">
        <h1 className="text-5xl font-bold font-playfair text-primary mb-4">404</h1>
        <p className="text-lg text-gray-600 mb-8">Page not found</p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Go back to dashboard
        </Link>
      </div>
    </div>
  );
}
