import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SearchAdvancedEmailDto{

    @IsOptional()
    @IsString()
    from: string;

    @IsOptional()
    @IsString()
    to: string;

    @IsOptional()
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    keyword: string;

    @IsNotEmpty()
    @IsString()
    folder: string;

    @IsOptional()
    @IsString()
    hasAttachment: string;
}