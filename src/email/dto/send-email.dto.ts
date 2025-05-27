import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class SendEmailDto{

    @IsNotEmpty()
    @IsString()
    id: string;

}