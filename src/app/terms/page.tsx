export default function TermsOfService() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-4xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and using Zero Inbox, you accept and agree to be bound
            by the terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. Service Description
          </h2>
          <p>
            Zero Inbox is an AI-powered email triage and calendar management
            tool. It requires OAuth access to your Google account to function.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            3. Subscriptions & Billing
          </h2>
          <p>
            Some features require a paid subscription. Payments are processed
            securely via our payment provider. You can cancel your subscription
            at any time.
          </p>
        </section>
      </div>
    </div>
  );
}
