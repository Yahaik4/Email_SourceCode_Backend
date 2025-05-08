// src/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UserEntity } from './user.entity';

@Injectable()
export class UserRepository {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) {}

    async findAll(): Promise<UserEntity[]> {
        return this.userModel.find();
    }

    async findById(_id: Types.ObjectId): Promise<UserEntity | null> {
        return this.userModel.findOne({ _id });
    }

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userModel.findOne({ email });
    }

    async create(user: Pick<UserEntity, 'email' | 'username'>): Promise<UserEntity> {
        const newUser = new this.userModel(user);
        await newUser.save();
        return newUser.toObject() as UserEntity;
    }

}
