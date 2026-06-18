"use client";

import { CoverData } from "@/lib/types";

export default function CoverLetterPreview({
  data,
  sheetId = "cover-sheet",
  flat = false,
}: {
  data: CoverData;
  sheetId?: string;
  flat?: boolean;
}) {
  const c = data.contact;
  return (
    <div
      id={sheetId}
      className={`mx-auto w-full max-w-[210mm] bg-white px-12 py-14 font-serif text-ink ${
        flat ? "" : "shadow-sheet"
      }`}
      style={{
        minHeight: flat ? undefined : "297mm",
        fontSize: `${data.fontSize}pt`,
        lineHeight: data.lineHeight,
      }}
    >
      <h1 className="text-2xl font-bold tracking-tight">
        {c.fullName || "Your Name"}
      </h1>
      <div className="mt-2 text-[0.85em] text-slate-700">
        {c.address && <div>{c.address}</div>}
        {c.phone && <div>{c.phone}</div>}
        {c.email && <div>{c.email}</div>}
      </div>

      {c.date && <div className="mt-6 text-[0.85em] text-slate-700">{c.date}</div>}
      {c.company && (
        <div className="mt-1 text-[0.85em] text-slate-700">{c.company}</div>
      )}

      <p className="mt-6">{c.recipient || "Dear Hiring Team,"}</p>

      <div className="mt-4 whitespace-pre-wrap text-slate-800">
        {data.content || (
          <span className="text-slate-400">
            Write a tailored cover letter that showcases your unique fit and
            aspirations for this position…
          </span>
        )}
      </div>

      {data.content && (
        <p className="mt-6">
          Sincerely,
          <br />
          {c.fullName}
        </p>
      )}
    </div>
  );
}
