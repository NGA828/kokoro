import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AdminService } from './admin.service';
import { AuthUser, CurrentUser, Roles } from '../common/decorators';

class SetUserStatusDto {
  @IsIn(['active', 'deactivated', 'deleted'])
  status: string;
}

class SetVerificationDto {
  @IsIn(['verified', 'rejected', 'none', 'pending'])
  status: string;
}

class ResolveReportDto {
  @IsIn(['resolved', 'dismissed', 'reviewing', 'open'])
  status: string;
}

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    return this.admin.listUsers(page ? parseInt(page, 10) : 1, 20, search);
  }

  @Post('users/:id/status')
  setUserStatus(@Param('id') id: string, @Body() dto: SetUserStatusDto) {
    return this.admin.setUserStatus(id, dto.status as never);
  }

  @Post('users/:id/verification')
  setVerification(@Param('id') id: string, @Body() dto: SetVerificationDto) {
    return this.admin.setVerification(id, dto.status as never);
  }

  @Get('verifications')
  verifications() {
    return this.admin.pendingVerifications();
  }

  @Get('reports')
  reports(@Query('status') status?: string) {
    return this.admin.listReports(status as never);
  }

  @Post('reports/:id/resolve')
  resolveReport(
    @CurrentUser() auth: AuthUser,
    @Param('id') id: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.admin.resolveReport(id, dto.status as never, auth.id);
  }

  @Get('payments')
  payments() {
    return this.admin.listPayments();
  }

  @Get('subscriptions')
  subscriptions() {
    return this.admin.listSubscriptions();
  }
}
