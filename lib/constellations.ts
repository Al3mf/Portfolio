// The page walks a constellation. Each section is pinned to one star and
// slides laterally so it lands beside it; the stars in between bulge out
// into the left gutter, so the figure never crosses the text.
//
// `lat`   (anchors) 0..1 lateral position -> how far the section slides.
// `bulge` (in-between stars) 0..1 how far LEFT of the line joining its two
//         anchors the star sits. Always left, never into the content.

export type AnchorNode = {
  section: string;
  lat: number;
  mag?: number;
  name?: string;
};

export type MidNode = {
  bulge: number;
  mag?: number;
};

export type SpineNode = AnchorNode | MidNode;

export const isAnchor = (n: SpineNode): n is AnchorNode => "section" in n;

export type HeadNode = {
  /** px further left than the first anchor's star */
  dx: number;
  /** px from the first anchor's heading centre */
  dy: number;
  mag?: number;
  name?: string;
};

export type Constellation = {
  name: string;
  spine: SpineNode[];
  head: HeadNode[];
};

export const draco: Constellation = {
  name: "Draco",
  spine: [
    { section: "about", lat: 0.42, mag: 0.9, name: "Grumium" },
    { bulge: 0.34, mag: 0.3 },
    { bulge: 0.66, mag: 0.4 },
    { bulge: 0.42, mag: 0.28 },
    { section: "stack", lat: 0.64, mag: 1, name: "Altais" },
    { bulge: 0.5, mag: 0.3 },
    { bulge: 0.84, mag: 0.42 },
    { bulge: 0.55, mag: 0.28 },
    { section: "experience", lat: 0.26, mag: 0.9, name: "Aldhibah" },
    { bulge: 0.28, mag: 0.3 },
    { bulge: 0.6, mag: 0.4 },
    { bulge: 0.34, mag: 0.28 },
    { section: "projects", lat: 0.76, mag: 0.85, name: "Athebyne" },
    { bulge: 0.58, mag: 0.3 },
    { bulge: 0.88, mag: 0.42 },
    { bulge: 0.52, mag: 0.28 },
    { section: "education", lat: 0.28, mag: 1, name: "Edasich" },
    { bulge: 0.3, mag: 0.3 },
    { bulge: 0.62, mag: 0.4 },
    { bulge: 0.38, mag: 0.28 },
    { section: "contact", lat: 0.68, mag: 0.9, name: "Giausar" },
  ],
  // the dragon's head, hanging off the first anchor out in the gutter
  head: [
    { dx: 46, dy: -44, mag: 1, name: "Eltanin" },
    { dx: 96, dy: -12, mag: 0.85, name: "Rastaban" },
    { dx: 52, dy: 30, mag: 0.5, name: "Nu" },
  ],
};

/** Lateral position per section, for the CSS transform that slides each one. */
export const sectionLateral: Record<string, number> = Object.fromEntries(
  draco.spine.filter(isAnchor).map((n) => [n.section, n.lat]),
);
