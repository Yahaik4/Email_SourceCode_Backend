import { Injectable } from '@nestjs/common';
import { EmailRepository } from './email.repository';
import { EmailEntity } from './email.entity';
import { CustomException } from 'src/common/exceptions/custom.exception';
import { AuthRepository } from 'src/auth/auth.repository';

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

    async createEmail(email: Omit<EmailEntity, 'id'>): Promise<EmailEntity>{

        const sender = await this.authRepository.findUserById(email.senderId);
        if (!sender) {
            throw new CustomException('Sender does not exist');
        }
        const checkRecipients = await Promise.all(
            email.recipientIds.map(id => this.authRepository.findUserById(id))
        );

        if (checkRecipients.some(r => !r)) {
            throw new CustomException('One or more recipients do not exist');
        }

        return await this.emailRepository.createEmail(email);
    }
}
