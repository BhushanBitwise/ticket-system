import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { RequestsModule } from './requests/requests.module';
import { DashboardModule } from './dashboard/dashboard.module';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(
      process.env.MONGODB_URI as string,
    ),

    UsersModule,
    AuthModule,
    CategoriesModule,
    RequestsModule,
    DashboardModule,
  ],
})
export class AppModule {}