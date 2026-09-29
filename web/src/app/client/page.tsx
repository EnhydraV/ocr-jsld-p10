import { ChatWindow } from '@/components/ChatWindow';
import { CHAT_URL } from '@/lib/config';
import { CONVERSATION_ID } from '@/lib/demo';

export default function PageClient() {
  return (
    <ChatWindow
      title="Service client"
      url={CHAT_URL}
      conversationId={CONVERSATION_ID}
      authorType="customer"
      authorId="charlie"
      avatar="brand"
    />
  );
}
