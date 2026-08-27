import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { existsSync } from 'fs';

import { buildTypeOrmOptions } from './config/data-source';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/roles.guard';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfilesModule } from './profiles/profiles.module';
import { PreferencesModule } from './preferences/preferences.module';
import { InterestsModule } from './interests/interests.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { DiscoveryModule } from './discovery/discovery.module';
import { LikesModule } from './likes/likes.module';
import { MatchesModule } from './matches/matches.module';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BlocksModule } from './blocks/blocks.module';
import { ReportsModule } from './reports/reports.module';
import { MediaModule } from './media/media.module';
import { PremiumModule } from './premium/premium.module';
import { AdminModule } from './admin/admin.module';
import { RealtimeModule } from './common/realtime.module';

const staticImports = existsSync(join(process.cwd(), 'uploads'))
  ? [
      ServeStaticModule.forRoot({
        rootPath: join(process.cwd(), 'uploads'),
        serveRoot: '/media',
      }),
    ]
  : [];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60_000, limit: 120 }, // global API rate limit
    ]),
    TypeOrmModule.forRoot(buildTypeOrmOptions()),
    RealtimeModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    PreferencesModule,
    InterestsModule,
    RecommendationsModule,
    DiscoveryModule,
    LikesModule,
    MatchesModule,
    ConversationsModule,
    MessagesModule,
    NotificationsModule,
    BlocksModule,
    ReportsModule,
    MediaModule,
    PremiumModule,
    AdminModule,
    ...staticImports,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
