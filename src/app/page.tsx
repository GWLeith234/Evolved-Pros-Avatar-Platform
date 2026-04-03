import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-white">
          Evolved Pros AI Avatar Platform
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Turn podcast episodes into AI-generated short-form video clips with
          custom voices and avatars.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/auth/signup"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
