import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeGateway } from './realtime.gateway';

/** Shared singleton Socket.IO gateway, imported wherever realtime push is needed. */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kokoro-dev-secret',
    }),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}
