import Hero from "@/components/Hero";
import Nav from "@/components/Nav";
import Section from "@/components/Section";
import Pill from "@/components/Pill";
import Constellation from "@/components/Constellation";
import { techIcon } from "@/lib/tech-icons";
import {
  activities,
  education,
  experience,
  languages,
  profile,
  projects,
  stack,
} from "@/lib/content";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="relative">
        <Constellation />
        <Hero />

        {/* About ------------------------------------------------------------ */}
        <Section id="about" title="About">
          <div className="space-y-4 text-[15px] leading-relaxed text-ink-dim">
            <p>
              I&apos;m a QA Engineer who has spent 3+ years making sure web and
              mobile products hold up before they reach users — across logistics
              platforms, AAA games and research tooling. I work end to end: from
              refining requirements in grooming, to writing and automating test
              cases, to validating APIs, webhooks and integrations.
            </p>
            <p>
              I&apos;m currently a dual-degree student in Applied Computer Science
              (City University of Seattle) and Systems Engineering (UASLP), and
              I build side projects in Python and TypeScript to keep my
              engineering sharp.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {languages.map((l) => (
                <Pill key={l.name}>
                  {l.name} · {l.level}
                </Pill>
              ))}
            </div>
          </div>
        </Section>

        {/* Stack ----------------------------------------------------------- */}
        <Section id="stack" title="Tech Stack">
          <dl className="space-y-6">
            {stack.map((group) => (
              <div
                key={group.label}
                className="grid gap-2 sm:grid-cols-[14rem_1fr] sm:items-center sm:gap-5"
              >
                <dt className="font-mono text-sm uppercase tracking-[0.06em] text-ink-faint">
                  {group.label}
                </dt>
                <dd className="space-y-2">
                  {group.bands.map((band, i) => (
                    <div
                      key={band.level ?? i}
                      className="flex flex-wrap items-center gap-2"
                    >
                      {band.level ? (
                        <span className="mr-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
                          {band.level}
                        </span>
                      ) : null}
                      {band.items.map((item) => (
                        <Pill key={item} icon={techIcon(item)}>
                          {item}
                        </Pill>
                      ))}
                    </div>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Experience ---------------------------------------------------- */}
        <Section id="experience" title="Experience">
          <div className="space-y-12">
            {experience.map((job) => (
              <article key={job.company + job.period}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="text-[15px] font-medium text-ink">
                    {job.title}
                    <span className="text-ink-dim"> · {job.company}</span>
                    {job.type ? (
                      <span className="ml-2 rounded-full border border-base-border px-2 py-0.5 align-middle text-[11px] uppercase tracking-wide text-ink-faint">
                        {job.type}
                      </span>
                    ) : null}
                  </h3>
                  <span className="font-mono text-[12px] text-ink-faint">
                    {job.period}
                  </span>
                </div>
                {job.location ? (
                  <p className="mt-0.5 text-[13px] text-ink-faint">{job.location}</p>
                ) : null}
                <ul className="mt-3 space-y-2">
                  {job.highlights.map((h, i) => (
                    <li
                      key={i}
                      className="relative pl-4 text-[14px] leading-relaxed text-ink-dim before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-ink-faint"
                    >
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {job.stack.map((s) => (
                    <Pill key={s} icon={techIcon(s)}>
                      {s}
                    </Pill>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </Section>

        {/* Projects ---------------------------------------------------- */}
        <Section id="projects" title="Projects">
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => {
              const inner = (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-medium text-ink">{p.name}</h3>
                    {p.href ? (
                      <span className="text-ink-faint transition-colors group-hover:text-ink">
                        ↗
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-dim">
                    {p.blurb}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.stack.map((s) => (
                      <Pill key={s} icon={techIcon(s)}>
                        {s}
                      </Pill>
                    ))}
                  </div>
                </>
              );
              const cls =
                "group flex flex-col rounded-xl border border-base-border bg-base-raised p-5 transition-colors hover:border-ink-faint";
              return p.href ? (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <div key={p.name} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Education --------------------------------------------------- */}
        <Section id="education" title="Education">
          <div className="space-y-8">
            {education.map((e) => (
              <div
                key={e.school}
                className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-base-border bg-base-raised font-mono text-[9px] font-medium tracking-tight text-ink-dim"
                    aria-hidden
                  >
                    {e.short}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-medium text-ink">
                      {e.school}
                    </h3>
                    <p className="text-[14px] text-ink-dim">{e.program}</p>
                    <p className="text-[13px] text-ink-faint">{e.location}</p>
                  </div>
                </div>
                <span className="font-mono text-[12px] text-ink-faint">
                  {e.period}
                </span>
              </div>
            ))}
          </div>

          <h3 className="mb-6 mt-14 font-mono text-base font-semibold uppercase tracking-[0.14em] text-ink">
            Leadership &amp; Activities
          </h3>
          <div className="space-y-6">
            {activities.map((a) => (
              <div key={a.title}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <h4 className="text-[14px] font-medium text-ink">
                    {a.title}
                    <span className="text-ink-dim"> · {a.org}</span>
                  </h4>
                  {a.period ? (
                    <span className="font-mono text-[12px] text-ink-faint">
                      {a.period}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-dim">
                  {a.detail}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact ---------------------------------------------------- */}
        <Section id="contact" title="Contact">
          <p className="text-[15px] leading-relaxed text-ink-dim">
            Open to internships and QA / SDET roles. The fastest way to reach me
            is email.
          </p>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a
              href={`mailto:${profile.email}`}
              className="text-ink underline decoration-base-border underline-offset-4 transition-colors hover:decoration-ink"
            >
              {profile.email}
            </a>
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="text-ink-dim transition-colors hover:text-ink"
            >
              github.com/Al3mf
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="text-ink-dim transition-colors hover:text-ink"
            >
              linkedin.com/in/alejandro-melo-flores
            </a>
          </div>
        </Section>

        <footer className="border-t border-base-border py-10">
          <div className="mx-auto w-full max-w-content px-6">
            <p className="font-mono text-[12px] text-ink-faint">
              © {new Date().getFullYear()} {profile.name}. Built with Next.js &amp;
              Three.js.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
