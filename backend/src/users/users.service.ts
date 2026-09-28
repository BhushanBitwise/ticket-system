import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  User,
  UserDocument,
  UserRole,
} from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase(),
    });
  }

  async findById(
    id: string,
  ): Promise<UserDocument> {
    const user =
      await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }

  async createEmployee(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const existingUser =
      await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    return this.userModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.EMPLOYEE,
      isActive: true,
    });
  }

  async createAgent(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const existingUser =
      await this.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already registered',
      );
    }

    return this.userModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.AGENT,
      isActive: true,
    });
  }

  async createAdmin(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const existingUser =
      await this.findByEmail(email);

    if (existingUser) {
      return existingUser;
    }

    return this.userModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    });
  }

  async findAllAgents(): Promise<UserDocument[]> {
    return this.userModel
      .find({
        role: UserRole.AGENT,
      })
      .select('-passwordHash')
      .sort({
        createdAt: -1,
      });
  }

  async findAgentById(
    id: string,
  ): Promise<UserDocument> {
    const agent =
      await this.userModel.findOne({
        _id: id,
        role: UserRole.AGENT,
      });

    if (!agent) {
      throw new NotFoundException(
        'Agent not found',
      );
    }

    return agent;
  }

  async updateAgentStatus(
    id: string,
    isActive: boolean,
  ): Promise<UserDocument> {
    const agent =
      await this.findAgentById(id);

    agent.isActive = isActive;

    await agent.save();

    return agent;
  }
}