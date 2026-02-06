export const runtime = "nodejs";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";



const RESUME_LINK =
  "https://drive.google.com/drive/folders/1CH_nLX1GKnTzzOb-PaHEAp4T739i_eXP?usp=sharing";

/** Intent should match your DB 'source' values: about/experience/skills/projects */
type Intent = "greet" | "resume" | "experience" | "skills" | "projects" | "about" | "education" |"unknown";

type MatchRow = {
  content: string;
  source: string | null;
  section: string | null;
  similarity: number | null;
};

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key);
}

function detectIntent(q: string): Intent {
  const s = q.toLowerCase().trim();

  // greetings / very short inputs => never run vector search
  if (s.length < 4 || /^(hi|hello|hey|hii|hai|yo|sup)$/i.test(s)) return "greet";

  if (s.includes("resume") || s.includes("cv") || s.includes("download") || s.includes("pdf"))
    return "resume";

  if (s.includes("experience") || s.includes("work") || s.includes("intern"))
    return "experience";

  if (s.includes("skill") || s.includes("stack") || s.includes("tech") || s.includes("tools"))
    return "skills";

  if (s.includes("project") || s.includes("projects") || s.includes("portfolio"))
  return "projects";

if (
  s.includes("about") ||
  s.includes("who are you") ||
  s.includes("tell me about") ||
  s.includes("introduction") ||
  s.includes("summary")
) return "about";

if (
  s.includes("education") ||
  s.includes("university") ||
  s.includes("college") ||
  s.includes("gpa") ||
  s.includes("master") ||
  s.includes("bachelor") ||
  s.includes("degree") ||
  s.includes("certification") ||
  s.includes("certifications") ||
  s.includes("certificate")
) return "education";



  return "unknown";
}

// ---- Embedder (cached) ----
// let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;
let embedder: ((input: string, options: { pooling: "mean" }) => Promise<unknown>) | null = null;

async function getEmbedder() {
  if (embedder) return embedder;

  // ✅ lazy import (prevents GET from crashing)
  const mod = await import("@xenova/transformers");
  const pipe = await mod.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

  embedder = pipe as unknown as (input: string, options: { pooling: "mean" }) => Promise<unknown>;
  return embedder;
}

// Typed wrapper to avoid TS union chaos (no any)
type FeatureExtractFn = (
  input: string,
  options: { pooling: "mean" }
) => Promise<unknown>;

function asFeatureExtractor(fn: unknown): FeatureExtractFn {
  return fn as FeatureExtractFn;
}

function l2Normalize(v: number[]) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

// Extract a vector(384) from Xenova output safely
function toVector384(output: unknown): number[] {
  if (typeof output === "object" && output !== null && "data" in output) {
    const dataVal = (output as { data?: unknown }).data;

    // Common: [ [384] ] or [384]
    if (Array.isArray(dataVal)) {
      const first = dataVal[0];
      if (Array.isArray(first)) return first.map(Number);
      return dataVal.map(Number);
    }

    // Typed arrays: Float32Array etc.
    if (ArrayBuffer.isView(dataVal)) {
      const view = dataVal as unknown as ArrayLike<number>;
      return Array.from(view, Number);
    }
  }

  throw new Error("Embedding output did not contain a usable data vector.");
}

function isMatchRowArray(x: unknown): x is MatchRow[] {
  return (
    Array.isArray(x) &&
    x.every((r) => {
      if (typeof r !== "object" || r === null) return false;
      const o = r as Record<string, unknown>;
      return typeof o.content === "string" && "similarity" in o;
    })
  );
}


function suggestions() {
  return ["Resume", "Experience", "Skills", "projects", "Portfolio"];
}
function cleanLine(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/^[-•\s]+/, "")
    .trim();
}

// Split a chunk into smaller bullet-like lines (prevents huge paragraph dumps)
function chunkToBullets(chunk: string): string[] {
  const raw = chunk
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

  // If it already has multiple lines, use those
  if (raw.length >= 2) return raw.map(cleanLine).filter(Boolean);

  // Otherwise split by sentence-ish boundaries
  return chunk
    .split(/(?:\.\s+|;\s+|\s+\|\s+)/g)
    .map((x) => cleanLine(x))
    .filter((x) => x.length >= 8);
}

function uniqueKeepOrder(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of items) {
    const k = x.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

function formatAnswer(title: string, bullets: string[], maxBullets = 5) {
  const top = uniqueKeepOrder(bullets)
    .filter((b) => b.length > 0)
    .slice(0, maxBullets);

  if (top.length === 0) return "";

  return `${title}\n${top.map((b) => `• ${b}`).join("\n")}\n\nYou can ask: “more details”`;
}

function clamp(s: string, max = 140) {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max - 1) + "…" : t;
}

function toBulletsFromRows(rows: { content: string }[], maxBullets: number) {
  const bullets: string[] = [];
  for (const r of rows) {
    const parts = r.content
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    // If chunk is a long paragraph, break it into smaller pieces
    const lines =
      parts.length >= 2
        ? parts
        : r.content.split(/(?:\.\s+|;\s+|\s+\|\s+)/g).map((x) => x.trim());

    for (const line of lines) {
      const cleaned = clamp(line.replace(/^[-•]\s*/, ""), 140);
      if (cleaned.length >= 8) bullets.push(cleaned);
      if (bullets.length >= maxBullets) return bullets;
    }
  }
  return bullets;
}


export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // or your domain
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}


export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "Use POST /api/chat with JSON { message }",
  });
}

