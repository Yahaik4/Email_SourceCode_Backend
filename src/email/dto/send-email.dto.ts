import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class SendEmailDto{

    @IsOptional()
    @IsString()
    id: string;

}