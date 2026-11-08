import type { Metadata } from "next";
import { content } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { WallBoard } from "@/components/public/WallBoard";

export const metadata: Metadata = { title: "Wall" };
export const dynamic = "force-dynamic";

export default function Wall() {
  return (
    <>
      <PageHead eyebrow="Wall" title="Creative work by PYPA members" sub="Poems, paintings, photographs and music from young people across Kerala." />
      <section className="container py-14"><WallBoard items={content().wall} /></section>
    </>
  );
}
