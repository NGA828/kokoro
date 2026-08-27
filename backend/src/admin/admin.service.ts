import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AccountStatus } from '../users/user.entity';
import { Profile, VerificationStatus } from '../profiles/profile.entity';
import { Match } from '../matches/match.entity';
import { Message } from '../messages/message.entity';
import { Report, ReportStatus } from '../reports/report.entity';
import { Block } from '../blocks/block.entity';
import { Like } from '../likes/like.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { PremiumSubscription, SubscriptionStatus } from '../premium/premium.entities';
import { ProfileView } from '../profiles/profile-view.entity';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Profile) private readonly profiles: Repository<Profile>,
    @InjectRepository(Match) private readonly matches: Repository<Match>,
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(Report) private readonly reports: Repository<Report>,
    @InjectRepository(Block) private readonly blocks: Repository<Block>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Payment) private readonly payments: Repository<Payment>,
    @InjectRepository(PremiumSubscription)
    private readonly subscriptions: Repository<PremiumSubscription>,
    @InjectRepository(ProfileView)
    private readonly views: Repository<ProfileView>,
  ) {}

  private async since(days: number): Promise<Date> {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }

  async stats() {
    const day30 = await this.since(30);
    const day7 = await this.since(7);

    const [
      totalUsers,
      activeUsers,
      newUsers30,
      newUsers7,
      totalMatches,
      matches30,
      totalMessages,
      messages30,
      openReports,
      totalReports,
      premiumUsers,
      verifiedUsers,
      totalLikes,
      revenue,
    ] = await Promise.all([
      this.users.count({ where: { status: AccountStatus.ACTIVE } }),
      this.users
        .createQueryBuilder('u')
        .where('u.last_active_at >= :d', { d: day7 })
        .andWhere('u.status = :s', { s: AccountStatus.ACTIVE })
        .getCount(),
      this.users
        .createQueryBuilder('u')
        .where('u.created_at >= :d', { d: day30 })
        .getCount(),
      this.users
        .createQueryBuilder('u')
        .where('u.created_at >= :d', { d: day7 })
        .getCount(),
      this.matches.count({ where: { unmatched: false } }),
      this.matches
        .createQueryBuilder('m')
        .where('m.created_at >= :d', { d: day30 })
        .getCount(),
      this.messages.count(),
      this.messages
        .createQueryBuilder('m')
        .where('m.created_at >= :d', { d: day30 })
        .getCount(),
      this.reports.count({ where: { status: ReportStatus.OPEN } }),
      this.reports.count(),
      this.subscriptions.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.profiles.count({
        where: { verification: VerificationStatus.VERIFIED },
      }),
      this.likes.count(),
      this.payments
        .createQueryBuilder('p')
        .where('p.status = :s', { s: PaymentStatus.SUCCEEDED })
        .select('COALESCE(SUM(p.amount),0)', 'sum')
        .getRawOne<{ sum: number }>(),
    ]);

    return {
      cards: {
        totalUsers,
        activeUsers,
        newUsers30,
        newUsers7,
        totalMatches,
        matches30,
        totalMessages,
        messages30,
        openReports,
        totalReports,
        premiumUsers,
        verifiedUsers,
        totalLikes,
        totalViews: await this.views.count(),
        totalBlocks: await this.blocks.count(),
        revenue: Number(revenue?.sum ?? 0),
      },
      signupsSeries: await this.dailySeries(
        (d) =>
          this.users
            .createQueryBuilder('u')
            .where('u.created_at >= :d', { d })
            .getCount(),
        30,
      ),
      matchesSeries: await this.dailySeries(
        (d) =>
          this.matches
            .createQueryBuilder('m')
            .where('m.created_at >= :d', { d })
            .getCount(),
        30,
      ),
      messagesSeries: await this.dailySeries(
        (d) =>
          this.messages
            .createQueryBuilder('m')
            .where('m.created_at >= :d', { d })
            .getCount(),
        30,
      ),
      genderSplit: await this.genderSplit(),
    };
  }

  /** Cumulative counts bucketed per day for charts. */
  private async dailySeries(
    counter: (since: Date) => Promise<number>,
    days: number,
  ) {
    const out: { date: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      out.push({
        date: d.toISOString().slice(0, 10),
        value: await counter(d),
      });
    }
    return out;
  }

  private async genderSplit() {
    const rows = await this.profiles
      .createQueryBuilder('p')
      .select('p.gender', 'gender')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.gender')
      .getRawMany<{ gender: string; count: string }>();
    return rows.map((r) => ({ name: r.gender, value: Number(r.count) }));
  }

  async listUsers(page = 1, pageSize = 20, search?: string) {
    const qb = this.users
      .createQueryBuilder('u')
      .orderBy('u.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);
    if (search) {
      qb.where('u.email LIKE :q OR u.name LIKE :q', { q: `%${search}%` });
    }
    const [rows, total] = await qb.getManyAndCount();
    const profiles = await this.profiles.find({
      where: rows.map((u) => ({ userId: u.id })),
    });
    const subs = await this.subscriptions.find({
      where: rows.map((u) => ({ userId: u.id })),
    });
    const items = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      isEmailVerified: u.isEmailVerified,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
      verification:
        profiles.find((p) => p.userId === u.id)?.verification ?? 'none',
      isPremium: subs.some(
        (s) => s.userId === u.id && s.status === SubscriptionStatus.ACTIVE,
      ),
    }));
    return { items, total, page, pageSize };
  }

  async setUserStatus(userId: string, status: AccountStatus) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    user.status = status;
    await this.users.save(user);
    return { success: true };
  }

  async setVerification(
    userId: string,
    status: VerificationStatus,
  ) {
    const profile = await this.profiles.findOne({ where: { userId } });
    if (!profile) throw new NotFoundException('Profile not found.');
    profile.verification = status;
    await this.profiles.save(profile);
    return { success: true };
  }

  pendingVerifications() {
    return this.profiles.find({
      where: { verification: VerificationStatus.PENDING },
      order: { verificationRequestedAt: 'ASC' },
    });
  }

  listReports(status?: ReportStatus) {
    return this.reports.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async resolveReport(
    reportId: string,
    status: ReportStatus,
    adminId: string,
  ) {
    await this.reports.update(
      { id: reportId },
      { status, resolvedBy: adminId, resolvedAt: new Date() },
    );
    return { success: true };
  }

  listPayments() {
    return this.payments.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  listSubscriptions() {
    return this.subscriptions.find({
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }
}
