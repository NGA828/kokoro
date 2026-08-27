import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, AccountStatus, UserRole } from '../users/user.entity';
import { UserSettings } from '../users/user-settings.entity';
import { Profile, Gender } from '../profiles/profile.entity';
import { Preference } from '../preferences/preference.entity';
import { ageFromDob, maxDobForAge18 } from '../common/utils';
import {
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './auth.dto';

interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(UserSettings)
    private readonly settings: Repository<UserSettings>,
    @InjectRepository(Profile)
    private readonly profiles: Repository<Profile>,
    @InjectRepository(Preference)
    private readonly preferences: Repository<Preference>,
    private readonly jwt: JwtService,
  ) {}

  private signTokens(user: User): Tokens {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET || 'kokoro-dev-secret',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'kokoro-dev-refresh-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const dob = new Date(dto.dob);
    if (isNaN(dob.getTime())) {
      throw new BadRequestException('Please provide a valid date of birth.');
    }
    if (ageFromDob(dob) < 18) {
      throw new BadRequestException(
        'Kokoro March is an 18+ platform. You must be at least 18 years old.',
      );
    }
    if (dob > new Date() || dob < new Date('1900-01-01')) {
      throw new BadRequestException('Please provide a valid date of birth.');
    }

    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const verifyToken = crypto.randomBytes(24).toString('hex');

    const user = this.users.create({
      email,
      passwordHash,
      name: dto.name.trim(),
      role: UserRole.USER,
      isEmailVerified: false,
      emailVerifyToken: verifyToken,
      status: AccountStatus.ACTIVE,
      lastActiveAt: new Date(),
    });
    const saved = await this.users.save(user);

    // Bootstrap profile, preferences and settings so the whole app works.
    const profile = this.profiles.create({
      userId: saved.id,
      name: saved.name,
      dob,
      gender: dto.gender as Gender,
      city: dto.city?.trim() || null,
      country: dto.country?.trim() || null,
    });
    await this.profiles.save(profile);
    await this.preferences.save(this.preferences.create({ userId: saved.id }));
    await this.settings.save(this.settings.create({ userId: saved.id }));

    const tokens = this.signTokens(saved);
    await this.storeRefreshToken(saved.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.publicUser(saved),
      onboardingCompleted: false,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password.');
    }
    if (user.status === AccountStatus.DELETED) {
      throw new UnauthorizedException('This account no longer exists.');
    }
    if (user.status === AccountStatus.DEACTIVATED) {
      // Allow reactivation on login.
      user.status = AccountStatus.ACTIVE;
    }
    user.lastActiveAt = new Date();
    await this.users.save(user);

    const tokens = this.signTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const profile = await this.profiles.findOne({ where: { userId: user.id } });
    return {
      ...tokens,
      user: this.publicUser(user),
      onboardingCompleted: !!profile?.onboardingCompleted,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing.');
    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'kokoro-dev-refresh-secret',
      });
    } catch {
      throw new UnauthorizedException('Session expired. Please log in again.');
    }
    const user = await this.users.findOne({ where: { id: payload.sub } });
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Please log in again.');
    }
    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid session. Please log in again.');
    }
    const tokens = this.signTokens(user);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.users.update({ id: userId }, { refreshTokenHash: null });
    return { success: true };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const hash = await bcrypt.hash(token, 10);
    await this.users.update({ id: userId }, { refreshTokenHash: hash });
  }

  async verifyEmail(token: string) {
    const user = await this.users.findOne({
      where: { emailVerifyToken: token },
    });
    if (!user) throw new BadRequestException('Invalid or expired token.');
    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    await this.users.save(user);
    return { success: true };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    // Always return success to avoid account enumeration.
    if (user && user.status === AccountStatus.ACTIVE) {
      const token = crypto.randomBytes(24).toString('hex');
      user.resetTokenHash = await bcrypt.hash(token, 10);
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await this.users.save(user);
      // In production an email with the reset link is sent here.
      return {
        success: true,
        // Dev-only helper so the flow is testable without an email service.
        devToken:
          process.env.NODE_ENV === 'production' ? undefined : token,
      };
    }
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // Tokens are bcrypt-hashed, so candidates are compared in memory.
    const candidates = await this.users
      .createQueryBuilder('u')
      .where('u.reset_token_hash IS NOT NULL')
      .getMany();
    let target: User | null = null;
    for (const u of candidates) {
      if (
        u.resetTokenExpires &&
        u.resetTokenExpires.getTime() > Date.now() &&
        (await bcrypt.compare(dto.token, u.resetTokenHash!))
      ) {
        target = u;
        break;
      }
    }
    if (!target) throw new BadRequestException('Invalid or expired reset token.');
    target.passwordHash = await bcrypt.hash(dto.password, 10);
    target.resetTokenHash = null;
    target.resetTokenExpires = null;
    target.refreshTokenHash = null;
    await this.users.save(target);
    return { success: true };
  }

  private publicUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
