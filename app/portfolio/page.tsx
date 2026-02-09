"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Project = {
  title: string;
  subtitle?: string;
  description: string;
  tech: string[];
  github?: string;
  live?: string;
  video?: string; // youtube/drive link
  image?: string; // put in /public/portfolio/xxx.png
};

type Resource = {
  title: string;
  type: "Document" | "Video";
  description?: string;
  link: string;
  tags?: string[];
};

const RESUME_LINK =
  "https://drive.google.com/drive/folders/1CH_nLX1GKnTzzOb-PaHEAp4T739i_eXP?usp=sharing";

// ✅ Edit these arrays with your real content
const PROJECTS: Project[] = [
  {
    title: "Persnol Portfolio + AI Assistant",
    subtitle: "Next.js + Supabase + RAG",
    description:
      "I developed this portfolio using Next.js and an AI-powered chatbot built with Retrieval-Augmented Generation (RAG) to dynamically answer questions about my experience, skills, and projects.The system retrieves relevant information from structured knowledge sources and presents concise, context-aware responses instead of static page content.",
    tech: ["Next.js", "TypeScript", "Tailwind", "Supabase", "pgvector", "RAG"],
    github: "https://github.com/HaswanthTummala?tab=repositories",
    live: "https://YOUR_LIVE_URL",
    image: "/portfolio/portfolio.png",
  },
  {
    title: "ASD APP",
    subtitle: "Mobile App • Gesture/Motion Recording",
    description:
      "Autism spectrum disorder (ASD), is a neurological and developmental disorder that impairs social communication and social interaction with varying levels of severity. Expressive visual supports that can vary from colored pictures to written words have been shown to help improve confidence and encourage independence, however, these tools do not focus on developing natural language expression for the users.",
    tech: ["Android", "Java", "NLP", "ML", "RecyclerView", "UI/UX", "Data Handling"],
    github: "https://github.com/HaswanthTummala?tab=repositories",
    video: "https://youtu.be/zEDddQZKnuk",
    image: "/portfolio/Asd.webp",
  },
  {
    title: "Food Insecurity Data Analysis",
    subtitle: "Analytics + Clustering",
    description:
      "Analyzed food production and per-capita consumption trends across 45 African countries (2004–2013) using data visualization, identifying sustained growth and the impact of the 2007 global food crisis. Evaluated production versus consumption patterns to assess food security, sustainability, and regional disparities. Highlighted population growth–driven food insecurity risks and emphasized the need for coordinated long-term agricultural and policy strategies.",
    tech: ["Python", "Pandas", "EDA", "KMeans", "Visualization"],
    github: "https://github.com/HaswanthTummala?tab=repositories",
    image: "/portfolio/pic.png",
  },
  {
    title: "Real-Time News App",
    subtitle: "MEAN + Firebase",
    description:
      "News app with authentication, categories, search, and scalable article loading. Deployed with firebase hosting and data getted from API",
    tech: ["MongoDB", "Express", "Angular", "Node.js", "Firebase"],
    github: "https://github.com/HaswanthTummala?tab=repositories",
    
    image: "/portfolio/news1.jpg",
  },
  {
    title: "Online-Examination-System",
    subtitle: "Analytics + Clustering",
    description: "Developed a web-based online examination system with user roles, timed tests, and performance tracking. The formate of the each question is different types like MCQ, Drawing, matching black etc.",
    tech: ["PHP", "JavaScriot", "SCSS", "HTML", "CSS","MYSQL"],
    github: "https://github.com/HaswanthTummala?tab=repositories",
    image: "/portfolio/online.jpg",
  },
];
// videos



const RESOURCES: Resource[] = [
  
  {
    title: "Project Demo Videos",
    type: "Video",
    description: "Short demos and walkthroughs.",
    link: "https://www.youtube.com/@haswanthtummala9187/featured",
    tags: ["Demos", "YouTube"],
  },
  
];

