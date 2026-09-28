import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Request,
  RequestSchema,
} from './schemas/request.schema';

import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';

import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Request.name,
        schema: RequestSchema,
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
    ]),

    UsersModule,
  ],

  controllers: [RequestsController],

  providers: [RequestsService],

  exports: [RequestsService],
})
export class RequestsModule {}