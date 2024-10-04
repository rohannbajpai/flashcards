// app/page.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import FlashcardApp from "../components/FlashcardApp";

export default function Home() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">You are not signed in</p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <p>Signed in as {session.user?.email}</p>
        <button
          onClick={() => signOut()}
          className="bg-red-500 text-white p-2 rounded"
        >
          Sign out
        </button>
      </div>
      <FlashcardApp />
    </div>
  );
}