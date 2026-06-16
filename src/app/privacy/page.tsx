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

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            4. Google API Services Usage Disclosure
          </h2>
          <p>
            Zero Inbox's use and transfer to any other app of information
            received from Google APIs will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              className="text-indigo-600 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p className="mt-2">
            Specifically, when you grant Zero Inbox access to your Gmail or
            Google Calendar:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              We only use the data to provide or improve user-facing features
              (like AI email triage and smart calendar scheduling).
            </li>
            <li>We do not use your data for serving advertisements.</li>
            <li>
              We do not allow humans to read your data unless we have your
              affirmative agreement for specific messages, doing so is necessary
              for security purposes such as investigating abuse, to comply with
              applicable law, or for the app's internal operations and even then
              only when the data have been aggregated and anonymized.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
