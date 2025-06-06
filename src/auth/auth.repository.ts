// src/user/user.repository.ts
import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { UserEntity, UserModel } from 'src/user/user.entity';
import * as bcrypt from 'bcrypt';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { getRepository } from 'fireorm';
import { RegisterDto } from './dto/register.dto';
import { DEFAULT_SETTINGS } from 'src/user/user.entity';
import * as admin from 'firebase-admin';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthRepository {

    private userRepository = getRepository(UserModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async findUserById(id: string): Promise<UserEntity | null>{
        return await this.userRepository.whereEqualTo('id', id).findOne();
    }

    async findUserByPhoneNumber(phoneNumber: string): Promise<UserEntity | null>{
        return await this.userRepository.whereEqualTo('phoneNumber', phoneNumber).findOne();
    }

    async findUserByEmail(email: string): Promise<UserEntity | null>{
        return await this.userRepository.whereEqualTo('email', email).findOne();
    }

    async login(user: Pick<UserEntity, 'email' | 'password'>): Promise<Omit<UserEntity, 'password'> | null> {
        const existedUser = await this.findUserByEmail(user.email);

        if (existedUser === null){
            throw new CustomException('Invalid email');
        }

        const comparePassword = await bcrypt.compare(user.password, existedUser.password);
        if (!comparePassword) {
            throw new CustomException('Incorrect password');
        }

        const { password, ...result } = existedUser;
        return result;
    }

    async Register(user: RegisterDto): Promise<UserEntity>{
        const existedUser = await this.findUserByPhoneNumber(user.phoneNumber);

        if (existedUser){
            throw new CustomException('phone number existed');
        }

        const existedEmail = await this.findUserByEmail(user.email);

        if(existedEmail){
            throw new CustomException('Email existed');
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        const newUser = await this.userRepository.create({
            ...user,
            password: hashedPassword,
            avatar: null,
            setting: DEFAULT_SETTINGS,
            createdAt: admin.firestore.Timestamp.now(),
            updateAt: admin.firestore.Timestamp.now()

        })

        return newUser;
    }

    async changePassword(userId: string, newPassword: string): Promise<void> {
        const user = await this.findUserById(userId);

        if (!user) {
            throw new CustomException('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepository.update({
            ...user,
            password: hashedPassword,
            updateAt: admin.firestore.Timestamp.now()
        });
    }

}
