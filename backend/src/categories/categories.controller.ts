import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryStatusDto } from './dto/update-category-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { UserRole } from '../users/schemas/user.schema';

@Controller('categories')
@UseGuards(
  JwtAuthGuard,
  RolesGuard,
)
export class CategoriesController {
  constructor(
    private readonly categoriesService:
      CategoriesService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(
    @Body() dto: CreateCategoryDto,
  ) {
    const category =
      await this.categoriesService.create(
        dto.name,
        dto.description,
      );

    return {
      message:
        'Category created successfully',

      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.AGENT,
    UserRole.EMPLOYEE,
  )
  async findAll() {
    const categories =
      await this.categoriesService.findAll();

    return {
      categories,
    };
  }

  @Get('active')
  @Roles(
    UserRole.ADMIN,
    UserRole.AGENT,
    UserRole.EMPLOYEE,
  )
  async findActive() {
    const categories =
      await this.categoriesService.findActive();

    return {
      categories,
    };
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.AGENT,
    UserRole.EMPLOYEE,
  )
  async findOne(
    @Param('id') id: string,
  ) {
    const category =
      await this.categoriesService.findById(
        id,
      );

    return {
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    };
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryStatusDto,
  ) {
    const category =
      await this.categoriesService.updateStatus(
        id,
        dto.isActive,
      );

    return {
      message: dto.isActive
        ? 'Category activated successfully'
        : 'Category deactivated successfully',

      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
      },
    };
  }
}