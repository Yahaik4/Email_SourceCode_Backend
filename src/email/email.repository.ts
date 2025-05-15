import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { getRepository } from 'fireorm';
import { EmailEntity, EmailModel, UserEmailEntity, UserEmailModel } from './email.entity';
import * as admin from "firebase-admin"; 
import { CreateEmailDto } from './dto/create-email.dto';
import { UserEntity } from 'src/user/user.entity';
import { UpdateEmailDto } from './dto/update-email.dto';

@Injectable()
export class EmailRepository {

    private emailRepository = getRepository(EmailModel);
    private userEmailRepository = getRepository(UserEmailModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async findEmailsById(id: string): Promise<EmailEntity> {
        return await this.emailRepository.findById(id);
    }

    async findUserEmailByUserandEmail(emailId: string, userId: string): Promise<UserEmailEntity> {
        const email = await this.userEmailRepository.whereEqualTo('emailId', emailId).whereEqualTo('userId', userId).findOne();
        if(!email){
            throw new Error('Invalid email')
        }
        
        return email;
    }

    async updateUserEmail(userEmail: Partial<UserEmailEntity>): Promise<UserEmailEntity>{
        if (!userEmail.id) {
            throw new Error('UserEmail ID is required for update.');
        }
    
        const existing = await this.userEmailRepository.findById(userEmail.id);
        if (!existing) {
            throw new Error('UserEmail not found.');
        }
        
        const updated = Object.assign(existing, userEmail);
        return await this.userEmailRepository.update(updated);
    }

    async findEmailSender(userId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.whereEqualTo('senderId', userId).orderByDescending('createdAt').find();
    }

    async findEmailRerecipient(userId: string): Promise<EmailEntity[]>{
        const inboxEmails = await this.userEmailRepository.whereEqualTo('userId', userId).whereEqualTo('mainFolder', 'inbox').find();
        const fullEmails = await Promise.all(
            inboxEmails.map((ue) => this.emailRepository.findById(ue.emailId))
        );

        return fullEmails;
    }

    async findEmailByFolder(folder: string, userId: string): Promise<EmailEntity[]>{
        const userEmails = await this.userEmailRepository.whereEqualTo('userId', userId).whereEqualTo('mainFolder', folder).find();

        const emailIds = userEmails.map(email => email.emailId);
        const emails: EmailEntity[] = [];
        for(const emailId of emailIds){
            const email = await this.emailRepository.findById(emailId);
            emails.push(email);
        }
        return emails;
    }

    async createEmailDraft(emailDto: CreateEmailDto, senderId: string): Promise<EmailEntity>{
        const email = new EmailModel();
        email.senderId = senderId;
        email.subject = emailDto.subject;
        email.body = emailDto.body;
        email.recipients = emailDto.recipients;
        email.attachments = emailDto.attachments || [];
        email.isDraft = true;
        email.createdAt = admin.firestore.Timestamp.now();
        email.updatedAt = admin.firestore.Timestamp.now();

        const savedEmail = await this.emailRepository.create(email);

        const userEmail = new UserEmailModel();
        userEmail.userId = senderId;
        userEmail.emailId = savedEmail.id;
        userEmail.mainFolder = 'draft';
        userEmail.isRead = true;
        userEmail.isStarred = false;
        userEmail.customLabels = [];

        await this.userEmailRepository.create(userEmail);

        return savedEmail;
    }

    async updateEmailDraft(email: UpdateEmailDto): Promise<EmailEntity>{
        if(!email.id){
            throw new Error('UserEmail ID is required for update.');
        }

        const existed = await this.emailRepository.findById(email.id);

        if(!existed){
            throw new Error('Invalid draft email')
        }

        existed.updatedAt = admin.firestore.Timestamp.now();

        const updated = Object.assign(existed, email);
        return await this.emailRepository.update(updated);
    }

    async sendEmail(emailId: string): Promise<void>{
        const email = await this.emailRepository.findById(emailId);
        if(!email || !email.isDraft){
            throw new Error('Invalid draft email')
        }

        email.isDraft = false;
        email.updatedAt = admin.firestore.Timestamp.now();
        await this.emailRepository.update(email);

        const userEmail = await this.findUserEmailByUserandEmail(emailId, email.senderId);
        userEmail.mainFolder = 'sent';

        await this.updateUserEmail(userEmail);


        for (const recipient of email.recipients) {
            const newUserEmail = new UserEmailModel();
            newUserEmail.userId = recipient.recipientId;
            newUserEmail.emailId = emailId;
            newUserEmail.mainFolder = 'inbox';
            newUserEmail.isRead = false;
            newUserEmail.isStarred = false;
            newUserEmail.customLabels = [];
        
            await this.userEmailRepository.create(newUserEmail);
        }
        

        return;
    }

    async findAllEmailStarred(userId: string): Promise<EmailEntity[]>{
        const emailUsers = await this.userEmailRepository.whereEqualTo('userId', userId).whereEqualTo('isStarred', true).find();

        const emails: EmailEntity[] = [];
        for(const email of emailUsers){
            emails.push(await this.emailRepository.findById(email.emailId));
        }

        return emails;
    }

}
