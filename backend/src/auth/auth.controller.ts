import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

import { UserRole } from '../users/schemas/user.schema';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.registerEmployee(
      dto.name,
      dto.email,
      dto.password,
    );
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(
      dto.email,
      dto.password,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: any) {
    return {
      user,
    };
  }

@Get('admin-test')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
adminTest(@CurrentUser() user: any) {
  return {
    message: 'Admin access granted',
    user,
  };
}

}