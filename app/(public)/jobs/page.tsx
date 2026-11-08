import type { Metadata } from "next";
import { content } from "@/lib/public";
import { PageHead } from "@/components/public/PageHead";
import { JobsBoard } from "@/components/public/JobsBoard";

export const metadata: Metadata = { title: "Job Portal" };
export const dynamic = "force-dynamic";

export default function Jobs() {
  const jobs = content().jobs.filter((j) => j.status === "Approved");
  return (
    <>
      <PageHead eyebrow="Job portal" title="Openings for PYPA members" sub="Browse current vacancies, or share one. New postings are reviewed by the admin before they appear." />
      <section className="container py-14"><JobsBoard jobs={jobs} /></section>
    </>
  );
}
