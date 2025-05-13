import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { getRepository } from 'fireorm';
import { EmailEntity, EmailModel } from './email.entity';
import * as admin from "firebase-admin"; 

@Injectable()
export class EmailRepository {

    private emailRepository = getRepository(EmailModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async findEmailsById(id: string): Promise<EmailEntity> {
        return await this.emailRepository.findById(id);
    }

    async findEmailSender(userId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.whereEqualTo('senderId', userId).orderByDescending('createdAt').find();
    }

    async findEmailRerecipient(userId: string): Promise<EmailEntity[]>{
        return await this.emailRepository.whereEqualTo('recipientIds', userId).orderByDescending('createdAt').find();
    }

    async createEmail(email: Omit<EmailEntity, 'id'>): Promise<EmailEntity>{
        return await this.emailRepository.create({ ...email, 
                                                    createdAt: admin.firestore.Timestamp.now(),
                                                    updatedAt: admin.firestore.Timestamp.now(),
                                                });
    }

}
