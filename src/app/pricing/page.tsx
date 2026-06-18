export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 text-center">
      <h1 className="mb-6 text-5xl font-bold tracking-tight">Pricing</h1>
      <p className="text-muted-foreground mb-16 text-xl">
        Simple, transparent pricing for teams of all sizes.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="rounded-3xl border border-black/10 bg-white p-8 text-left shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-2xl font-bold">Free</h2>
          <p className="text-muted-foreground mt-2">Perfect to get started.</p>
          <p className="my-6 text-5xl font-bold">$0</p>
          <ul className="space-y-3 text-sm">
            <li>✓ 1,000 AI Triage Actions</li>
            <li>✓ Basic Calendar Sync</li>
            <li>✓ Community Support</li>
          </ul>
          <button className="mt-8 w-full rounded-full bg-neutral-100 py-3 font-semibold transition-colors hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20">
            Get Started
          </button>
        </div>

        <div className="relative rounded-3xl border-2 border-indigo-500 bg-white p-8 text-left shadow-xl dark:bg-neutral-900">
          <span className="absolute -top-3 right-8 rounded-full bg-indigo-500 px-3 py-1 text-xs font-bold text-white">
            Most Popular
          </span>
          <h2 className="text-2xl font-bold">Pro</h2>
          <p className="text-muted-foreground mt-2">
            For power users and founders.
          </p>
          <p className="my-6 text-5xl font-bold">
            $20
            <span className="text-muted-foreground text-lg font-normal">
              /mo
            </span>
          </p>
          <ul className="space-y-3 text-sm">
            <li>✓ Unlimited AI Actions</li>
            <li>✓ Realtime Webhooks</li>
            <li>✓ Keyboard Shortcuts</li>
            <li>✓ Priority Support</li>
          </ul>
          <button className="mt-8 w-full rounded-full bg-indigo-500 py-3 font-semibold text-white transition-colors hover:bg-indigo-600">
            Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}
