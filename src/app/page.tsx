"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  Inbox,
  MailPlus,
  MessageSquareText,
  Moon,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signIn } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const liveThreads = [
  {
    from: "Vercel",
    subject: "Production deployment recovered",
    priority: "Urgent",
    action: "Summarized incident + drafted update",
    tone: "bg-red-500",
  },
  {
    from: "Linear",
    subject: "Sprint handoff needs owner",
    priority: "Needs reply",
    action: "Assigned follow-up for 2:30 PM",
    tone: "bg-blue-500",
  },
  {
    from: "ChaiCode",
    subject: "Hackathon judge sync",
    priority: "Calendar",
    action: "Found 3 open slots tomorrow",
    tone: "bg-emerald-500",
  },
  {
    from: "Stripe",
    subject: "Weekly billing digest",
    priority: "FYI",
    action: "Archived as low-signal digest",
    tone: "bg-violet-500",
  },
];

const automationSteps = [
  "Read new Gmail threads",
  "Ranked priority with context",
  "Drafted reply + calendar hold",
  "Waiting for your approval",
];

const metrics = [
  { label: "Noise removed", value: "38%" },
  { label: "Replies due", value: "4" },
  { label: "AI actions", value: "128" },
];

function FloatingTechIcon({
  src,
  className,
  imgClassName = "",
  reverse = false,
  delay = "0s",
}: {
  src: string;
  className: string;
  imgClassName?: string;
  reverse?: boolean;
  delay?: string;
}) {
  return (
    <div
      className={`absolute hidden items-center justify-center rounded-2xl border border-black/10 bg-white/40 p-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl lg:flex dark:border-white/10 dark:bg-white/10 ${reverse ? "animate-float-reverse" : "animate-float"} ${className}`}
      style={{ animationDelay: delay }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        className={`size-7 object-contain opacity-90 transition-all duration-300 hover:scale-110 hover:opacity-100 hover:drop-shadow-sm ${imgClassName}`}
        alt="Tech icon"
      />
    </div>
  );
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (res?.error) {
        setIsSigningIn(false);
        console.error("Sign-in error:", res.error);
      }
    } catch {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f7f4] text-neutral-950 transition-colors duration-500 dark:bg-neutral-950 dark:text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(rgba(99,102,241,0.28)_1px,transparent_1px)] [background-size:18px_18px] dark:bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_42rem)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_42rem)]" />
      <DashedArc className="top-[18rem] left-[-12rem] rotate-3" />
      <DashedArc className="top-[8rem] right-[-10rem] -rotate-6" />
      <DashedArc className="top-[33rem] right-[4rem] rotate-6 opacity-70" />

      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolled ? "px-4 pt-4" : "pt-6"
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between gap-4 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isScrolled
              ? "h-14 max-w-5xl rounded-full border border-white/20 bg-white/20 px-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
              : "h-16 max-w-7xl rounded-none border-transparent bg-transparent px-4 sm:px-6 lg:px-8"
          }`}
        >
          <div className="flex items-center gap-3 pl-1">
            <div
              className={`flex items-center justify-center transition-all duration-500 ${isScrolled ? "size-8 rounded-full bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950" : "size-9 rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950"}`}
            >
              <Zap size={15} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span
                className={`font-bold tracking-wide transition-colors duration-500 ${isScrolled ? "text-[13px] text-neutral-950 dark:text-white" : "text-sm text-neutral-950 dark:text-white"}`}
              >
                ZERO INBOX
              </span>
              <p
                className={`hidden font-medium transition-colors duration-500 sm:block ${isScrolled ? "text-[10px] text-neutral-500 dark:text-neutral-400" : "text-[11px] text-neutral-500 dark:text-neutral-400"}`}
              >
                AI command center
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-[13px] font-medium text-neutral-500 md:flex dark:text-neutral-400">
            <a
              href="/reference"
              className="transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Docs
            </a>
            <a
              href="/pricing"
              className="transition-colors hover:text-neutral-950 dark:hover:text-white"
            >
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <LandingThemeToggle />
            </div>
            <Button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className={`h-9 rounded-full px-4 text-[13px] font-semibold transition-all duration-300 active:scale-95 ${isScrolled ? "bg-neutral-950 text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200" : "bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"}`}
            >
              {isSigningIn ? (
                "Connecting..."
              ) : (
                <>
                  Go to app <ArrowRight size={14} className="ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 min-h-[90vh]">
        <FloatingTechIcon
          src="https://cdn.simpleicons.org/gmail"
          className="top-[25%] left-[8%]"
          delay="0s"
        />
        <FloatingTechIcon
          src="https://cdn.simpleicons.org/github"
          imgClassName="dark:invert"
          className="top-[45%] left-[3%]"
          reverse
          delay="1.5s"
        />
        <FloatingTechIcon
          src="https://cdn.simpleicons.org/typescript"
          className="bottom-[15%] left-[10%]"
          delay="2.5s"
        />
        <FloatingTechIcon
          src="https://cdn.simpleicons.org/react"
          className="top-[10%] left-[20%]"
          reverse
          delay="1s"
        />

        <FloatingTechIcon
          src="https://cdn.simpleicons.org/tailwindcss"
          className="top-[22%] right-[10%]"
          reverse
          delay="0.5s"
        />
        <FloatingTechIcon
          src="/corsair-logo.png"
          className="top-[50%] right-[4%]"
          delay="2s"
        />
        <FloatingTechIcon
          src="/chaicode-logo.png"
          className="right-[12%] bottom-[12%]"
          reverse
          delay="3s"
        />
        <FloatingTechIcon
          src="https://cdn.simpleicons.org/googlecalendar"
          className="top-[12%] right-[25%]"
          delay="0.8s"
        />

        <section className="relative z-20 mx-auto flex max-w-7xl flex-col items-center px-4 pt-32 pb-16 text-center sm:px-6 sm:pt-40 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mt-4 mb-7 flex flex-col items-center gap-4 rounded-[2rem] border border-white/20 bg-white/20 p-5 text-left shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl transition-all hover:border-white/30 hover:bg-white/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5 dark:shadow-[0_10px_40px_rgba(0,0,0,0.3)] dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-3 pr-4 sm:border-r sm:border-black/10 sm:dark:border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/chaicode-logo.png"
                alt="ChaiCode Logo"
                className="size-10 object-contain drop-shadow-sm"
              />
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                  Backed by
                </p>
                <p className="text-lg leading-none font-semibold text-neutral-950 dark:text-white">
                  ChaiCode
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:pl-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/corsair-logo.png"
                alt="Corsair Logo"
                className="size-10 object-contain drop-shadow-sm"
              />
              <div>
                <p className="text-[11px] font-semibold tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                  Powered by
                </p>
                <p className="text-lg leading-none font-semibold text-neutral-950 dark:text-white">
                  Corsair
                </p>
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-6xl text-[clamp(4rem,10vw,8.5rem)] leading-[0.95] text-balance"
          >
            <span className="block font-serif font-medium tracking-tight text-[#383838] italic dark:text-neutral-300">
              Command every
            </span>
            <span className="font-serif font-medium tracking-tight text-[#383838] italic dark:text-neutral-300">
              workflow
            </span>{" "}
            <span className="font-extrabold tracking-[-0.05em] text-neutral-950 dark:text-white">
              from one
            </span>
            <span className="block font-extrabold tracking-[-0.05em] text-neutral-950 dark:text-white">
              inbox
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-7 max-w-2xl text-base leading-7 font-medium text-balance text-neutral-600 sm:text-lg dark:text-neutral-300"
          >
            Connect Gmail, Calendar, and AI agents to triage messages, schedule
            meetings, and automate communication without maintaining the
            busywork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <a
              href="https://github.com/Dhirenderchoudhary/ZERO_INBOX"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="lg"
                className="group h-12 rounded-xl border-black/20 bg-white/80 px-6 text-neutral-950 shadow-sm transition-all hover:bg-neutral-950 hover:text-white active:scale-95 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-neutral-950"
              >
                <Star size={16} className="fill-current" /> Star on GitHub
              </Button>
            </a>
            <Button
              size="lg"
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="group h-12 rounded-xl border border-neutral-950 bg-neutral-950 px-6 text-white shadow-xl shadow-neutral-900/15 transition-all hover:bg-white hover:text-neutral-950 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-950 dark:hover:text-white"
            >
              {isSigningIn ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-neutral-950/30 dark:border-t-neutral-950" />
                  Connecting...
                </>
              ) : (
                <>
                  Go to app{" "}
                  <ArrowRight
                    size={16}
                    className="ml-2 transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </Button>
          </motion.div>

          <DashboardShowcase />
        </section>

        <footer className="mt-20 border-t border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:px-6 md:flex-row lg:px-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} Zero Inbox. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <a
                href="/privacy"
                className="transition-colors hover:text-neutral-900 dark:hover:text-white"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="transition-colors hover:text-neutral-900 dark:hover:text-white"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggleTheme = (event: React.MouseEvent) => {
    const newTheme = isDark ? "light" : "dark";
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/50 text-neutral-950 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
      aria-label="Toggle theme"
      title="Toggle theme"
      style={{ perspective: "1000px" }}
    >
      <div className="relative flex items-center justify-center">
        <Moon className="h-[15px] w-[15px] [transform:rotateY(0deg)] transition-all duration-500 dark:[transform:rotateY(180deg)] dark:opacity-0" />
        <Sun className="absolute h-[15px] w-[15px] [transform:rotateY(-180deg)] opacity-0 transition-all duration-500 dark:[transform:rotateY(0deg)] dark:opacity-100" />
      </div>
    </button>
  );
}

function DashboardShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % liveThreads.length);
    }, 2200);

    return () => window.clearInterval(interval);
  }, []);

  const visibleThreads = useMemo(() => {
    const safeIndex = activeIndex % liveThreads.length;
    const activeThread = liveThreads[safeIndex] ?? liveThreads[0]!;

    return [
      activeThread,
      ...liveThreads.filter((_, index) => index !== safeIndex),
    ];
  }, [activeIndex]);

  return (
    <div className="relative mt-16 w-full max-w-6xl text-left">
      <div className="absolute -inset-x-10 bottom-0 h-40 rounded-[100%] bg-black/10 blur-3xl dark:bg-white/10" />
      <div className="absolute -top-8 left-8 hidden rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm font-semibold shadow-2xl backdrop-blur lg:flex dark:border-white/10 dark:bg-neutral-900/90">
        <span className="mr-2 size-2 animate-pulse rounded-full bg-emerald-500" />
        Live AI triage running
      </div>

      <div className="relative overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_40px_140px_rgba(15,15,15,0.18)] transition-colors dark:border-white/10 dark:bg-neutral-900 dark:shadow-[0_40px_140px_rgba(0,0,0,0.55)]">
        <div className="flex h-11 items-center border-b border-black/10 bg-neutral-100/80 px-4 dark:border-white/10 dark:bg-white/5">
          <div className="flex gap-2">
            <span className="size-3 rounded-full bg-[#ff6159]" />
            <span className="size-3 rounded-full bg-[#ffbd2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
          </div>
          <p className="absolute left-1/2 -translate-x-1/2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            ZERO INBOX · Dynamic command center
          </p>
        </div>

        <div className="grid min-h-[560px] bg-white text-neutral-950 transition-colors lg:grid-cols-[240px_minmax(0,1fr)] dark:bg-neutral-950 dark:text-white">
          <aside className="hidden border-r border-black/10 bg-neutral-50 p-5 lg:block dark:border-white/10 dark:bg-white/5">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-2xl bg-neutral-950 text-white dark:bg-white dark:text-neutral-950">
                Z
              </div>
              <div>
                <p className="text-sm font-semibold">ZERO INBOX</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Founder workspace
                </p>
              </div>
            </div>
            <MockNavItem active icon={Inbox} label="Dashboard" badge="12" />
            <MockNavItem icon={MessageSquareText} label="Inbox" badge="6" />
            <MockNavItem icon={CalendarCheck} label="Calendar" />
            <MockNavItem icon={Bot} label="AI Agent" badge="Live" />

            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-black/25">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <ShieldCheck size={14} /> Automation health
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
                <div className="h-full w-[82%] animate-pulse rounded-full bg-neutral-950 dark:bg-white" />
              </div>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                94% accepted · reversible actions
              </p>
            </div>
          </aside>

          <section className="min-w-0 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge
                  variant="outline"
                  className="mb-3 rounded-full bg-neutral-50 dark:bg-white/5"
                >
                  <Sparkles size={13} /> Morning command brief
                </Badge>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Your inbox is moving by itself.
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">
                  Live triage, calendar holds, and reply drafts update as new
                  work arrives — no static screenshot required.
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">
                  <MailPlus size={15} /> Compose
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl bg-white/70 dark:bg-white/5"
                >
                  <Search size={15} /> Search
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-black/10 bg-neutral-50 p-4 dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {metric.label}
                  </p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="overflow-hidden rounded-3xl border border-black/10 bg-neutral-50 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between border-b border-black/10 px-4 py-3 dark:border-white/10">
                  <p className="text-sm font-semibold">Priority stream</p>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Auto-refreshing
                  </span>
                </div>
                <div className="space-y-2 p-3">
                  {visibleThreads.map((thread, index) => {
                    const isActive = index === 0;
                    return (
                      <button
                        key={`${thread.from}-${thread.subject}`}
                        className={`w-full rounded-2xl border p-4 text-left transition-all duration-500 ${isActive ? "-translate-y-0.5 border-neutral-950 bg-white shadow-xl shadow-black/10 dark:border-white dark:bg-neutral-900 dark:shadow-black/40" : "border-black/10 bg-white/60 dark:border-white/10 dark:bg-black/20"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`size-2.5 rounded-full ${thread.tone} ${isActive ? "animate-pulse" : ""}`}
                              />
                              <p className="truncate text-sm font-semibold">
                                {thread.from}
                              </p>
                            </div>
                            <p className="mt-1 truncate text-sm text-neutral-600 dark:text-neutral-300">
                              {thread.subject}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 rounded-full bg-white dark:bg-white/5"
                          >
                            {thread.priority}
                          </Badge>
                        </div>
                        <p className="mt-3 flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                          <CheckCircle2
                            size={13}
                            className="text-emerald-500"
                          />
                          {thread.action}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="rounded-3xl border border-black/10 bg-neutral-950 p-4 text-white shadow-2xl shadow-neutral-950/15 dark:border-white/10 dark:bg-white dark:text-neutral-950">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <Bot size={16} /> Agent execution
                    </p>
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-semibold text-emerald-300 dark:text-emerald-700">
                      Live
                    </span>
                  </div>
                  <div className="space-y-3">
                    {automationSteps.map((step, index) => (
                      <div key={step} className="flex items-center gap-3">
                        <span
                          className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${index <= activeIndex % automationSteps.length ? "bg-emerald-400 text-neutral-950" : "bg-white/10 text-white/50 dark:bg-neutral-950/10 dark:text-neutral-500"}`}
                        >
                          {index + 1}
                        </span>
                        <p className="text-sm opacity-90">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-indigo-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="mb-2 flex items-center gap-2 text-xs text-neutral-400">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                    Connected · Gmail, Calendar, Slack
                  </p>
                  <p className="text-sm leading-6 text-neutral-800 dark:text-neutral-200">
                    Send a calendar invite and email to Garry Tan for Thursday
                    morning. Prep the team too and see who can join.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <Plug size={15} className="text-neutral-300" />
                    <Button
                      size="sm"
                      className="rounded-full bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      Run workflow <ArrowRight size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function MockNavItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-white/10"}`}
    >
      <Icon size={15} />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[11px] dark:bg-white/10">
          {badge}
        </span>
      )}
    </div>
  );
}

function DashedArc({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none fixed h-[420px] w-[900px] rounded-[50%] border-t-4 border-dashed border-indigo-300/70 dark:border-white/15 ${className ?? ""}`}
    />
  );
}
