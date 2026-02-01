import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { pipeline } from "@xenova/transformers";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function l2Normalize(v) {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

function toVector(output) {
  if (typeof output === "object" && output !== null && "data" in output) {
    const dataVal = output.data;
    if (Array.isArray(dataVal)) {
      const first = dataVal[0];
      if (Array.isArray(first)) return first.map(Number);
      return dataVal.map(Number);
    }
    if (ArrayBuffer.isView(dataVal)) return Array.from(dataVal, Number);
  }
  throw new Error("Embedding output does not contain a usable vector.");
}

function parseSections(md) {
  // section = last seen "## ..."
  const lines = md.split("\n");
  let section = "General";
  const blocks = [];
  let buf = [];

  const flush = () => {
    const text = buf.join("\n").trim();
    if (text.length > 50) blocks.push({ section, text });
    buf = [];
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.*)/);
    if (h2) {
      flush();
      section = h2[1].trim();
      continue;
    }
    buf.push(line);
    // flush on blank line for paragraph-style chunks
    if (line.trim() === "") flush();
  }
  flush();
  return blocks;
}

async function run() {
  console.log("Indexing…");

  // Clear existing chunks (recommended)
  await supabase.from("knowledge_chunks").delete().neq("id", 0);

const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  const base = path.join(process.cwd(), "knowledge");
  const files = fs.readdirSync(base).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const source = file.replace(".md", "").toLowerCase(); // about/skills/experience/projects
    const md = fs.readFileSync(path.join(base, file), "utf8");

    const blocks = parseSections(md);

    for (const b of blocks) {
      const out = await extractor(b.text, { pooling: "mean" });
      const vec = l2Normalize(toVector(out));

      const { error } = await supabase.from("knowledge_chunks").insert({
        content: b.text,
        embedding: vec,
        source,
        section: b.section,
      });

      if (error) throw new Error(error.message);
    }
  }

  console.log("✅ Re-index complete");
}

run().catch((e) => {
  console.error("❌ Indexing failed:", e?.message || e);
  process.exit(1);
});
