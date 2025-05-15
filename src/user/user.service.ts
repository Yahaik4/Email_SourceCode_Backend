import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async findAll(): Promise<UserEntity[]> {
        return await this.userRepository.findAll();
    }

    async updateUser(user: UpdateUserDto, userId: string): Promise<UserEntity> {
        if (!userId) {
            throw new Error('Missing user ID');
        }

        if(user.email){
            const existedEmail = await this.userRepository.findUserByEmail(user.email);

            if(existedEmail){
                throw new Error('Email is Existed');
            }
        }

    
        const updatedUser = await this.userRepository.update(user, userId);
    
        if (!updatedUser) {
            throw new Error('User not found');
        }
    
        return updatedUser;
    }
    

    // async updateProfile(user: Partial<UserEntity>): Promise<UserEntity> {
    //     try{
    //         const updatedUser = await this.userRepository.update(user);
    //         if(!updatedUser){
    //             throw new NotFoundException(`User with ID ${user._id} not found`);
    //         }

    //         return updatedUser;
    //     }catch(error){
    //         if(error instanceof HttpException){
    //             throw error;
    //         }

    //         throw new InternalServerErrorException('Failed to update profile');
    //     }
    // }
    
}
