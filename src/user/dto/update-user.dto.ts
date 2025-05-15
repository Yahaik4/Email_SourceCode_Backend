import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { Settings } from '../user.entity';
import { Transform } from 'class-transformer';

export class UpdateUserDto{
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
    @Transform(({ value }) => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
    })
    setting?: Settings;


}