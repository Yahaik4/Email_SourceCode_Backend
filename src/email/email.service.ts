import { Injectable } from '@nestjs/common';
import { EmailRepository } from './email.repository';
import { EmailEntity, EmailWithStatus, UserEmailEntity } from './email.entity';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { AuthRepository } from 'src/auth/auth.repository';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailGateway } from './email.gateway';
import { SearchAdvancedEmailDto } from './dto/searchAdvanted-email.dto';

@Injectable()
export class EmailService {
    constructor(
        private readonly emailRepository: EmailRepository,
        private readonly authRepository: AuthRepository,
        private readonly emailGateway: EmailGateway,
    ) {}

    async findEmailById(emailId: string, userId: string): Promise<EmailWithStatus>{
        const email = await this.emailRepository.findEmailById(emailId, userId);

        if(!email || email == null){
            throw new CustomException('Email does not exist');
        }

        return email
    }

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

    async findEmailByFolder(folder: string, userId: string): Promise<EmailWithStatus[]>{
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
        return await this.emailRepository.findAllEmailStarred(userId);
    }

    async moveToTrash(emailId: string, userId: string): Promise<UserEmailEntity> {
        return await this.emailRepository.moveToTrash(emailId, userId);
    }

    async deleteEmail(emailId: string, userId: string): Promise<boolean> {
        return this.emailRepository.deleteEmail(emailId, userId);
    }

    async updateReadEmail(emailId: string, userId: string): Promise<EmailEntity>{
        return await this.emailRepository.readEmail(emailId, userId);
    }

    async customLabel(emailIds: string[], userId: string, label: string): Promise<UserEmailEntity[]>{
        return this.emailRepository.customLabel(emailIds, userId, label);
    }

    async searchEmailBySubjectOrLabel(keyword: string, userId: string): Promise<EmailEntity[]> {    
        return this.emailRepository.searchEmailBySubjectOrLabel(keyword, userId);
    }

    async searchAdvanced(searchDto: SearchAdvancedEmailDto, userId: string): Promise<EmailEntity[]> {
        return this.emailRepository.searchAdvanced(searchDto, userId);
    }

    async removeLabel(userId: string, label: string): Promise<boolean>{
        return await this.emailRepository.removeLabel(userId, label);
    }

    async starredEmail(emailId: string, userId: string): Promise<EmailEntity>{
        return this.emailRepository.starredEmail(emailId, userId);
    }

    async createAndSendEmail(emailDto: CreateEmailDto, senderId: string): Promise<EmailEntity> {
        const sender = await this.authRepository.findUserById(senderId);
        if (!sender) {
            throw new CustomException('Sender does not exist');
        }

        const email = await this.emailRepository.createAndSendEmail(emailDto, senderId);

        if (emailDto.recipients && Array.isArray(emailDto.recipients)) {
            for (const recipient of emailDto.recipients) {
                this.emailGateway.notifyNewEmail(recipient.recipientId, email);
            }
        }

        return email;
    }


    // CustomLabel

    async getAllLabelByUserId(userId: string): Promise<string[]>{
        return this.emailRepository.getAllLabelByUserId(userId);
    }

    async getAllEmailOfLabel(label: string, userId: string): Promise<EmailEntity[]> {
        return await this.emailRepository.getAllEmailOfLabel(label,userId);
    }
    
}
