import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Patch,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser, AuthUser } from '../common/decorators';
import { UpdateSettingsDto, ChangePasswordDto } from './users.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.usersService.findById(auth.id);
    if (!user) throw new NotFoundException('User not found.');
    const settings = await this.usersService.getSettings(auth.id);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      status: user.status,
      createdAt: user.createdAt,
      settings,
    };
  }

  @Get('me/settings')
  getSettings(@CurrentUser() auth: AuthUser) {
    return this.usersService.getSettings(auth.id);
  }

  @Patch('me/settings')
  updateSettings(@CurrentUser() auth: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(auth.id, dto);
  }

  @Post('me/change-password')
  changePassword(@CurrentUser() auth: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(auth.id, dto);
  }

  @Post('me/deactivate')
  deactivate(@CurrentUser() auth: AuthUser) {
    return this.usersService.setStatus(auth.id, 'deactivated' as never);
  }

  @Delete('me')
  deleteAccount(@CurrentUser() auth: AuthUser) {
    return this.usersService.deleteAccount(auth.id);
  }
}
