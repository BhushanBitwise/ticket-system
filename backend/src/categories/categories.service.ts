import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Category,
  CategoryDocument,
} from './schemas/category.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel:
      Model<CategoryDocument>,
  ) {}

  async create(
    name: string,
    description: string,
  ): Promise<CategoryDocument> {
    const existingCategory =
      await this.categoryModel.findOne({
        name: name.trim(),
      });

    if (existingCategory) {
      throw new ConflictException(
        'Category already exists',
      );
    }

    return this.categoryModel.create({
      name: name.trim(),
      description: description.trim(),
      isActive: true,
    });
  }

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({
        createdAt: -1,
      });
  }

  async findActive(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find({
        isActive: true,
      })
      .sort({
        name: 1,
      });
  }

  async findById(
    id: string,
  ): Promise<CategoryDocument> {
    const category =
      await this.categoryModel.findById(id);

    if (!category) {
      throw new NotFoundException(
        'Category not found',
      );
    }

    return category;
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<CategoryDocument> {
    const category =
      await this.findById(id);

    category.isActive = isActive;

    await category.save();

    return category;
  }
}