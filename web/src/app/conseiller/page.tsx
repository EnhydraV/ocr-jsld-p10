import { ChatWindow } from '@/components/ChatWindow';
import { CHAT_URL } from '@/lib/config';
import { CONVERSATION_ID } from '@/lib/demo';

export default function PageConseiller() {
  return (
    <ChatWindow
      title="Charlie"
      url={CHAT_URL}
      conversationId={CONVERSATION_ID}
      authorType="advisor"
      authorId="victor"
      avatar="person"
    />
  );
}
