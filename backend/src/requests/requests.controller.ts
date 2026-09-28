import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { RequestsService } from './requests.service';

import { CreateRequestDto } from './dto/create-request.dto';
import { AssignAgentDto } from './dto/assign-agent.dto';
import { ResolveRequestDto } from './dto/resolve-request.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RequestsController {
  constructor(
    private readonly requestsService: RequestsService,
  ) {}

  @Post()
  @Roles(UserRole.EMPLOYEE)
  create(
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.create(dto, user.id);
  }

  @Get('my')
  @Roles(UserRole.EMPLOYEE)
  findMyRequests(@CurrentUser() user: any) {
    return this.requestsService.findMyRequests(user.id);
  }

  @Get('assigned')
  @Roles(UserRole.AGENT)
  findAssignedRequests(@CurrentUser() user: any) {
    return this.requestsService.findAssignedRequests(user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.requestsService.findAll();
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.EMPLOYEE,
    UserRole.AGENT,
  )
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.findOne(id, user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  assignAgent(
    @Param('id') id: string,
    @Body() dto: AssignAgentDto,
  ) {
    return this.requestsService.assignAgent(
      id,
      dto.agentId,
    );
  }

  @Patch(':id/start')
  @Roles(UserRole.AGENT)
  startWork(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.startWork(
      id,
      user.id,
    );
  }

  @Patch(':id/resolve')
  @Roles(UserRole.AGENT)
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.resolve(
      id,
      user.id,
      dto.resolutionNote,
    );
  }

  @Patch(':id/close')
  @Roles(UserRole.EMPLOYEE)
  close(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.close(
      id,
      user.id,
    );
  }

  @Patch(':id/reopen')
  @Roles(UserRole.EMPLOYEE)
  reopen(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.reopen(
      id,
      user.id,
    );
  }
}