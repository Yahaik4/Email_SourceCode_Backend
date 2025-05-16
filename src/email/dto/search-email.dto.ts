import { IsNotEmpty, IsString } from 'class-validator';

export class SearchEmailDto{

    @IsNotEmpty()
    @IsString()
    keyword: string;

}