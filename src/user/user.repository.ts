import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { UserEntity, UserModel } from './user.entity';
import { getRepository } from 'fireorm';
import { UpdateUserDto } from './dto/update-user.dto';


@Injectable()
export class UserRepository {

    private userRepository = getRepository(UserModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async findAll(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async findUserById(id: string): Promise<UserEntity | null>{
        return await this.userRepository.findById(id);
    }

    async findUserByEmail(email: string): Promise<UserEntity | null>{
        return await this.userRepository.whereEqualTo('email', email).findOne();
    }

    async update(user: UpdateUserDto, userId: string): Promise<UserEntity | null> {
        const existingUser = await this.findUserById(userId);
        if (!existingUser) return null;
    
        const updatedUser = Object.assign(existingUser, user)
        return await this.userRepository.update(updatedUser);
    }
}
