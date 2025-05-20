import { Inject, Injectable } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { FcmTokenModel } from './fcmToken.Entity';
import { getRepository } from 'fireorm';

@Injectable()
export class FcmTokenRepository {
    
    private fcmTokenRepository = getRepository(FcmTokenModel);

    constructor(
        @Inject('FIRESTORE') private readonly firestore: Firestore
    ){}

    async saveToken(userId: string, fcmToken: string) {
        const existing = await this.fcmTokenRepository.findById(userId).catch(() => null);

        if (existing) {
            existing.token = fcmToken;
            existing.updatedAt = new Date();
            await this.fcmTokenRepository.update(existing);
        }else {
            const newToken = new FcmTokenModel();
            newToken.id = userId;
            newToken.token = fcmToken;
            newToken.updatedAt = new Date();
            await this.fcmTokenRepository.create(newToken);
        }
    }

}
