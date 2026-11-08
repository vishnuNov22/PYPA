import type { Metadata } from "next";
import { content } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { ProjectsBoard } from "@/components/public/ProjectsBoard";

export const metadata: Metadata = { title: "Ongoing Projects" };
export const dynamic = "force-dynamic";

export default function Projects() {
  return (
    <>
      <PageHead eyebrow="Ongoing projects" title="What PYPA is doing now" sub="Programmes run by the State, zones, centres and local units across Kerala." />
      <section className="container py-14"><ProjectsBoard projects={content().projects} /></section>
    </>
  );
}
