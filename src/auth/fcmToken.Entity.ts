import { Collection } from 'fireorm';

@Collection('FcmToken')
export class FcmTokenModel{
    id!: string;
    token!: string;
    updatedAt!: Date;
}
