// A constellation lives in its own coordinate space. The page scrolls a "camera"
// along `path` (head -> tail); the six sections evenly divide that traversal, so
// scrolling the page pans the view along the figure.

export type Star = { x: number; y: number; mag: number; name?: string };

export type Constellation = {
  name: string;
  stars: Star[];
  lines: [number, number][];
  path: number[]; // star indices, head -> tail — the camera follows this
};

// Draco — the dragon. A lopsided head quadrilateral (Eltanin is the eye),
// then a long body winding down to the tail tip at Giausar.
export const draco: Constellation = {
  name: "Draco",
  stars: [
    { x: 430, y: 250, mag: 1.0, name: "Eltanin" }, // 0
    { x: 588, y: 176, mag: 0.85, name: "Rastaban" }, // 1
    { x: 624, y: 374, mag: 0.5, name: "Grumium" }, // 2
    { x: 452, y: 432, mag: 0.45, name: "Nu" }, // 3
    { x: 548, y: 720, mag: 0.9, name: "Altais" }, // 4  neck
    { x: 796, y: 1012, mag: 0.5 }, // 5
    { x: 606, y: 1362, mag: 0.85, name: "Zeta" }, // 6  the coil
    { x: 372, y: 1640, mag: 0.55 }, // 7
    { x: 520, y: 1934, mag: 0.5 }, // 8
    { x: 812, y: 2172, mag: 0.9, name: "Edasich" }, // 9
    { x: 1002, y: 2456, mag: 0.55 }, // 10
    { x: 858, y: 2704, mag: 0.85, name: "Thuban" }, // 11
    { x: 1012, y: 2914, mag: 0.7, name: "Giausar" }, // 12  tail tip
  ],
  lines: [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0], // head quad
    [2, 4], // neck
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 8],
    [8, 9],
    [9, 10],
    [10, 11],
    [11, 12], // body + tail
  ],
  path: [0, 1, 3, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};
