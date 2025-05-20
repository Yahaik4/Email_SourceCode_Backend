import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class labelDto{

    @IsNotEmpty()
    @IsString()
    label: string;
}