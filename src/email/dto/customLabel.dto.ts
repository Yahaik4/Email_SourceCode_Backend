import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class customLabelDto{

    @IsNotEmpty()
    @IsString()
    emailId: string[];

    @IsNotEmpty()
    @IsString()
    label: string;
}