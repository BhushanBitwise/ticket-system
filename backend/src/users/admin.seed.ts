import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';

@Injectable()
export class AdminSeedService
  implements OnModuleInit
{
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit() {
    const adminEmail =
      'admin@company.com';

    const adminPassword =
      'Admin@123';

    const passwordHash =
      await bcrypt.hash(adminPassword, 12);

    const admin =
      await this.usersService.createAdmin(
        'System Admin',
        adminEmail,
        passwordHash,
      );

    console.log(
      `Admin account ready: ${admin.email}`,
    );
  }
}