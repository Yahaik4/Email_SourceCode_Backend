import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { UserEntity } from 'src/user/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
    ) {}
    
    async login(user:LoginDto): Promise<Omit<UserEntity, 'password'>> {
        const userData = await this.authRepository.login(user);
        if (!userData) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return userData;
    }

    async register(user: RegisterDto): Promise<UserEntity> {
        const userData = await this.authRepository.Register(user);
        if (!userData) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return userData;
    }
}