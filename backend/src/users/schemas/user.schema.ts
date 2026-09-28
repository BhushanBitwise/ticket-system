import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  AGENT = 'AGENT',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
  })
  passwordHash: string;

  @Prop({
    required: true,
    enum: UserRole,
  })
  role: UserRole;

  @Prop({
    default: true,
  })
  isActive: boolean;

  // Mongoose timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema =
  SchemaFactory.createForClass(User);