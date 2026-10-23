import { Suspense } from "react";
import { GroupChat } from "@/components/chat/group-chat";

export default function GroupChatPage({ params }: PageProps<"/chat/[id]">) {
  return <Suspense fallback={null}>{params.then(({ id }) => <GroupChat planId={id} />)}</Suspense>;
}
