import type { ResearchEventRecord } from "@/types";

export function ResearchEventList({ events }: { events: ResearchEventRecord[] }) {
  if (events.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-[18px] font-semibold text-[var(--text-primary)]">
        Progress log
      </h2>
      <ol className="mt-3 space-y-2 border-l border-[var(--border)] pl-4">
        {events.map((event) => (
          <li key={event.id} className="text-[13px] text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">
              {new Date(event.createdAt).toLocaleTimeString()}
            </span>
            {" — "}
            {event.message}
          </li>
        ))}
      </ol>
    </section>
  );
}
