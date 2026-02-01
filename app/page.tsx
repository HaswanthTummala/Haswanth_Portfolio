"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { role: "user" | "bot"; text: string };

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "bot", text: "Hi! Chat with my AI to know more." },
  ]);
  const [text, setText] = useState("");
  const [suggest, setSuggest] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const [leadOpen, setLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const router = useRouter();
const [lastTopic, setLastTopic] = useState<string>("about");

const chatHints = [
  "Show my resume",
  "What projects did I build?",
];

  useEffect(() => {
    if (chatOpen) setTimeout(() => inputRef.current?.focus(), 120);
  }, [chatOpen]);
useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages, chatOpen]);

  // ✅ ONE (and only one) sendMessage function
  async function sendMessage(customText?: string, topicOverride?: string) {
  const t = (customText ?? text).trim();
  if (!t) return;

  setMessages((m) => [...m, { role: "user", text: t }]);
  setText("");
  setSuggest([]);

  // choose topic to send
  const topicToSend = (topicOverride ?? lastTopic ?? "").trim();

  setMessages((m) => [...m, { role: "bot", text: "⏳ Thinking..." }]);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: t, topic: topicToSend }),
    });

    const raw = await res.text();

    if (!res.ok) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "bot", text: `API error ${res.status}: ${raw.slice(0, 200)}` };
        return copy;
      });
      return;
    }

    let data: unknown = null;
    try { data = JSON.parse(raw); } catch { data = { reply: raw }; }

    const reply =
      typeof (data as { reply?: unknown })?.reply === "string"
        ? String((data as { reply: string }).reply)
        : "No reply returned from API.";

    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "bot", text: reply };
      return copy;
    });

    const suggestArr = (data as { suggest?: unknown })?.suggest;
    if (Array.isArray(suggestArr)) setSuggest(suggestArr.filter((x) => typeof x === "string") as string[]);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown network error";
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "bot", text: `Network error: ${msg}` };
      return copy;
    });
  }
}

  

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-120px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute -right-48 bottom-[-160px] h-[520px] w-[520px] rounded-full bg-rose-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      {/* HERO */}
      <section className="relative mx-auto flex min-h-screen max-w-6xl items-center px-5 sm:px-6">
        <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-12">
          {/* LEFT */}
          <div className="order-2 max-w-xl text-center md:order-1 md:text-left">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl whitespace-nowrap">
              Haswanth Tummala
            </h1>

            <p className="mt-3 text-base text-zinc-300 sm:text-lg md:text-xl">
              Data &amp; AI Engineer
            </p>

            <p className="mt-2 text-sm text-zinc-400 sm:text-base">
              AWS • SQL • Python • Agentic AI
            </p>

            <div className="mt-6 flex justify-center gap-4 md:justify-start">
              <SocialIcon
                href="https://www.linkedin.com/in/haswanth-tummala-02b1861aa/"
                label="LinkedIn"
              >
                <LinkedInIcon />
              </SocialIcon>

              <SocialIcon href="https://github.com/HaswanthTummala?tab=repositories" label="GitHub">
                <GitHubIcon />
              </SocialIcon>

              <SocialIcon
                href="https://www.instagram.com/haswanth_tummala/"
                label="Instagram"
              >
                <InstagramIcon />
              </SocialIcon>
            </div>
          </div>

          {/* RIGHT: big circle image */}
          <div className="relative order-1 flex justify-center md:order-2 md:justify-end">
            <div className="pointer-events-none absolute right-0 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-gradient-to-tr from-fuchsia-500/25 via-indigo-500/20 to-rose-500/25 blur-3xl" />

            <div
              className="
                relative flex items-center justify-center
                rounded-full bg-zinc-900/40 border border-white/10 shadow-2xl
                h-[280px] w-[280px]
                sm:h-[340px] sm:w-[340px]
                md:h-[420px] md:w-[420px]
                lg:h-[480px] lg:w-[480px]
              "
            >
              <Image
                src="/hash.png"
                alt="Haswanth Tummala"
                fill
                priority
                className="
                  rounded-full p-6 object-contain
                  drop-shadow-[0_30px_70px_rgba(0,0,0,0.65)]
                  [filter:contrast(1.08)_saturate(1.05)_brightness(1.02)]
                "
              />
            </div>
          </div>
        </div>
      </section>

      {/* CHAT POPUP */}
      {chatOpen && (
        <div
          className="
            fixed z-50
            bottom-28 right-4 left-4
            sm:left-auto sm:right-6 sm:w-[360px]
            overflow-hidden rounded-2xl
            border border-white/10 bg-zinc-950/95
            shadow-2xl backdrop-blur
          "
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Ask Haswanth</p>
              <p className="text-xs text-zinc-400">Portfolio assistant</p>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-lg border border-white/10 px-2 py-1 text-xs text-zinc-200 hover:bg-white/5"
            >
              Close
            </button>
          </div>

          {/* Messages + Suggest buttons */}
          
          <div className="h-[260px] overflow-y-auto px-4 py-3">
            <div className="space-y-3">
              {/* Watermark hints for new users */}
  {messages.length === 1 && (
    <div className="mb-3 text-xs text-zinc-400">
      <p className="mb-1">Try asking:</p>
      <ul className="list-disc pl-4 space-y-1">
        {chatHints.map((h) => (
          <li key={h} className="italic">
            {h}
          </li>
        ))}
      </ul>

    </div>
  )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-auto w-fit max-w-[85%] rounded-2xl bg-white/10 px-3 py-2 text-sm text-zinc-100"
                      : "w-fit max-w-[85%] rounded-2xl bg-zinc-900/70 px-3 py-2 text-sm text-zinc-200"
                  }
                >
                  {m.text}
                </div>

              ))}
              <div ref={endRef} />

            </div>

            {suggest.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggest.map((s) => (
                  <button
                    key={s}
                    type="button"
onClick={() => {
  if (s.toLowerCase() === "portfolio") {
    setLeadOpen(true);
    setSuggest([]);
    setMessages((m) => [
      ...m,
      { role: "bot", text: "Please enter your name and email to view my portfolio." },
    ]);
 } else {
  const topic = s.toLowerCase();
  setLastTopic(topic);
  sendMessage(s, topic); // ✅ pass topic immediately
}


}}
className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

{leadOpen && (
  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3">
    <p className="mb-2 text-xs text-zinc-300">Portfolio Access</p>

    <input
      value={leadName}
      onChange={(e) => setLeadName(e.target.value)}
      placeholder="Your name"
      className="mb-2 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
    />

    <input
      value={leadEmail}
      onChange={(e) => setLeadEmail(e.target.value)}
      placeholder="Your email"
      type="email"
      className="mb-3 w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100"
    />

        <div className="mt-3 flex gap-2">
      {/* Not now / Close */}
      <button
        type="button"
        onClick={() => setLeadOpen(false)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-zinc-100 hover:bg-white/10"
      >
        Not now
      </button>

      {/* Continue */}
      <button
        type="button"
        onClick={async () => {
          const name = leadName.trim();
          const email = leadEmail.trim();

          if (!name) {
            setMessages((m) => [
              ...m,
              { role: "bot", text: "Please enter your name." },
            ]);
            return;
          }

          const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);
          if (!isValidEmail) {
            setMessages((m) => [
              ...m,
              {
                role: "bot",
                text: "Please enter a valid email (example: name@gmail.com).",
              },
            ]);
            return;
          }

          try {
            const res = await fetch("/api/lead", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email }),
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok || data?.ok === false) {
              setMessages((m) => [
                ...m,
                {
                  role: "bot",
                  text: data?.error || "Failed to save details. Please try again.",
                },
              ]);
              return;
            }

            // ✅ success
            setLeadOpen(false);
            setChatOpen(false);
            router.push("/portfolio");
          } catch {
            setMessages((m) => [
              ...m,
              { role: "bot", text: "Network error. Please try again." },
            ]);
          }
        }}
        className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
      >
        Continue
      </button>
    </div>


  </div>
)}



          <form
            className="border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask something..."
                className="w-full rounded-xl border border-white/10 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-white/25"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}


      
{/*..............................................................*/}

      {/* BOT ICON + HELPER TEXT */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <div
          className="
            rounded-xl border border-white/10 bg-zinc-950/90
            px-3 py-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur
            animate-pulse
          "
        >
          Chat with my AI to know more
        </div>

        <button
          onClick={() => setChatOpen((v) => !v)}
          className="
            relative h-16 w-16 rounded-full
            bg-gradient-to-tr from-fuchsia-500/70 via-indigo-500/60 to-rose-500/70
            p-[2px] shadow-2xl transition
            hover:scale-[1.03] active:scale-[0.98]
          "
          aria-label="Open chat"
          title="Chat"
        >
          <div className="relative flex h-full w-full items-center justify-center rounded-full bg-zinc-950/85 backdrop-blur">
            <span className="absolute inset-0 rounded-full animate-ping bg-white/10" />
            <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]" />
            <BotIcon />
          </div>
        </button>
      </div>
    </main>
  );
}


/* --------------------- Small helpers (inline) --------------------- */

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className="
        inline-flex h-11 w-11 items-center justify-center
        rounded-full border border-white/10 bg-white/5
        hover:bg-white/10 hover:border-white/20 transition
      "
    >
      {children}
    </a>
  );
}

function BotIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M12 2v2M7 6h10a4 4 0 0 1 4 4v4a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-4a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12h.01M15.5 12h.01"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M9 16c1.8 1.3 4.2 1.3 6 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M6.5 9.5V18M6.5 6.5h.01M10 18v-5.2c0-1.9 1.1-3.3 3-3.3s3 1.4 3 3.3V18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M9 19c-4 1.2-4-2-5-2m10 4v-3.1c0-.9.3-1.6.8-2-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0C17.9 3.6 19 3.9 19 3.9c.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.5.4.8 1.2.8 2V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" className="text-white">
      <path
        d="M7 7h10a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-6a4 4 0 0 1 4-4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M17.5 8.5h.01"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
