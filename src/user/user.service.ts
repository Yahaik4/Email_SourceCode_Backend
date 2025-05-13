import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
    constructor(private readonly userRepository: UserRepository) {}

    async findAll(): Promise<UserEntity[]> {
        return await this.userRepository.findAll();
    }

    async updateUser(user: Partial<Omit<UserEntity, 'password'>>): Promise<UserEntity> {
        if (!user.id) {
            throw new Error('Missing user ID');
        }
    
        const updatedUser = await this.userRepository.update(user);
    
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
