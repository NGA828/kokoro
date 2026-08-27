import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { UserSettings } from '../users/user-settings.entity';
import { Profile } from '../profiles/profile.entity';
import { Preference } from '../preferences/preference.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'kokoro-dev-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '2h' },
    }),
    TypeOrmModule.forFeature([User, UserSettings, Profile, Preference]),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
