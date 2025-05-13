import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto{
    @IsNotEmpty()
    id: string;

    @IsOptional()
    @IsString()
    username?: string

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

}