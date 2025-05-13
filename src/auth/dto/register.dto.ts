import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
    @IsNotEmpty()
    phoneNumber: string;

    @IsNotEmpty()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    @Matches(/(?=.*[A-Z])/, {
        message: 'Password must contain at least one uppercase letter',
    })
    @Matches(/(?=.*\d)/, {
        message: 'Password must contain at least one number',
    })
    password: string;

    @IsNotEmpty()
    username: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;
}
