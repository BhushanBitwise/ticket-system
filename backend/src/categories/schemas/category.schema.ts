import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument =
  HydratedDocument<Category>;

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    trim: true,
  })
  description: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export const CategorySchema =
  SchemaFactory.createForClass(Category);