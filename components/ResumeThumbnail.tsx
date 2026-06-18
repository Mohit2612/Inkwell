"use client";

import { ResumeData } from "@/lib/types";
import ResumePreview from "./ResumePreview";

// Renders the real resume sheet scaled down to fit a card.
// A4 width at 96dpi ≈ 794px; we scale to the card width.
export default function ResumeThumbnail({ data }: { data: ResumeData }) {
  const SHEET_W = 794; // px
  const SCALE = 0.3;

  return (
    <div
      className="pointer-events-none overflow-hidden rounded-md bg-white"
      style={{ width: SHEET_W * SCALE, height: 300 }}
      aria-hidden
    >
      <div
        style={{
          width: SHEET_W,
          transform: `scale(${SCALE})`,
          transformOrigin: "top left",
        }}
      >
        {/* Reuse the exact same preview component for pixel-accurate thumbnails */}
        <ResumePreview data={data} sheetId="thumb-sheet" flat />
      </div>
    </div>
  );
}
