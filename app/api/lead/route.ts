export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

console.log("ENV CHECK", {
  url: !!process.env.SUPABASE_URL,
  key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
});


function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Valid email is required." }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { ok: false, error: "Server env vars missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey);

    // Insert lead (duplicate email will fail if you created unique index)
    const { error } = await supabase.from("leads").insert([{ name, email }]);

    if (error) {
      // If duplicate, you can treat as success (optional)
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        return NextResponse.json({ ok: true, note: "Email already exists." });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Unexpected server error." }, { status: 500 });
  }
}
