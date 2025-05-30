import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { getRepository } from 'fireorm';
import { EmailEntity, EmailModel, EmailWithStatus, UserEmailEntity, UserEmailModel } from './email.entity';
import { UserModel } from 'src/user/user.entity';
import * as admin from "firebase-admin"; 
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { FcmTokenModel } from 'src/auth/fcmToken.Entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { SearchAdvancedEmailDto } from './dto/searchAdvanted-email.dto';
import { stringify } from 'querystring';

@Injectable()
export class EmailRepository {

    private emailRepository = getRepository(EmailModel);
    private userEmailRepository = getRepository(UserEmailModel);
    private fcmRepository = getRepository(FcmTokenModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore,
        private firebaseService: FirebaseService

    ){}

    async findEmailById(id: string, userId: string): Promise<EmailWithStatus | null> {
        const email = await this.emailRepository.findById(id);
        if (!email) return null;

        const userEmail = await this.userEmailRepository
            .whereEqualTo('userId', userId)
            .whereEqualTo('emailId', id)
            .findOne();

        if (!userEmail && email.senderId !== userId) {
            return null;
        }

        const isRead = userEmail?.isRead ?? false;
        const isStarred = userEmail?.isStarred ?? false;

        if (email.senderId === userId) {
            return {
            ...email,
            isRead,
            isStarred,
            };
        }

        const recipientEntry = email.recipients.find(r => r.recipientId === userId);
        if (!recipientEntry) {
            return null;
        }

        const emailCopy: EmailWithStatus = {
            ...email,
            recipients: [...email.recipients],
            isRead,
            isStarred,
        };

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
        return emailCopy;
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

    async findEmailByFolder(folder: string, userId: string): Promise<EmailWithStatus[]>{
        const userEmails = await this.userEmailRepository.whereEqualTo('userId', userId).whereEqualTo('mainFolder', folder).find();
        
        const emails: EmailWithStatus[] = [];
        for(const userEmail of userEmails){
            const email = await this.emailRepository.findById(userEmail.emailId);

            if (!email) continue;

            if (email.senderId === userId) {
                emails.push({...email, isStarred: userEmail.isStarred, isRead: userEmail.isRead});
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
            
            emails.push({
                ...emailCopy,
                isStarred: userEmail.isStarred,
                isRead: userEmail.isRead,
            });
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
        console.log(emailUsers);
        
        const emails: EmailEntity[] = [];
        for(const email of emailUsers){
            const item = await this.emailRepository.findById(email.emailId)
            emails.push(item);
        }

        return emails;
    }

    async starredEmail(emailId: string, userId: string): Promise<EmailEntity>{
        const email = await this.findUserEmailByUserandEmail(emailId, userId);
        email.isStarred = !email.isStarred;
        
        await this.updateUserEmail(email);
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

    // CustomLabel

    async getAllLabelByUserId(userId: string): Promise<string[]>{
        const email = await this.userEmailRepository.whereEqualTo('userId', userId).find();

        const customLabel: string[] = [];
        for(const item of email){
            for(const label of item.customLabels){
                customLabel.push(label);
            }
        }

        const setCustomLabel = new Set(customLabel);

        return Array.from(setCustomLabel);
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

    async searchAdvanced(searchDto: SearchAdvancedEmailDto, userId: string): Promise<EmailEntity[]> {
        const folder = searchDto.folder?.trim().toLowerCase() || 'all';

        const userEmailRepo = getRepository(UserEmailModel);
        const emailRepo = getRepository(EmailModel);
        const userRepo = getRepository(UserModel); // giả sử UserModel

        // Lấy senderId từ email truyền vào (nếu có)
        let senderId: string | undefined = undefined;
        if (searchDto.from) {
            const senderUser = await userRepo.whereEqualTo('email', searchDto.from).findOne();
            if (!senderUser) return [];
            senderId = senderUser.id;
        }

        // Query UserEmailModel theo userId + folder
        let userEmailQuery = userEmailRepo.whereEqualTo('userId', userId);
        if (folder !== 'all') {
            userEmailQuery = userEmailQuery.whereEqualTo('mainFolder', folder);
        }
        const userEmails = await userEmailQuery.find();
        if (userEmails.length === 0) return [];
        const emailIds = userEmails.map(ue => ue.emailId);

        // Query EmailModel theo emailIds, thêm filter senderId nếu có
        const batchSize = 10;
        let emails: EmailEntity[] = [];

        for (let i = 0; i < emailIds.length; i += batchSize) {
            const batchIds = emailIds.slice(i, i + batchSize);
            let emailsQuery = emailRepo.whereIn('id', batchIds);

            if (senderId) {
            emailsQuery = emailsQuery.whereEqualTo('senderId', senderId);
            }

            const batchEmails = await emailsQuery.find();
            emails = emails.concat(batchEmails);
        }

        // Filter các điều kiện còn lại thủ công như to, subject, keyword, hasAttachment
        const filtered = emails.filter(email => {
            if (searchDto.to) {
                const hasTo = email.recipients.some(r => r.recipientType === 'to' && r.recipientId === searchDto.to);
                if (!hasTo) return false;
            }
            if (searchDto.subject) {
                if (!email.subject?.toLowerCase().includes(searchDto.subject.toLowerCase())) return false;
            }
            if (searchDto.keyword) {
                if (!email.body?.toLowerCase().includes(searchDto.keyword.toLowerCase())) return false;
            }
            if (searchDto.hasAttachment) {
                const wantHasAttachment = searchDto.hasAttachment.toLowerCase() === 'true';
                const hasAttachment = email.attachments && email.attachments.length > 0;
                if (wantHasAttachment !== hasAttachment) return false;
            }
            return true;
        });

        return filtered;
    }
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
