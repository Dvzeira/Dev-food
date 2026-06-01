import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return this.buildAuthResponse(user.id, user.email, user.role, user.name);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciais inválidas');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

    return this.buildAuthResponse(user.id, user.email, user.role, user.name);
  }

  private buildAuthResponse(id: string, email: string, role: string, name: string) {
    const payload = { sub: id, email, role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id, name, email, role },
    };
  }
}
