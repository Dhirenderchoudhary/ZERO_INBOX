export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-4">
        Last updated: {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Information We Collect
          </h2>
          <p>
            We collect information you provide directly to us when using Zero
            Inbox, including your Google account metadata, email contents (which
            are securely processed via AI), and usage data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. How We Use Your Information
          </h2>
          <p>
            We use your information exclusively to provide the Zero Inbox
            service: triaging emails, summarizing threads, drafting replies, and
            managing your calendar. We do not sell your data.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">3. Data Security</h2>
          <p>
            Your data is encrypted at rest and in transit. Our database uses
            row-level security to ensure your data is isolated from other users.
          </p>
        </section>
      </div>
    </div>
  );
}
