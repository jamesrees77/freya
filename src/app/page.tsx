import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900">
          Freya
        </h1>
        <p className="mt-4 text-lg text-gray-600">Welcome to Freya.</p>

        <div className="mt-8">
          {user ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Signed in as {user.email}
              </p>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="rounded-md bg-gray-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
