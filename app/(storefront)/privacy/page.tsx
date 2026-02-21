import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Kaira Enterprises collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "February 2026";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Store
        </Link>
      </div>

      <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
      <p className="mb-8 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>

      <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed text-foreground">
        <section>
          <h2 className="mb-3 text-xl font-semibold">1. Who We Are</h2>
          <p>
            This privacy policy applies to <strong>Kaira Enterprises</strong>, a toy
            retail store. When you use our website or interact with us via WhatsApp,
            we may collect certain personal information to provide you with our services.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">2. What Data We Collect</h2>
          <p>When you create an account or place an order, we may collect:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Full Name</strong> — to address you
              personally and process your orders.
            </li>
            <li>
              <strong className="text-foreground">WhatsApp Phone Number</strong> — to
              verify your identity via OTP and communicate order updates.
            </li>
            <li>
              <strong className="text-foreground">Delivery Address</strong> — to
              arrange delivery of your orders.
            </li>
            <li>
              <strong className="text-foreground">Order History</strong> — products
              you browsed or ordered, for customer support and analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">3. How We Use Your Data</h2>
          <p>We use your data only for the following purposes:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Processing and fulfilling your orders</li>
            <li>Sending order confirmations and updates via WhatsApp</li>
            <li>Responding to customer support enquiries</li>
            <li>Improving our product catalog and store experience (anonymised analytics)</li>
          </ul>
          <p className="mt-3 font-medium text-green-700">
            We do NOT use your data for unsolicited marketing, and we do NOT sell or
            share your personal information with third parties for their own commercial
            purposes.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">4. WhatsApp Communication</h2>
          <p>
            When you order via WhatsApp, your message is sent directly to our WhatsApp
            Business number. WhatsApp&apos;s own{" "}
            <a
              href="https://www.whatsapp.com/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Privacy Policy
            </a>{" "}
            governs how WhatsApp handles your messages. We only use this channel to
            process your orders and communicate with you.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">5. Data Storage &amp; Security</h2>
          <p>
            Your data is stored securely using Supabase, a cloud database provider
            with industry-standard encryption at rest and in transit. We take
            reasonable measures to protect your information from unauthorised access.
          </p>
          <p className="mt-2">
            OTP codes used for phone verification are temporary and automatically
            deleted after use or expiry (10 minutes).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">6. Data Retention</h2>
          <p>
            We retain your personal data for as long as necessary to provide our
            services and comply with legal obligations. If you request deletion of
            your account, we will remove your personal information within 30 days.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Request access to the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data (&quot;right to be forgotten&quot;)</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, please contact us via WhatsApp or email.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">8. Cookies</h2>
          <p>
            Our website uses minimal browser storage (localStorage) only to remember
            whether you have completed account registration, so we don&apos;t show the
            sign-up prompt repeatedly. We do not use advertising or tracking cookies.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">9. Changes to This Policy</h2>
          <p>
            We may update this policy from time to time. The date at the top of this
            page indicates when it was last revised. Continued use of our website
            after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-semibold">10. Contact Us</h2>
          <p>
            If you have questions about this privacy policy or how we handle your
            data, please reach out to us via WhatsApp at the number listed on our
            store, or visit our{" "}
            <Link href="/" className="underline hover:text-foreground">
              homepage
            </Link>{" "}
            to find contact details.
          </p>
        </section>
      </div>
    </div>
  );
}
