import { Suspense } from "react";
import { OutingDetails } from "@/components/history/outing-details";

export default function OutingPage({ params }: PageProps<"/history/[id]">) {
  return <Suspense fallback={null}>{params.then(({ id }) => <OutingDetails planId={id} />)}</Suspense>;
}
