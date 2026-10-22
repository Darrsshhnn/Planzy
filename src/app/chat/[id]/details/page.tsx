import { Suspense } from "react";
import { GroupDetails } from "@/components/chat/group-details";

export default function GroupDetailsPage({ params }: PageProps<"/chat/[id]/details">) {
  return <Suspense fallback={null}>{params.then(({ id }) => <GroupDetails planId={id} />)}</Suspense>;
}
