import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy Policy - Planzy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="20 November 2026">
      <p>
        Planzy helps friends plan group outings in Ahmedabad and Gandhinagar. This page explains what information the
        app uses and why.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Sign in with Google:</strong> your name, email address and profile picture, shared by Google when you
          choose to sign in. We never see your Google password.
        </li>
        <li>
          <strong>Sign up with phone or email:</strong> your name, mobile number, email address and password (stored
          only as a one-way hash).
        </li>
        <li>
          <strong>Your preferences:</strong> the area you head out from, the kinds of places you like, budget, distance
          and timing.
        </li>
        <li>
          <strong>Your plans:</strong> groups, votes, chat messages and bookings you make in the app.
        </li>
        <li>
          <strong>Location (optional):</strong> only when you tap &quot;Use my current location&quot; or share your
          location in a chat. It is not tracked in the background.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and show your profile to friends in your groups.</li>
        <li>To suggest places that match your interests, budget and distance.</li>
        <li>To run your plans: invites, voting, decisions and bookings.</li>
      </ul>
      <p>We do not sell your information or use it for advertising.</p>

      <h2>Where it is stored</h2>
      <p>
        In this version of Planzy, your account, plans and chats are saved in your own browser on your device. When
        you ask Planzy AI for suggestions, your chosen area, budget, distance and categories are sent to our server to
        pick places; they are not stored.
      </p>

      <h2>Third-party services</h2>
      <ul>
        <li>Google Identity Services, for Sign in with Google.</li>
        <li>OpenStreetMap, for maps and area search.</li>
        <li>Anthropic (Claude), when Planzy AI suggestions are switched on.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>Edit your profile and preferences any time in Profile.</li>
        <li>Log out from Profile → Settings.</li>
        <li>Delete all Planzy data by clearing this site&apos;s data in your browser settings.</li>
        <li>
          Remove Planzy&apos;s access to your Google account at{" "}
          <a href="https://myaccount.google.com/permissions" className="text-navy underline underline-offset-2">
            myaccount.google.com/permissions
          </a>
          .
        </li>
      </ul>

      <h2>Children</h2>
      <p>Planzy is not meant for children under 13.</p>

      <h2>Changes</h2>
      <p>If this policy changes, the date at the top will change too.</p>
    </LegalPage>
  );
}
