import { MapPinOff } from "lucide-react";
import { Screen } from "@/components/layout/screen";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFound() {
  return (
    <Screen>
      <EmptyState
        icon={MapPinOff}
        title="Page not found"
        body="This place or page doesn't exist on Planzy."
        action={
          <ButtonLink href="/" block>
            Back to Home
          </ButtonLink>
        }
      />
    </Screen>
  );
}
