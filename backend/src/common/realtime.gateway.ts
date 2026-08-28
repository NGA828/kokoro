import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

/**
 * Single realtime hub for Kokoro March.
 * Authenticated sockets join a room named `user:<id>` so any service can push
 * events to a specific user (messages, typing, notifications, presence,
 * match events). A match/notification therefore reaches the other user even
 * when they are on a different device or network.
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : '*',
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  /** userId -> set of connected socket ids (multi-device support). */
  private presence = new Map<string, Set<string>>();

  constructor(private readonly jwt: JwtService) {}

  handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers.authorization || '').replace('Bearer ', '');
    if (!token) {
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_SECRET || 'kokoro-dev-secret',
      });
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
      if (!this.presence.has(payload.sub)) {
        this.presence.set(payload.sub, new Set());
      }
      this.presence.get(payload.sub)!.add(client.id);
      this.setPresence(payload.sub, true);
    } catch {
      client.emit('error', { message: 'unauthorized' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.presence.get(userId)?.delete(client.id);
      if (!this.presence.get(userId)?.size) {
        this.presence.delete(userId);
        this.setPresence(userId, false);
      }
    }
  }

  isOnline(userId: string): boolean {
    return this.presence.has(userId);
  }

  private setPresence(userId: string, online: boolean) {
    // Presence broadcast is handled by conversations module tracking matches;
    // we simply notify a global channel the user is in with themselves.
    this.server.to(`user:${userId}`).emit('presence', {
      userId,
      online,
      lastActiveAt: new Date().toISOString(),
    });
  }

  /** Send an event to a specific user across all their devices. */
  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // ── Chat room signalling (conversation room membership is managed by the
  //    messages module after authorization; these helpers relay typing/read) ──

  @SubscribeMessage('conversation:join')
  onJoinConversation(client: Socket, conversationId: string) {
    if (client.data.userId) client.join(`conv:${conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  onLeaveConversation(client: Socket, conversationId: string) {
    client.leave(`conv:${conversationId}`);
  }

  @SubscribeMessage('typing')
  onTyping(
    client: Socket,
    payload: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId as string | undefined;
    if (!userId || !payload?.conversationId) return;
    client
      .to(`conv:${payload.conversationId}`)
      .emit('typing', { conversationId: payload.conversationId, userId, isTyping: payload.isTyping });
  }

  /** Emit to everyone in a conversation room (the sender already has state). */
  emitToConversation(conversationId: string, event: string, data: unknown) {
    this.server.to(`conv:${conversationId}`).emit(event, data);
  }
}