export default function PortfolioPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Projects" | "Documents" | "Videos">("All");

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PROJECTS;
    return PROJECTS.filter((p) => {
      const hay = `${p.title} ${p.subtitle ?? ""} ${p.description} ${p.tech.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const filteredResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RESOURCES;
    return RESOURCES.filter((r) => {
      const hay = `${r.title} ${r.description ?? ""} ${(r.tags ?? []).join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const showProjects = activeTab === "All" || activeTab === "Projects";
  const showDocs = activeTab === "All" || activeTab === "Documents";
  const showVideos = activeTab === "All" || activeTab === "Videos";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top gradient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-[-140px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute -right-48 bottom-[-160px] h-[520px] w-[520px] rounded-full bg-rose-500/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              Haswanth Tummala
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Projects • Videos • GitHub
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            <QuickLink href={RESUME_LINK} label="Resume" />
            <QuickLink href="https://github.com/HaswanthTummala?tab=repositories" label="GitHub" />
            <QuickLink href="https://www.linkedin.com/in/haswanth-tummala-02b1861aa/" label="LinkedIn" />
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === "All"} onClick={() => setActiveTab("All")}>
              All
            </TabButton>
            <TabButton active={activeTab === "Projects"} onClick={() => setActiveTab("Projects")}>
              Projects
            </TabButton>
            
            <TabButton active={activeTab === "Videos"} onClick={() => setActiveTab("Videos")}>
              Videos
            </TabButton>
          </div>

          <div className="w-full sm:w-[360px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, skills, tools..."
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/25"
            />
          </div>
        </div>

        {/* Projects */}
        {showProjects && (
          <section className="mt-10">
            <SectionTitle title="Projects" subtitle="Selected work with GitHub and demos" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((p) => (
                <ProjectCard key={p.title} p={p} />
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        {showDocs && (
          <section className="mt-12">
          
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources
                .filter((r) => r.type === "Document")
                .map((r) => (
                  <ResourceCard key={r.title} r={r} />
                ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {showVideos && (
          <section className="mt-12 pb-10">
            <SectionTitle title="Videos" subtitle="Demos and walkthroughs" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredResources
                .filter((r) => r.type === "Video")
                .map((r) => (
                  <ResourceCard key={r.title} r={r} />
                ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* ---------- Components ---------- */

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-950"
          : "rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 hover:bg-white/10"
      }
    >
      {children}
    </button>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
    >
      {label}
    </a>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-zinc-200">
      {text}
    </span>
  );
}

function ProjectCard({ p }: { p: Project }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/60 shadow-2xl">
      <div className="relative h-44 w-full bg-white/5">
        {p.image ? (
          <Image src={p.image} alt={p.title} fill className="object-cover" />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_55%)]" />
        )}
      </div>

      <div className="p-4">
        <h3 className="text-base font-semibold">{p.title}</h3>
        {p.subtitle && <p className="mt-1 text-xs text-zinc-400">{p.subtitle}</p>}
        <p className="mt-3 text-sm text-zinc-200">{p.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {p.tech.slice(0, 8).map((t) => (
            <Tag key={t} text={t} />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {p.github && <MiniLink href={p.github} label="GitHub" />}
          {p.live && <MiniLink href={p.live} label="Live" />}
          {p.video && <MiniLink href={p.video} label="Video" />}
        </div>
      </div>
    </div>
  );
}

function ResourceCard({ r }: { r: Resource }) {
  return (
    <a
      href={r.link}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-white/10 bg-zinc-950/60 p-4 shadow-2xl hover:bg-white/5"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-400">{r.type}</p>
        <span className="text-xs text-zinc-500">Open ↗</span>
      </div>

      <h3 className="mt-2 text-base font-semibold">{r.title}</h3>
      {r.description && <p className="mt-2 text-sm text-zinc-200">{r.description}</p>}

      {!!r.tags?.length && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.tags.slice(0, 6).map((t) => (
            <Tag key={t} text={t} />
          ))}
        </div>
      )}
    </a>
  );
}

function MiniLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-200 hover:bg-white/10"
    >
      {label} ↗
    </a>
  );
}
