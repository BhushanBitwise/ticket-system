import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';

import {
  User,
  UserSchema,
} from './schemas/user.schema';

import { AdminSeedService } from './admin.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [
    UsersController,
  ],

  providers: [
    UsersService,
    AdminSeedService,
  ],

  exports: [
    UsersService,
  ],
})
export class UsersModule {}