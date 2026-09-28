import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async registerEmployee(
    name: string,
    email: string,
    password: string,
  ) {
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.usersService.createEmployee(
      name,
      email,
      passwordHash,
    );

    return {
      message: 'Employee registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'User account is inactive',
      );
    }

    const passwordMatched = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Invalid email or password',
      );
    }

    const payload = {
      sub: user._id.toString(),
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}