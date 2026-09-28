
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { DashboardService } from './dashboard.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
  ) {}

  // GET /api/dashboard/admin
  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  // GET /api/dashboard/employee
  @Get('employee')
  @Roles(UserRole.EMPLOYEE)
  getEmployeeDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getEmployeeDashboard(user.id);
  }

  // GET /api/dashboard/agent
  @Get('agent')
  @Roles(UserRole.AGENT)
  getAgentDashboard(@CurrentUser() user: any) {
    return this.dashboardService.getAgentDashboard(user.id);
  }
}
