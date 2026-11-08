import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ResetForm } from "@/components/ResetForm";
import { verify } from "@/lib/crypto";

export const metadata: Metadata = { title: "Reset password" };
export const dynamic = "force-dynamic";

export default function Reset({ searchParams }: { searchParams: { token?: string } }) {
  const ok = verify<{ p: string }>(searchParams.token)?.p === "reset";
  return (
    <main className="grid min-h-screen place-items-center bg-bg p-6">
      <div className="card w-full max-w-md p-8">
        <Image src="/logo.webp" alt="" width={56} height={56} />
        <h1 className="mt-4 font-display text-3xl font-semibold">Choose a new password</h1>
        {ok ? <div className="mt-6"><ResetForm token={searchParams.token!} /></div>
          : <p className="mt-4 text-mute">This reset link is invalid or has expired. <Link href="/login" className="link">Back to sign in</Link> and use “Forgot password” to get a new one.</p>}
      </div>
    </main>
  );
}
