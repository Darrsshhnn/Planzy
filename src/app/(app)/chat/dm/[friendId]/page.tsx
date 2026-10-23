import { Suspense } from "react";
import { DirectChat } from "@/components/chat/direct-chat";

export default function DirectChatPage({ params }: PageProps<"/chat/dm/[friendId]">) {
  return <Suspense fallback={null}>{params.then(({ friendId }) => <DirectChat friendId={friendId} />)}</Suspense>;
}
