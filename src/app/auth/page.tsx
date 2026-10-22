import { MessagesSquare, Users, Vote } from "lucide-react";
import { Screen } from "@/components/layout/screen";
import { ButtonLink } from "@/components/ui/button";

const POINTS = [
  { icon: Users, text: "Make a group and invite friends" },
  { icon: Vote, text: "Vote on places that fit everyone's budget" },
  { icon: MessagesSquare, text: "Chat, decide and book in one place" },
];

export default function WelcomePage() {
  return (
    <Screen padded={false} className="!pb-0">
      <div className="relative flex min-h-full flex-col overflow-hidden bg-ink px-6 pb-10 pt-16 text-white">
        <span className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-brand/30" aria-hidden />
        <span className="absolute -left-20 top-72 h-48 w-48 rounded-full bg-navy/70" aria-hidden />
        <h1 className="relative font-heading text-[44px] font-bold text-brand">Planzy</h1>
        <p className="relative mt-2 max-w-[280px] text-[16px] leading-[24px] text-white/85">
          Plan outings in Ahmedabad with your friends, without the endless group-chat debate.
        </p>
        <ul className="relative mt-10 space-y-4">
          {POINTS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-[14px]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream text-brand">
                <Icon size={20} />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <div className="relative mt-auto space-y-3 pt-12">
          <ButtonLink href="/auth/signup" variant="brand" block>
            Create an account
          </ButtonLink>
          <ButtonLink href="/auth/login" variant="outline" block>
            Log in
          </ButtonLink>
        </div>
      </div>
    </Screen>
  );
}
