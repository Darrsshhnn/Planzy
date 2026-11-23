import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms of Service - Planzy" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="20 November 2026">
      <p>By using Planzy you agree to these terms. If you don&apos;t agree, please don&apos;t use the app.</p>

      <h2>The service</h2>
      <p>
        Planzy lets you discover places, invite friends, vote on where to go and arrange bookings for group outings.
        Place details, prices, opening hours and availability are shown for guidance and may change; check with the
        venue before you go.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details and keep your password safe.</li>
        <li>You are responsible for what happens under your account.</li>
        <li>You can stop using Planzy and clear your data at any time.</li>
      </ul>

      <h2>Acceptable use</h2>
      <ul>
        <li>Be respectful in group and personal chats.</li>
        <li>Don&apos;t post unlawful, abusive or misleading content.</li>
        <li>Don&apos;t try to break, overload or misuse the app.</li>
      </ul>

      <h2>Bookings and payments</h2>
      <p>
        Bookings are made with the venues. In this version of Planzy, payments are simulated and no real money is
        charged. Any real visit, payment or refund is between you and the venue.
      </p>

      <h2>Suggestions</h2>
      <p>
        Recommendations and Planzy Scout suggestions are there to help you decide. They can be wrong, so use your own
        judgement.
      </p>

      <h2>No warranty</h2>
      <p>
        Planzy is provided &quot;as is&quot;. To the extent the law allows, we are not liable for losses arising from
        your use of the app or from outings planned with it.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version.</p>
    </LegalPage>
  );
}
