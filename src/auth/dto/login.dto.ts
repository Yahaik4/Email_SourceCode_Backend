import { IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto{
    @IsNotEmpty()
    email: string;

    @IsNotEmpty()
    password: string;

    @IsOptional()
    fcmToken?: string;

}