import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { RecipientData, Attachment } from '../email.entity';
import { Transform } from 'class-transformer';

export class CreateEmailDto{

    @IsOptional()
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    body: string;

    @IsOptional()
    @Transform(({ value }) => {
        try {
            return JSON.parse(value);
        }catch {
            return value;
        }
    })
    recipients: RecipientData[];

    @IsOptional()
    attachments?: Attachment[];

    @IsOptional()
    @IsString()
    replyToEmailId?: string;
    
}