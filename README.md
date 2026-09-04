# Alejandro Melo Flores — Portfolio

Personal portfolio site: bio, tech stack, experience, projects and education,
with an interactive black-hole hero — a particle accretion disk orbiting an
event horizon, with real-time gravitational lensing that intensifies as the
cursor approaches.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**React Three Fiber / three.js**, **@react-three/postprocessing** (bloom + a
custom lensing effect), **Lenis** (smooth scroll) and **Motion** (scroll
reveals).

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Edit content

All text lives in [`lib/content.ts`](lib/content.ts) — profile, stack,
experience, projects, education, activities and languages. Edit that one file;
nothing else needs to change.

- **Add a photo:** drop `avatar.jpg` in `public/` and set `profile.avatar` to
  `"/avatar.jpg"` in `lib/content.ts`. (The hero currently renders without one.)
- **Tune the black hole:** `components/BlackHole.tsx`.
  - Apparent size / framing: `sc` scale, `camPos`, and the plane size in
    `<BlackHoleCore>`; `GROUP_Y` moves it up/down the screen.
  - Warp strength (rest + on hover): `warp` in the `bhFrag` shader.
  - Disk colour / brightness: the `diskColor()` function.
  - Dust and stars: `DUST_COUNT` / `STAR_COUNT` and the `<Dust>` / `<Starfield>`
    materials.

## Build

```bash
npm run build
npm start
```

## Deploy

The site is a standard Next.js app. Easiest path is Vercel:

1. Push this folder to a GitHub repo.
2. Import it at vercel.com/new — no configuration needed.
3. (Optional) add a custom domain.

For a static host (GitHub Pages, Netlify drop) add `output: "export"` to
`next.config.mjs` and run `npm run build`; the site is emitted to `out/`.
The sphere renders client-side, so static export works.
