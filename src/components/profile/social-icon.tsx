import { Facebook, Ghost, Instagram, MessageCircle, type LucideIcon } from "lucide-react";
import type { SocialId } from "@/lib/types";

const ICONS: Record<SocialId, { icon: LucideIcon; color: string; bg: string }> = {
  instagram: { icon: Instagram, color: "#E1306C", bg: "#FDE7EF" },
  whatsapp: { icon: MessageCircle, color: "#1FA855", bg: "#E3F7EA" },
  snapchat: { icon: Ghost, color: "#242A2F", bg: "#FFF7C2" },
  facebook: { icon: Facebook, color: "#1877F2", bg: "#E5EFFE" },
};

export function SocialIcon({ id, size = 40 }: { id: SocialId; size?: number }) {
  const { icon: Icon, color, bg } = ICONS[id];
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, color }}
    >
      <Icon size={size * 0.5} />
    </span>
  );
}
