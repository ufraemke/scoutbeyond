"use client";

import { useState } from "react";
import type {
  LiveCandidateRecord,
  LiveEvidenceRecord,
  CandidateCategory,
} from "@/types";

const CATEGORY_LABEL: Record<CandidateCategory, string> = {
  established: "Established",
  adjacent: "Adjacent",
  exploratory: "Exploratory",
};

export function CandidateLandscape({
  candidates,
  evidence,
}: {
  candidates: LiveCandidateRecord[];
  evidence: LiveEvidenceRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"all" | CandidateCategory>("all");
  const filtered =
    activeTab === "all"
      ? candidates
      : candidates.filter((candidate) => candidate.category === activeTab);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between rounded-xl border border-[#e5e5e2] bg-white px-6 py-4 shadow-sm">
        <div>
          <span className="text-[11px] font-bold uppercase text-[#8a8a8a]">
            Candidate approaches
          </span>
          <p className="text-[20px] font-bold text-[#176b87]">
            {candidates.length} identified
          </p>
        </div>
        <div className="flex gap-2 rounded-lg bg-[#f0f0ec] p-1">
          {(["all", "established", "adjacent", "exploratory"] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium capitalize transition ${
                  activeTab === tab
                    ? "bg-white text-[#161616] shadow-sm"
                    : "text-[#626262]"
                }`}
              >
                {tab}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-[#e5e5e2] bg-white p-6 text-[13px] text-[#8a8a8a]">
            No candidates in this category yet.
          </div>
        ) : null}
        {filtered.map((candidate) => {
          const linked = evidence.filter(
            (item) => item.candidateId === candidate.id,
          );
          return (
            <article
              key={candidate.id}
              className="rounded-2xl border border-[#e5e5e2] bg-white p-5 transition hover:border-[#bbb]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        candidate.category === "established"
                          ? "bg-[#edf8f1] text-[#23734d]"
                          : candidate.category === "adjacent"
                            ? "bg-[#eef2ff] text-[#315bd6]"
                            : "bg-[#fff9ea] text-[#916000]"
                      }`}
                    >
                      {CATEGORY_LABEL[candidate.category]}
                    </span>
                    <h3 className="text-[16px] font-bold text-[#161616]">
                      {candidate.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#626262]">
                    {candidate.principle}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.04em] text-[#8a8a8a]">
                  {candidate.verificationState}
                </span>
              </div>

              {candidate.relevance ? (
                <p className="mt-3 text-[13px] text-[#161616]">
                  <span className="font-semibold">Why relevant. </span>
                  {candidate.relevance}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-1.5">
                {candidate.confidence ? (
                  <span className="rounded-md bg-[#f0f0ec] px-2 py-0.5 text-[11px] text-[#626262]">
                    Confidence {candidate.confidence}
                  </span>
                ) : null}
                {candidate.evidenceQuality ? (
                  <span className="rounded-md bg-[#f0f0ec] px-2 py-0.5 text-[11px] text-[#626262]">
                    Evidence {candidate.evidenceQuality}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 border-t border-[#f0f0ec] pt-3">
                <p className="text-[12px] font-semibold text-[#161616]">
                  {linked.length} source-backed finding
                  {linked.length === 1 ? "" : "s"}
                </p>
                <div className="mt-2 space-y-2">
                  {linked.slice(0, 2).map((item) => (
                    <div key={item.id} className="text-[12px] text-[#626262]">
                      <p>{item.finding}</p>
                      {item.source?.url ? (
                        <a
                          href={item.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block font-medium text-[#176b87] hover:underline"
                        >
                          {(item.source.title || item.source.url).slice(0, 80)}{" "}
                          ↗
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
