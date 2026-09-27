import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatRepository } from './chat.repository';
import { ChatGateway } from './chat.gateway';
import { ChatSubscribers } from './chat.subscribers';

@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, ChatGateway, ChatSubscribers],
  exports: [ChatService],
})
export class ChatModule {}
