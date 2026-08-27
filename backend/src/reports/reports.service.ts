import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './report.entity';
import { CreateReportDto } from './reports.dto';
import { BlocksService } from '../blocks/blocks.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly repo: Repository<Report>,
    private readonly blocks: BlocksService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    if (reporterId === dto.reportedUserId) {
      throw new BadRequestException('You cannot report yourself.');
    }
    // One open report per reporter/target pair.
    const existing = await this.repo.findOne({
      where: {
        reporterId,
        reportedId: dto.reportedUserId,
        status: ReportStatus.OPEN,
      },
    });
    if (existing) {
      return { success: true, alreadyReported: true };
    }
    const report = this.repo.create({
      reporterId,
      reportedId: dto.reportedUserId,
      reason: dto.reason as never,
      details: dto.details ?? null,
    });
    await this.repo.save(report);

    // Reporting automatically blocks the reported user for the reporter.
    await this.blocks.block(reporterId, dto.reportedUserId);

    // Notify admins (a lightweight system notification channel).
    await this.notifications.create({
      userId: reporterId, // in-app acknowledgement for the reporter
      type: NotificationType.SYSTEM,
      title: 'Report received',
      body: 'Thank you for helping keep Kokoro March safe. Our team will review this profile.',
    });

    return { success: true, reportId: report.id };
  }

  list(status?: ReportStatus) {
    return this.repo.find({
      where: status ? { status } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async setStatus(id: string, status: ReportStatus, adminId: string) {
    await this.repo.update(
      { id },
      { status, resolvedBy: adminId, resolvedAt: new Date() },
    );
    return { success: true };
  }
}
