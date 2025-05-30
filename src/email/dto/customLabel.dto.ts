import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class customLabelDto{

    @IsNotEmpty()
    @IsArray()
    emailIds: string[];

    @IsNotEmpty()
    @IsString()
    label: string;
}