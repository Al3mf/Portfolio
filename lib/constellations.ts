// Section headings become the stars of a constellation, linked by lines drawn
// in the left gutter. Each star's vertical position is anchored to a heading;
// `offset` pushes it that many px left of the content column so the figure
// winds. Decorative stars (no `anchor`) sit relative to the first anchor.

export type ConstellationStar = {
  id: string;
  offset: number; // px left of the content column's left edge
  anchor?: string; // section id whose heading fixes this star's Y
  dy?: number; // decorative stars only: px from the first anchor heading's centre
  bright?: boolean;
};

export type Constellation = {
  name: string;
  stars: ConstellationStar[];
  lines: [string, string][];
};

// Draco — the dragon. Head near the top of the page, body winding down to the
// tail tip (Giausar) at the last section.
export const draco: Constellation = {
  name: "Draco",
  stars: [
    // head: a lopsided quadrilateral (Eltanin is the dragon's eye)
    { id: "eltanin", offset: 84, dy: -34, bright: true },
    { id: "rastaban", offset: 112, dy: -4, bright: true },
    { id: "nu", offset: 72, dy: 30 },
    { id: "grumium", offset: 40, anchor: "about" },
    // body, winding down through the sections
    { id: "altais", offset: 74, anchor: "stack" },
    { id: "aldhibah", offset: 46, anchor: "experience" },
    { id: "athebyne", offset: 82, anchor: "projects" },
    { id: "edasich", offset: 50, anchor: "education" },
    { id: "thuban", offset: 34, anchor: "leadership" },
    { id: "giausar", offset: 64, anchor: "contact" }, // tail tip
  ],
  lines: [
    ["eltanin", "rastaban"],
    ["rastaban", "nu"],
    ["nu", "grumium"],
    ["grumium", "eltanin"],
    ["grumium", "altais"],
    ["altais", "aldhibah"],
    ["aldhibah", "athebyne"],
    ["athebyne", "edasich"],
    ["edasich", "thuban"],
    ["thuban", "giausar"],
  ],
};
