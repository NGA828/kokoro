import { Body, Controller, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './reports.dto';
import { CurrentUser, AuthUser } from '../common/decorators';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  create(@CurrentUser() auth: AuthUser, @Body() dto: CreateReportDto) {
    return this.reports.create(auth.id, dto);
  }
}
