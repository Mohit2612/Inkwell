"use client";

import { CoverData } from "@/lib/types";
import CoverLetterPreview from "./CoverLetterPreview";

export default function CoverThumbnail({ data }: { data: CoverData }) {
  const SHEET_W = 794;
  const SCALE = 0.34;
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
        <CoverLetterPreview data={data} sheetId="cthumb-sheet" flat />
      </div>
    </div>
  );
}
