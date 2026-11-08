import type { Metadata } from "next";
import { content } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { KahalamReader } from "@/components/public/KahalamReader";

export const metadata: Metadata = { title: "Yuvajana Kahalam" };
export const dynamic = "force-dynamic";

export default function Kahalam() {
  return (
    <>
      <PageHead eyebrow="Yuvajana Kahalam" title="യുവജന കാഹളം" sub="The PYPA magazine. Read each issue here." />
      <section className="container py-14"><KahalamReader issues={content().kahalam} /></section>
    </>
  );
}
