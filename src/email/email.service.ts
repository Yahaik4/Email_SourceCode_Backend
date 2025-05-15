import { Injectable } from '@nestjs/common';
import { EmailRepository } from './email.repository';
import { EmailEntity } from './email.entity';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { AuthRepository } from 'src/auth/auth.repository';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@Injectable()
export class EmailService {
    constructor(
        private readonly emailRepository: EmailRepository,
        private readonly authRepository: AuthRepository,
    ) {}

    async findAllSentEmails(senderId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.findEmailSender(senderId);
    }

    async findAllRerecipientEmails(rerecipientId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.findEmailRerecipient(rerecipientId);
    }

    async findUserIdByUserEmail(userEmail: string): Promise<string | null>{
        const user = await this.authRepository.findUserByEmail(userEmail);
        if(!user){
            return null;
        }

        return user.id;
    }

    async findEmailByFolder(folder: string, userId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.findEmailByFolder(folder, userId);
    }

    async createEmailDraft(email:CreateEmailDto, senderId: string): Promise<EmailEntity>{

        const sender = await this.authRepository.findUserById(senderId);
        if (!sender) {
            throw new CustomException('Sender does not exist');
        }

        return await this.emailRepository.createEmailDraft(email, senderId);
    }

    async updateEmailDraft(email: UpdateEmailDto): Promise<EmailEntity>{
        return await this.emailRepository.updateEmailDraft(email);
    }

    async sendEmail(emailId: string): Promise<void>{
        return await this.emailRepository.sendEmail(emailId);
    }

    async findAllEmailStarred(userId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.findAllEmailStarred(userId)
    }
}
