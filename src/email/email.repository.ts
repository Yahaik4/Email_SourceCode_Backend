import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { getRepository } from 'fireorm';
import { EmailEntity, EmailModel, UserEmailEntity, UserEmailModel } from './email.entity';
import * as admin from "firebase-admin"; 
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { FcmTokenModel } from 'src/auth/fcmToken.Entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SearchAdvancedEmailDto } from './dto/searchAdvanted-email.dto';

@Injectable()
export class EmailRepository {

    private emailRepository = getRepository(EmailModel);
    private userEmailRepository = getRepository(UserEmailModel);
    private fcmRepository = getRepository(FcmTokenModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore,
        private firebaseService: FirebaseService

    ){}

    async findEmailById(id: string): Promise<EmailEntity | null> {
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
        email.replyToEmailId = emailDto.replyToEmailId;

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

    async createAndSendEmail(emailDto: CreateEmailDto, senderId: string): Promise<EmailEntity>{
        const email = new EmailModel();
        email.senderId = senderId;
        email.subject = emailDto.subject;
        email.body = emailDto.body;
        email.recipients = emailDto.recipients;
        email.attachments = emailDto.attachments || [];
        email.isDraft = false;
        email.createdAt = admin.firestore.Timestamp.now();
        email.updatedAt = admin.firestore.Timestamp.now();
        email.replyToEmailId = email.replyToEmailId;

        const savedEmail = await this.emailRepository.create(email);

        const userEmail = new UserEmailModel();
        userEmail.userId = senderId;
        userEmail.emailId = savedEmail.id;
        userEmail.mainFolder = 'sent';
        userEmail.isRead = true;
        userEmail.isStarred = false;
        userEmail.customLabels = [];

        await this.userEmailRepository.create(userEmail);

        for (const recipient of email.recipients) {
            const newUserEmail = new UserEmailModel();
            newUserEmail.userId = recipient.recipientId;
            newUserEmail.emailId = savedEmail.id;
            newUserEmail.mainFolder = 'inbox';
            newUserEmail.isRead = false;
            newUserEmail.isStarred = false;
            newUserEmail.customLabels = [];
    
            await this.userEmailRepository.create(newUserEmail);
            
            const fcmTokenUser = await this.fcmRepository.findById(recipient.recipientId);
            if(fcmTokenUser){
                await this.firebaseService.sendNotification(fcmTokenUser.token, 
                    email.subject,
                    email.body
                )
            }
        }
        
        return savedEmail;
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

            const fcmTokenUser = await this.fcmRepository.findById(recipient.recipientId);
            if(fcmTokenUser){
                await this.firebaseService.sendNotification(fcmTokenUser.token, 
                    email.subject,
                    email.body
                )
            }
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

    async starredEmail(userId: string, emailId: string): Promise<EmailEntity>{
        const userEmail = await this.findUserEmailByUserandEmail(emailId, userId);
        userEmail.isStarred = !userEmail.isStarred;
        await this.updateUserEmail(userEmail);
        return await this.emailRepository.findById(emailId);
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

    async customLabel(emailIds: string[], userId: string, label: string): Promise<UserEmailEntity[]>{
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

    async removeLabel(userId: string, label: string): Promise<boolean>{
        const userEmails = await this.userEmailRepository.whereEqualTo('userId', userId).find();
        for(const emails of userEmails){
            const email = await this.findUserEmailByUserandEmail(emails.id, userId);

            const index = email.customLabels.indexOf(label);
            if (index !== -1) {
                email.customLabels.splice(index, 1);
                await this.userEmailRepository.update(email);
            }
        }
        return true;
    }

    async getAllEmailOfLabel(label: string, userId: string): Promise<EmailEntity[]> {
        const userEmails = await this.userEmailRepository. whereEqualTo('userId', userId).whereArrayContains('customLabels', label).find();
        const emails: EmailEntity[] = [];
    
        for (const userEmail of userEmails) {
            const email = await this.emailRepository.findById(userEmail.emailId);
            if (!email) {
                console.warn(`Không tìm thấy email với ID ${userEmail.emailId}`);
                continue;
            }
            emails.push(email);
        }
    
        return emails;
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

    // async searchAdvanced(searchDto: SearchAdvancedEmailDto, userId: string): Promise<EmailEntity[]> {
    //     if(searchDto.folder === 'All Mail'){
    //         const emails = await this.userEmailRepository.whereEqualTo('userId', userId).find();

    //         if(searchDto.from)
    //     }else{

    //     }
    // }
    // Reply and Forward

    // Reply

    // async getReplyTemplate(emailId: string, currentUserId: string): Promise<EmailEntity> {
    //     const originalEmail = await this.emailRepository.findById(emailId);
    //     if(!originalEmail) throw new Error('Original email not found');

    //     const replyTemplate: EmailEntity = {
    //         id: '',
    //         senderId: '',
    //         subject: '',
    //         body: '',
    //         isDraft: false,
    //         recipients: [],
    //         attachments: [],
    //         createdAt: new Timestamp,
    //         updatedAt: new Timestamp
    //     }
    //     return {

    //     }
    // }


    

}
