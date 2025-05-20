import { Collection } from "fireorm";
import * as admin from 'firebase-admin'

export const DEFAULT_SETTINGS: Settings = {
    two_factor_enabled: false,
    notification_enabled: false,
    font_size: 14,
    font_family: "Roboto",
    theme: "Dark"
};

export type Settings = {
    two_factor_enabled: boolean,
    notification_enabled: boolean,
    font_size: number,
    font_family: string,
    theme: "Dark" | 'White'
}

@Collection('users')
export class UserModel{
    id!: string;
    username!: string;
    email!: string;
    password!: string;
    avatar!: string | null;
    phoneNumber!: string;
    setting!: Settings;
    createdAt!: admin.firestore.Timestamp;
    updateAt!: admin.firestore.Timestamp;
}

export type UserEntity = {
    id: string;
    username: string;
    email: string;
    password: string;
    avatar: string | null;
    phoneNumber: string; 
    setting: Settings;
    createdAt: admin.firestore.Timestamp;
    updateAt: admin.firestore.Timestamp;
};
