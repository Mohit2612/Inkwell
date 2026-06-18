import Link from "next/link";
import { Sparkles, Gauge, Download, Check, ArrowRight, Target, Pen, FileText, Zap } from "lucide-react";
import { BRAND } from "@/lib/brand";

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E2ECFF]">
      {/* Skip to main content */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>

      {/* ── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-[#1A2B4A]/80 bg-[#070B14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary ring-1 ring-primary/30">
              <Pen className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold text-[#E2ECFF]">{BRAND.name}</span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex" aria-label="Site navigation">
            <a href="#how" className="text-sm text-[#6B7EAA] transition-colors hover:text-[#E2ECFF]">Features</a>
            <a href="#pricing" className="text-sm text-[#6B7EAA] transition-colors hover:text-[#E2ECFF]">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="hidden text-sm text-[#6B7EAA] transition-colors hover:text-[#E2ECFF] md:block">
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all duration-150 hover:bg-primary-dark hover:shadow-glow-sm active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-aurora pb-28 pt-20 md:pt-32">
          {/* Aurora background glow */}
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-accent/8 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-primary/8 blur-[80px]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              {/* Copy */}
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  AI-powered · ATS-optimized
                </span>

                <h1 className="mt-5 text-5xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-[4rem]">
                  <span className="glow-text">{BRAND.tagline}</span>
                </h1>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-[#6B7EAA]">
                  Build a polished, ATS-ready resume in minutes. Live preview,
                  AI bullet rewrites, and a real-time score so you can focus on
                  the interview — not the formatting.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all duration-150 hover:bg-primary-dark hover:shadow-glow-primary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Build my resume <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a
                    href="#how"
                    className="inline-flex items-center rounded-xl border border-[#1A2B4A] bg-[#0D1426] px-6 py-3 text-sm font-semibold text-[#E2ECFF] transition-all duration-150 hover:border-primary/40 hover:bg-[#132040] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    See how it works
                  </a>
                </div>

                <ul className="mt-8 flex flex-wrap gap-5 text-sm text-[#6B7EAA]">
                  {["Free to start", "No card required", "Export to PDF"].map((item) => (
                    <li key={item} className="flex items-center gap-1.5">
                      <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hero visual — glowing resume card */}
              <div className="hidden lg:block" aria-hidden="true">
                <div className="relative">
                  {/* ATS score badge */}
                  <div className="absolute -left-6 top-6 z-10 rounded-2xl border border-primary/20 bg-[#0D1426] px-4 py-3 shadow-glow-sm">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7EAA]">ATS Score</div>
                    <div className="text-3xl font-black text-primary">94</div>
                    <div className="flex items-center gap-1 text-xs text-accent">
                      <span>↑</span> Excellent
                    </div>
                  </div>

                  {/* Main card */}
                  <div className="ml-8 overflow-hidden rounded-2xl border border-primary/15 bg-[#0D1426] shadow-elevation-3">
                    {/* Card header bar */}
                    <div className="flex items-center gap-2 border-b border-[#1A2B4A] bg-[#070B14] px-4 py-2.5">
                      <div className="h-2 w-2 rounded-full bg-red-500/60" />
                      <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                      <div className="h-2 w-2 rounded-full bg-green-500/60" />
                      <div className="ml-3 h-4 flex-1 rounded-full bg-[#1A2B4A]" />
                    </div>

                    <div className="p-5">
                      {/* Resume doc inside card */}
                      <div className="rounded-xl border border-[#1A2B4A]/60 bg-white p-5">
                        <div className="border-b border-slate-100 pb-3">
                          <div className="text-sm font-bold text-slate-800">Alex Rivera</div>
                          <div className="text-xs font-semibold text-violet-600">Senior Software Engineer</div>
                          <div className="mt-1 text-[10px] text-slate-400">alex.rivera@example.com · linkedin.com/in/alex-rivera</div>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          <div className="text-[8px] font-bold uppercase tracking-wider text-slate-300">Experience</div>
                          {[1, 5 / 6, 4 / 5, 11 / 14].map((w, i) => (
                            <div key={i} className="h-1.5 rounded-full bg-slate-100" style={{ width: `${w * 100}%` }} />
                          ))}
                          <div className="mt-2 text-[8px] font-bold uppercase tracking-wider text-slate-300">Skills</div>
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {["React", "TypeScript", "Node.js", "AWS"].map((s) => (
                              <span key={s} className="rounded-full bg-violet-50 px-2 py-0.5 text-[7px] font-semibold text-violet-700">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* AI suggestion chip */}
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/8 px-3 py-2.5">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                        <span className="text-[11px] text-[#E2ECFF]">
                          <span className="font-semibold text-primary">AI improved: </span>
                          Reduced CI/CD build time by 40% via parallel pipelines
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Keyword match badge */}
                  <div className="absolute -right-4 bottom-10 rounded-2xl border border-accent/20 bg-[#0D1426] px-4 py-3 shadow-glow-cyan">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7EAA]">Keyword match</div>
                    <div className="text-2xl font-black text-accent">87%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats bar ────────────────────────────────────────── */}
        <section className="border-y border-[#1A2B4A] bg-[#0D1426] py-8">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                { value: "10K+", label: "Resumes built" },
                { value: "94%", label: "Avg ATS score" },
                { value: "3 min", label: "Avg build time" },
                { value: "Free", label: "To get started" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-primary">{s.value}</div>
                  <div className="mt-1 text-xs text-[#6B7EAA]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section id="how" className="bg-[#070B14] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</span>
              <h2 className="mt-3 text-3xl font-black text-[#E2ECFF] md:text-4xl">
                From blank page to{" "}
                <span className="glow-text">interview-ready</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[#6B7EAA]">
                Three steps to a resume that clears ATS filters and impresses the humans behind them.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                {
                  step: "01",
                  icon: <FileText className="h-5 w-5" />,
                  title: "Fill in your details",
                  body: "Guided fields walk you through every section. Live preview updates with every keystroke — no guessing what the final PDF looks like.",
                  glow: "hover:shadow-glow-sm",
                },
                {
                  step: "02",
                  icon: <Sparkles className="h-5 w-5" />,
                  title: "Let AI sharpen it",
                  body: "One click rewrites any bullet into a metric-driven achievement. Paste a job description to see your keyword match score instantly.",
                  glow: "hover:shadow-glow-primary",
                },
                {
                  step: "03",
                  icon: <Download className="h-5 w-5" />,
                  title: "Export and apply",
                  body: "Download a pixel-perfect PDF with selectable text — ATS-readable, recruiter-friendly, and ready to send.",
                  glow: "hover:shadow-glow-cyan",
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className={`glow-border rounded-2xl bg-[#0D1426] p-7 transition-shadow duration-300 ${s.glow}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-primary/20 leading-none">{s.step}</span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="mt-4 font-bold text-[#E2ECFF]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7EAA]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Feature highlights ───────────────────────────────── */}
        <section className="bg-[#0D1426] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Features</span>
              <h2 className="mt-3 text-3xl font-black text-[#E2ECFF] md:text-4xl">
                Everything you need to get hired
              </h2>
            </div>

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <Gauge className="h-5 w-5" />, title: "Live ATS score", body: "Transparent checklist that scores completeness in real time as you type.", color: "text-yellow-400", ring: "ring-yellow-400/20 bg-yellow-400/8" },
                { icon: <Sparkles className="h-5 w-5" />, title: "AI bullet rewrite", body: "Transform flat descriptions into punchy, metric-driven achievements.", color: "text-primary", ring: "ring-primary/20 bg-primary/8" },
                { icon: <Target className="h-5 w-5" />, title: "Keyword targeting", body: "Paste any job description — see exactly which keywords you cover.", color: "text-accent", ring: "ring-accent/20 bg-accent/8" },
                { icon: <Zap className="h-5 w-5" />, title: "One-click PDF", body: "Print-perfect A4 with selectable text — ATS-readable, no surprises.", color: "text-green-400", ring: "ring-green-400/20 bg-green-400/8" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="glow-border rounded-2xl bg-[#070B14] p-5 transition-shadow duration-300 hover:shadow-glow-sm"
                >
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${f.ring} ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-3 font-semibold text-[#E2ECFF]">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#6B7EAA]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section id="pricing" className="bg-[#070B14] py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</span>
              <h2 className="mt-3 text-3xl font-black text-[#E2ECFF] md:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-[#6B7EAA]">
                Start free. Upgrade when you need AI rewrites and unlimited exports.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              <PricingCard
                tier="Free" price="$0" period="forever"
                description="Build and export one resume. No card required."
                features={["1 resume", "Live preview", "ATS score", "PDF export"]}
              />
              <PricingCard
                tier="Pro" price="$9" period="per month"
                description="Unlimited resumes, AI rewrites, and cover letters."
                features={["Unlimited resumes", "AI bullet rewrite", "AI cover letter", "Keyword targeting", "PDF export"]}
                highlight
              />
              <PricingCard
                tier="Team" price="Custom" period="contact us"
                description="For staffing agencies, career centers, and HR teams."
                features={["Shared templates", "Team seats & RBAC", "Audit log", "SSO / SAML", "Priority support"]}
              />
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-cta py-28">
          {/* Glow blob */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <div className="h-[400px] w-[600px] rounded-full bg-primary/20 blur-[100px]" />
          </div>
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <div className="mb-4 flex justify-center">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Join 10,000+ job seekers
              </span>
            </div>
            <h2 className="text-4xl font-black md:text-5xl">
              <span className="glow-text">Ready to land the interview?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[#6B7EAA]">
              Join professionals who use Inkwell to get past the bots and in front of the humans.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-white shadow-glow-primary transition-all duration-150 hover:bg-primary-dark hover:shadow-glow-primary active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Build my resume — it&apos;s free{" "}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-[#1A2B4A] bg-[#040711] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/25">
              <Pen className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="font-semibold text-[#E2ECFF]">{BRAND.name}</span>
          </div>
          <nav className="flex flex-wrap items-center gap-6 text-sm text-[#6B7EAA]" aria-label="Footer navigation">
            <a href="#" className="transition-colors hover:text-[#E2ECFF]">Privacy</a>
            <a href="#" className="transition-colors hover:text-[#E2ECFF]">Terms</a>
            <a href={`mailto:${BRAND.supportEmail}`} className="transition-colors hover:text-[#E2ECFF]">Support</a>
          </nav>
          <p className="text-sm text-[#3D5080]">© {year} {BRAND.legal}</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  tier, price, period, description, features, highlight = false,
}: {
  tier: string; price: string; period: string;
  description: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-7 transition-shadow duration-300 ${
        highlight
          ? "border-primary/40 bg-[#0D1426] shadow-glow-sm hover:shadow-glow-primary"
          : "border-[#1A2B4A] bg-[#0D1426] hover:border-primary/20 hover:shadow-glow-sm glow-border"
      }`}
    >
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-glow-sm">
            Most popular
          </span>
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-[#6B7EAA]">{tier}</p>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`text-4xl font-black ${highlight ? "glow-text" : "text-[#E2ECFF]"}`}>
          {price}
        </span>
        <span className="text-sm text-[#6B7EAA]">/ {period}</span>
      </div>
      <p className="mt-2 text-sm text-[#6B7EAA]">{description}</p>
      <Link
        href="/dashboard"
        className={`mt-5 flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          highlight
            ? "bg-primary text-white hover:bg-primary-dark hover:shadow-glow-sm"
            : "border border-[#1A2B4A] bg-[#132040] text-[#E2ECFF] hover:border-primary/40"
        }`}
      >
        Get started
      </Link>
      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-[#E2ECFF]/80">
            <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
