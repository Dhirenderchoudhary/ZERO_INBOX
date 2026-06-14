"use client";
import Link from "next/link";
import { Zap, Sparkles, Mail, Calendar, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signIn } from "@/lib/auth-client";

export default function LandingPage() {
  const handleSignIn = () => {
    signIn.social({ provider: "google", callbackURL: "/inbox" });
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--bg-0)] font-sans text-[var(--text-0)]">
      {/* Grid Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="bg-grid-pattern absolute inset-0 opacity-40 dark:opacity-40" />
        <div className="absolute top-0 left-1/2 h-[500px] w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,var(--accent)_0%,transparent_70%)] opacity-10 dark:opacity-20" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 flex h-24 items-center justify-between border-b border-[var(--border-0)] px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--text-0)] shadow-sm">
            <Zap size={18} className="text-[var(--bg-0)]" strokeWidth={2.5} />
          </div>
          <span className="text-[17px] font-semibold tracking-tight text-[var(--text-0)]">
            ZERO_INBOX
          </span>
        </div>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <button
            onClick={handleSignIn}
            className="text-[14px] font-medium text-[var(--text-1)] transition-colors hover:text-[var(--text-0)]"
          >
            Sign in
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pt-32 pb-40">
        {/* Badge */}
        <div className="mb-10 flex cursor-pointer items-center gap-2 rounded-full border border-[var(--border-1)] bg-[var(--bg-1)] px-4 py-2 shadow-sm transition-colors hover:border-[var(--border-2)]">
          <Sparkles size={14} className="text-[var(--text-2)]" />
          <span className="text-[12px] font-semibold tracking-wide text-[var(--text-1)] uppercase">
            Enterprise-grade communication platform
          </span>
        </div>

        {/* Hero Heading */}
        <h1 className="mb-10 max-w-5xl text-center text-[84px] leading-[1.02] font-bold tracking-tight">
          <span className="block text-[var(--text-0)]">Command your</span>
          <span className="text-gradient block">inbox with AI</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-16 max-w-[680px] text-center text-[20px] leading-relaxed text-[var(--text-2)]">
          ZERO_INBOX seamlessly integrates with Gmail and Google Calendar to
          securely automate your communications, scheduling, and triage—saving
          you hours every week.
        </p>

        {/* CTA Buttons */}
        <div className="mb-8 flex flex-col items-center gap-6 sm:flex-row">
          <button
            onClick={handleSignIn}
            className="flex items-center justify-center gap-3 rounded-xl bg-[var(--text-0)] px-8 py-4 text-[16px] font-semibold text-[var(--bg-0)] shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] dark:shadow-[0_0_32px_rgba(255,255,255,0.1)]"
          >
            {/* Google G Logo SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Get started with Google
          </button>
          <button
            onClick={handleSignIn}
            className="flex items-center justify-center gap-3 rounded-xl border border-[var(--border-2)] bg-[var(--bg-1)] px-8 py-4 text-[16px] font-medium text-[var(--text-0)] transition-all hover:border-[var(--border-3)] hover:bg-[var(--bg-2)]"
          >
            See how it works
            <ArrowRight size={18} className="text-[var(--text-2)]" />
          </button>
        </div>
        <p className="text-[13px] text-[var(--text-2)]">
          Free to start · No credit card required
        </p>

        {/* Feature Cards Grid */}
        <div className="mt-40 grid w-full max-w-6xl grid-cols-1 gap-8 px-4 md:grid-cols-3">
          <FeatureCard
            icon={<Mail size={22} />}
            title="Intelligent Triage"
            description="AI-driven categorization automatically surfaces critical emails while archiving the noise. Maintain Inbox Zero effortlessly."
          />
          <FeatureCard
            icon={<Calendar size={22} />}
            title="Automated Scheduling"
            description="Coordinate meetings, optimize your availability, and generate calendar invites seamlessly through natural language commands."
          />
          <FeatureCard
            icon={<Zap size={22} />}
            title="Accelerated Actions"
            description="Draft responses, delegate tasks, and manage threads instantly with powerful keyboard shortcuts and context-aware AI."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 flex items-center justify-between border-t border-[var(--border-0)] px-8 py-8 text-[14px] text-[var(--text-2)] lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-2)] bg-[var(--bg-1)]">
            <span className="text-[10px] font-bold text-[var(--text-0)]">
              Z
            </span>
          </div>
          <span>© 2026 ZERO_INBOX</span>
        </div>
        <span>End-to-end encrypted</span>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-[24px] border border-[var(--border-1)] bg-[var(--bg-1)] p-8 text-left shadow-sm transition-colors hover:border-[var(--border-3)] hover:shadow-md">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-2)] bg-[var(--bg-2)] text-[var(--text-1)] shadow-sm transition-all group-hover:border-[var(--border-3)] group-hover:text-[var(--text-0)]">
        {icon}
      </div>
      <h3 className="mb-3 text-[18px] font-semibold text-[var(--text-0)]">
        {title}
      </h3>
      <p className="text-[15px] leading-relaxed text-[var(--text-2)]">
        {description}
      </p>
    </div>
  );
}
