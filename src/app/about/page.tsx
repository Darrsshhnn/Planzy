import { CalendarCheck, MapPin, UsersRound, Vote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AiIcon } from "@/components/brand/ai-icon";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Planzy - Plan group outings with friends in Ahmedabad",
  description:
    "Planzy is a group outing planner for Ahmedabad and Gandhinagar. Invite friends, get place suggestions, vote together and book in one app.",
};

const STEPS = [
  { icon: UsersRound, title: "Invite your friends", body: "Start a plan and add friends. Each one gets an invite to join the group." },
  { icon: MapPin, title: "Get place suggestions", body: "Planzy suggests cafés, turfs, arcades, museums and more that fit the group's budget, distance and timing." },
  { icon: Vote, title: "Vote together", body: "Everyone votes In, Maybe or Can't in the group chat, so the group decides fairly." },
  { icon: CalendarCheck, title: "Book and go", body: "The organiser locks in the winning place and books a slot. Everyone sees the final plan." },
];

/**
 * Public home page for Planzy: what the app is and what it does. Readable
 * without signing in (also what Google checks for the sign-in branding).
 */
export default function AboutPage() {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-white">
      <main className="px-6 pb-16 pt-10">
        <header className="flex flex-col items-center text-center">
          <Logo width={180} />
          <h1 className="mt-6 font-heading text-[28px] font-bold leading-tight text-ink">
            Planzy: plan group outings with friends
          </h1>
          <p className="mt-3 text-[15px] leading-[23px] text-ink/75">
            Planzy is a group outing planner for Ahmedabad and Gandhinagar. Invite friends, find places everyone will
            enjoy, vote together and book, all in one app.
          </p>
          <Link
            href="/auth"
            className="mt-7 flex h-[52px] w-full items-center justify-center rounded-[14px] bg-brand text-[17px] font-semibold text-white shadow-[0_3px_0_#c95e12]"
          >
            Open Planzy
          </Link>
        </header>

        <section className="mt-12">
          <h2 className="font-heading text-[20px] font-bold text-ink">How Planzy works</h2>
          <ol className="mt-5 space-y-5">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="card flex gap-4 p-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-brand">
                  <Icon size={22} />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-ink">
                    {i + 1}. {title}
                  </span>
                  <span className="mt-1 block text-[13px] leading-[20px] text-ink/70">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="card-dark mt-10 flex gap-4 p-5 text-white">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-brand">
            <AiIcon size={24} />
          </span>
          <span>
            <span className="block font-heading text-[17px] font-bold">Planzy Scout</span>
            <span className="mt-1 block text-[13px] leading-[20px] text-white/75">
              Tell Planzy where you&apos;re starting from, your budget and how far you&apos;ll go, and it picks places
              for your group, closest first.
            </span>
          </span>
        </section>

        <section className="mt-10">
          <h2 className="font-heading text-[20px] font-bold text-ink">Signing in</h2>
          <p className="mt-3 text-[14px] leading-[22px] text-ink/75">
            You can sign up to Planzy with your phone number and email, or with Google. With Google, Planzy receives
            only your name, email address and profile picture, to create your Planzy profile. Read more in our{" "}
            <Link href="/privacy" className="text-navy underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <footer className="mt-12 flex justify-center gap-5 text-[13px] text-ink/60">
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
          </Link>
        </footer>
      </main>
    </div>
  );
}
