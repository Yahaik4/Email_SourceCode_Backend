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

            if (email.senderId === userId) {
                emails.push(email);
                continue;
            }

            const recipientEntry = email.recipients.find(recipent => recipent.recipientId === userId);

            if (!recipientEntry) {
                continue;
            }

            const emailCopy = { ...email, recipients: [...email.recipients] };

            switch (recipientEntry.recipientType) {
                case 'to':
                    emailCopy.recipients = emailCopy.recipients.filter(r => r.recipientType === 'to');
                    break;
                case 'cc':
                    break;
                case 'bcc':
                    emailCopy.recipients = [
                        {
                            recipientId: userId,
                            recipientType: 'bcc'
                        }
                    ];
                    break;
            }
            
            emails.push(emailCopy);
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

    async moveToTrash(emailId: string, userId: string): Promise<UserEmailEntity> {
        const email = await this.findUserEmailByUserandEmail(emailId, userId);
        const existed = await this.userEmailRepository.findById(email.id);
        email.mainFolder = 'trash';
        
        const updated = Object.assign(existed, email);
        return await this.userEmailRepository.update(updated);
    }

    async deleteEmail(emailId: string): Promise<boolean> {
        const email = await this.emailRepository.findById(emailId);

        if(!email.id){
            throw new Error('Email not found.');
        }

        await this.emailRepository.delete(email.id);

        return true;
    }

    async readEmail(emailId: string, userId: string): Promise<EmailEntity>{
        const email = await this.findUserEmailByUserandEmail(emailId, userId);
        email.isRead = true;
        
        await this.updateUserEmail(email);

        return await this.emailRepository.findById(emailId);
    }

    async customLabel(emailIds: string[],userId: string, label: string): Promise<UserEmailEntity[]>{
        const updatedUserEmails: UserEmailEntity[] = [];

        for(const emailId of emailIds){
            const userEmail = await this.findUserEmailByUserandEmail(emailId, userId);
            if (!userEmail.customLabels.includes(label)) {
                userEmail.customLabels.push(label);
            }
            
            await this.userEmailRepository.update(userEmail);
            updatedUserEmails.push(userEmail);
        }

        return updatedUserEmails;
    }

    async searchEmailBySubjectOrLabel(keyword: string, userId: string): Promise<EmailEntity[]> {
        const lowerKeyword = keyword.toLowerCase();
    
        const userEmails = await this.userEmailRepository.whereEqualTo('userId', userId).find();
    
        const matchedEmails: EmailEntity[] = [];
    
        for (const userEmail of userEmails) {
            const email = await this.emailRepository.findById(userEmail.emailId);
    
            const subjectMatch = email.subject?.toLowerCase().includes(lowerKeyword);
            const bodyMatch = email.body?.toLowerCase().includes(lowerKeyword);
            const labelMatch = userEmail.customLabels?.some(label => label.toLowerCase().includes(lowerKeyword));
    
            if (subjectMatch || bodyMatch || labelMatch) {
                matchedEmails.push(email);
            }
        }
    
        return matchedEmails;
    }
    

}
