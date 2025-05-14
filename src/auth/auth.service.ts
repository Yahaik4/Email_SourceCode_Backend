import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { UserEntity } from 'src/user/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly authRepository: AuthRepository,
    ) {}
    
    async login(user: Pick<UserEntity, 'email' | 'password'>): Promise<Omit<UserEntity, 'password'>> {
        const userData = await this.authRepository.login(user);
        if (!userData) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return userData;
    }

    async register(user: Omit<UserEntity, 'avatar' | 'id'>): Promise<UserEntity> {
        const userData = await this.authRepository.Register(user);
        if (!userData) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return userData;
    }
}