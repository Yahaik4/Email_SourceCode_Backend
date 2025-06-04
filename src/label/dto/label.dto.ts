import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty()
  @IsString()
  labelName: string;
}

export class AddEmailsToLabelDto {
  @IsNotEmpty()
  @IsString()
  labelName: string;

  @IsNotEmpty()
  @IsArray()
  emailIds: string[];
}

export class RemoveEmailsFromLabelDto {
  @IsNotEmpty()
  @IsString()
  labelName: string;

  @IsNotEmpty()
  @IsArray()
  emailIds: string[];
}