import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, ChatModule],
  controllers: [HealthController],
})
export class AppModule {}
