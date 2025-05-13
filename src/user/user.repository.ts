import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { UserEntity, UserModel } from './user.entity';
import { getRepository } from 'fireorm';

@Injectable()
export class UserRepository {

    private userRepository = getRepository(UserModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async findAll(): Promise<UserEntity[]> {
        return await this.userRepository.find();
    }

    async update(user: Partial<Omit<UserEntity, 'password'>>): Promise<UserEntity | null> {
        if (!user.id) return null;
    
        const existingUser = await this.userRepository.findById(user.id);
        if (!existingUser) return null;
    
        const updatedUser = Object.assign(existingUser, user)
        return await this.userRepository.update(updatedUser);
    }
}