export async function POST(req: Request) {
  
  try {
    const body = await req.json().catch(() => ({} as unknown));
    const question =
      typeof (body as { message?: unknown })?.message === "string"
        ? (body as { message: string }).message.trim()
        : "";
      const bodyTopic =
       typeof (body as { topic?: unknown })?.topic === "string"
        ? (body as { topic: string }).topic
        : "";
        const wantsMore = /(^|\s)(more|more details|details|expand)(\s|$)/i.test(question);

    if (!question) {
      return NextResponse.json({
        reply: "Ask me about my resume, experience, skills, projects, or portfolio.",
        suggest: suggestions(),
      });
    }
// Detect if user wants expanded answers

    let intent = detectIntent(question);

if (wantsMore && intent === "unknown" && bodyTopic) {
  intent = bodyTopic as Intent;
}


    // ✅ greeting: do not run vector search
    if (intent === "greet") {
      return NextResponse.json({
        reply: "Hi 👋 What would you like to know about me?",
        suggest: suggestions(),
      });
    }

    // ✅ resume: direct link
    if (intent === "resume") {
      return NextResponse.json({
        reply: `Resume:\n${RESUME_LINK}`,
        suggest: suggestions(),
      });
    }

    // ✅ unknown: do not run vector search (prevents random dump)
    if (intent === "unknown") {
      return NextResponse.json({
        reply: "I can help with my resume, experience, skills, projects, or portfolio.",
        suggest: suggestions(),
      });
    }

const embed = await getEmbedder();
const embOut = await embed(question, { pooling: "mean" });

    // ✅ only here we run vector RAG
    const supabase = getSupabaseAdmin();
    const rawEmbedder = await getEmbedder();
    //const embed = asFeatureExtractor(rawEmbedder);

    //const embOut = await embed(question, { pooling: "mean" });
    const queryEmbedding = l2Normalize(toVector384(embOut));

    const { data, error } = await supabase.rpc("match_knowledge", {
      query_embedding: queryEmbedding,
      match_count: 200,
    });

    if (error) {
      return NextResponse.json({
        reply: `RAG search error: ${error.message}`,
        suggest: suggestions(),
      });
    }

    const rows: MatchRow[] = isMatchRowArray(data) ? data : [];
    // 🎓 Special handling for education intent (section-level filtering)
if (intent === "education") {
  const eduRows = rows.filter((r) => {
    const sec = typeof r.section === "string" ? r.section.toLowerCase() : "";
    return sec.includes("education");
  });

  const certRows = rows.filter((r) => {
    const sec = typeof r.section === "string" ? r.section.toLowerCase() : "";
    return sec.includes("cert");
  });

  const eduBullets = uniqueKeepOrder(eduRows.flatMap((r) => chunkToBullets(r.content)));
  const certBullets = uniqueKeepOrder(certRows.flatMap((r) => chunkToBullets(r.content)));

  const parts: string[] = [];

  const eduText = formatAnswer("Education", eduBullets, 3);
  if (eduText) parts.push(eduText);

  const certText = formatAnswer("Certifications", certBullets, 3);
  if (certText) parts.push(certText);

  if (parts.length === 0) {
    return NextResponse.json({
      reply: "Education details aren’t available yet.",
      suggest: suggestions(),
    });
  }

  return NextResponse.json({
    reply: parts.join("\n"),
    suggest: suggestions(),
  });
}


const hasSource = rows.some(
  (r) => typeof r.source === "string" && r.source.length > 0
);

    // Similarity threshold + source filter (prevents mixing)
   const THRESH = 0.42;

const filtered = rows.filter((r) => {
  const sim = typeof r.similarity === "number" ? r.similarity : -1;
  const src = typeof r.source === "string" ? r.source : "";

  const sourceMatches =
    src === intent ||
    src.endsWith(`/${intent}`) ||
    src === `${intent}.md`;

  return sim >= THRESH && (!hasSource || sourceMatches);
});



    // fallback: take best match within the intent source even if similarity is low
if (filtered.length === 0) {
  // fallback: best matches within same intent
  const intentOnly = rows
    .filter((r) => {
      const src = typeof r.source === "string" ? r.source : "";
      return src === intent || src.endsWith(`/${intent}`) || src === `${intent}.md`;
    })
    .sort((a, b) => (Number(b.similarity) || 0) - (Number(a.similarity) || 0));

  if (intentOnly.length === 0) {
    return NextResponse.json({
      reply: `I don't have ${intent} information yet.`,
      suggest: suggestions(),
    });
  }

  const bullets = toBulletsFromRows(intentOnly, wantsMore ? 10 : 15);
  return NextResponse.json({
    reply: bullets.map((b) => `• ${b}`).join("\n"),
    suggest: suggestions(),
  });
}



  // Clean output: short bullets
    // Turn filtered rows into clean bullets (not big dumps)
const allBullets = filtered.flatMap((r) => chunkToBullets(r.content));
const bullets = uniqueKeepOrder(allBullets);

// Intent-specific titles
const title =
  intent === "experience"
    ? "Experience highlights"
    : intent === "skills"
    ? "Key skills"
    : intent === "projects"
    ? "Selected projects"
    : intent === "about"
    ? "About me"
    : "Highlights";

const reply = formatAnswer(title, bullets, wantsMore ? 10 : 5);


if (!reply) {
  // fallback to best-effort answer instead of empty
  return NextResponse.json({
    reply: "I found related info but couldn’t format it cleanly. Try using the buttons.",
    suggest: suggestions(),
  });
}

return NextResponse.json({
  reply,
  suggest: suggestions(),
});

  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown server error";
    return NextResponse.json(
      { reply: `Server error: ${msg}`, suggest: suggestions() },
      { status: 500 }
    );
  }
}
