import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ChatService, type ConversationWithMessages } from './chat.service';
import { historyQuerySchema, sendMessageSchema, type HistoryQuery, type SendMessageInput } from './chat.schemas';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import type { Message } from '../generated/prisma/client';

@Controller('conversations')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get(':id/messages')
  history(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(historyQuerySchema)) query: HistoryQuery,
  ): Promise<ConversationWithMessages> {
    return this.chat.history(id, query.afterSeq);
  }

  @Post(':id/messages')
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) input: SendMessageInput,
  ): Promise<Message> {
    return this.chat.send(id, input);
  }
}
