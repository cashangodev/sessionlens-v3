export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-bg-warm flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">SessionLens</h1>
          <p className="text-gray-500 mt-2 font-sans">AI Clinical Decision Support</p>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-8 text-center text-gray-400">
          Sign Up — awaiting Clerk setup (add keys to .env.local)
        </div>
      </div>
    </div>
  );
}
