import { AppGate } from "@/components/layout/gates";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppGate>{children}</AppGate>;
}
