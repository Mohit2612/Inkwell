"use client";

import { ResumeData, defaultFormat } from "@/lib/types";
import { Mail, Phone, MapPin, Globe, Linkedin } from "lucide-react";

export default function ResumePreview({
  data,
  sheetId = "resume-sheet",
  flat = false,
}: {
  data: ResumeData;
  sheetId?: string;
  flat?: boolean;
}) {
  const c = data.contact;
  const f = data.format ?? defaultFormat();
  const location = [c.city, c.showState ? c.state : "", c.country]
    .filter(Boolean)
    .join(", ");
  const hasContactLine =
    c.email || c.phone || location || c.website || c.linkedin;

  const gap = `${f.paraSpacing * 0.55}em`;

  return (
    <div
      id={sheetId}
      className={`mx-auto w-full max-w-[210mm] bg-white px-[8%] py-[7%] text-ink ${
        flat ? "" : "shadow-sheet"
      }`}
      style={{
        minHeight: flat ? undefined : "297mm",
        fontFamily: f.fontFamily,
        fontSize: `${f.fontSizePt}pt`,
        lineHeight: f.lineHeight,
      }}
    >
      {/* Header */}
      <header className="border-b border-slate-300 pb-[0.6em] text-center">
        <h1 className="text-[2.1em] font-bold tracking-tight">
          {c.fullName || "Your Name"}
        </h1>
        {c.title && (
          <p className="mt-[0.1em] text-[1.05em] text-slate-600">{c.title}</p>
        )}
        {hasContactLine && (
          <div className="mt-[0.5em] flex flex-wrap justify-center gap-x-[1.2em] gap-y-[0.2em] text-[0.78em] text-slate-700">
            {location && <Span icon={<MapPin />}>{location}</Span>}
            {c.email && <Span icon={<Mail />}>{c.email}</Span>}
            {c.phone && <Span icon={<Phone />}>{c.phone}</Span>}
            {c.website && <Span icon={<Globe />}>{c.website}</Span>}
            {c.linkedin && <Span icon={<Linkedin />}>{c.linkedin}</Span>}
          </div>
        )}
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap }}>
        {data.summary && (
          <Section title="Summary">
            <p className="text-slate-800">{data.summary}</p>
          </Section>
        )}

        {data.experience.length > 0 && (
          <Section title="Experience">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
              {data.experience.map((e) => (
                <div key={e.id}>
                  <div className="flex items-baseline justify-between">
                    <div className="font-bold">{e.role || "Role"}</div>
                    <div className="text-[0.85em] text-slate-600">
                      {[e.start, e.end].filter(Boolean).join(" - ")}
                      {e.location ? `, ${e.location}` : ""}
                    </div>
                  </div>
                  <div className="text-[0.92em] italic text-slate-700">{e.company}</div>
                  <ul className="mt-[0.2em] list-disc space-y-[0.1em] pl-[1.3em] text-slate-800">
                    {e.bullets.filter((b) => b.trim()).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.projects.length > 0 && (
          <Section title="Projects">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5em" }}>
              {data.projects.map((p) => (
                <div key={p.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">{p.title || "Project"}</span>
                    <span className="text-[0.85em] text-slate-600">
                      {[p.start, p.end].filter(Boolean).join(" - ")}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between text-[0.92em] italic text-slate-700">
                    <span>{p.organization}</span>
                    {p.url && <span className="not-italic">{p.url}</span>}
                  </div>
                  <ul className="mt-[0.2em] list-disc space-y-[0.1em] pl-[1.3em] text-slate-800">
                    {p.bullets.filter((b) => b.trim()).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.education.length > 0 && (
          <Section title="Education">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35em" }}>
              {data.education.map((e) => (
                <div key={e.id}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold">{e.degree || "Degree"}</span>
                    <span className="text-[0.85em] text-slate-600">{e.year}</span>
                  </div>
                  <div className="flex items-baseline justify-between text-[0.92em] italic text-slate-700">
                    <span>{e.school}</span>
                    <span className="not-italic">{e.location}</span>
                  </div>
                  {(e.minor || e.gpa) && (
                    <div className="text-[0.85em] text-slate-600">
                      {e.minor && <>Minor: {e.minor} </>}
                      {e.gpa && <>· GPA: {e.gpa}</>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {data.certifications.length > 0 && (
          <Section title="Certifications">
            <ul className="list-disc space-y-[0.1em] pl-[1.3em] text-slate-800">
              {data.certifications.map((c2) => (
                <li key={c2.id}>
                  <span className="font-semibold">{c2.name}</span>
                  {c2.issuer && <span className="text-slate-700"> — {c2.issuer}</span>}
                  {c2.date && <span className="text-slate-600"> ({c2.date})</span>}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {data.skillGroups.length > 0 && (
          <Section title="Skills">
            <div className="space-y-[0.15em] text-slate-800">
              {data.skillGroups.map((g) => (
                <div key={g.id}>
                  {g.title && <span className="font-bold">{g.title}: </span>}
                  {g.content}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-[0.6em]">
      <h2 className="mb-[0.3em] border-b border-slate-300 pb-[0.1em] text-[0.95em] font-bold uppercase tracking-[0.06em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Span({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[0.3em]">
      <span className="inline-flex [&>svg]:h-[1em] [&>svg]:w-[1em]">{icon}</span>
      {children}
    </span>
  );
}
