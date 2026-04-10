"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-warm">
      <div className="text-center">
        <h1 className="text-5xl font-bold font-playfair text-primary mb-4">Error</h1>
        <p className="text-lg text-gray-600 mb-4">{error.message || "Something went wrong"}</p>
        <button
          onClick={reset}
          className="inline-block px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
