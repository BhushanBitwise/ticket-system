import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentStatusDto } from './dto/update-agent-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from './schemas/user.schema';

import * as bcrypt from 'bcrypt';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post('agents')
  @Roles(UserRole.ADMIN)
  async createAgent(
    @Body() dto: CreateAgentDto,
  ) {
    const passwordHash =
      await bcrypt.hash(dto.password, 12);

    const agent =
      await this.usersService.createAgent(
        dto.name,
        dto.email,
        passwordHash,
      );

    return {
      message: 'Agent created successfully',

      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
      },
    };
  }

  @Get('agents')
  @Roles(UserRole.ADMIN)
  async getAgents() {
    const agents =
      await this.usersService.findAllAgents();

    return {
      agents,
    };
  }

  @Get('agents/:id')
  @Roles(UserRole.ADMIN)
  async getAgent(
    @Param('id') id: string,
  ) {
    const agent =
      await this.usersService.findAgentById(
        id,
      );

    return {
      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    };
  }

  @Patch('agents/:id/status')
  @Roles(UserRole.ADMIN)
  async updateAgentStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAgentStatusDto,
  ) {
    const agent =
      await this.usersService.updateAgentStatus(
        id,
        dto.isActive,
      );

    return {
      message: dto.isActive
        ? 'Agent activated successfully'
        : 'Agent deactivated successfully',

      agent: {
        id: agent._id,
        name: agent.name,
        email: agent.email,
        role: agent.role,
        isActive: agent.isActive,
      },
    };
  }
}