import { Collection } from "fireorm";
import * as admin from "firebase-admin"; 

export type RecipientData = {
    recipientId: string;
    recipientType: 'to' | 'cc' | 'bcc';
};

export type Attachment = {
    fileName: string;
    fileUrl: string;
    mimeType: string;
    size?: number;
};

@Collection('emails')
export class EmailModel{
    id!: string;
    senderId!: string;
    subject!: string;
    body!: string;
    isDraft!: boolean;
    recipients!: RecipientData[];
    attachments!: Attachment[];
    createdAt!: admin.firestore.Timestamp;
    updatedAt!: admin.firestore.Timestamp;

    replyToEmailId?: string;
}

export type EmailWithStatus = EmailEntity & {
  isStarred: boolean;
  isRead: boolean;
};

export type EmailEntity = {
    id: string;
    senderId: string;
    subject: string;
    body: string;
    isDraft: boolean;
    recipients: RecipientData[]; 
    attachments: Attachment[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;

    replyToEmailId?: string;
};

@Collection('UserEmailModel')
export class UserEmailModel{
    id!: string;
    userId!: string;
    emailId!: string;
    mainFolder!: "inbox" | "sent" | "draft" | "trash";
    isStarred!: boolean;
    isRead!: boolean;
    customLabels!: string[]; 
}

export type UserEmailEntity = {
    id: string;
    userId: string;
    emailId: string;
    mainFolder: "inbox" | "sent" | "draft" | "trash";
    isStarred: boolean;
    isRead: boolean;
    customLabels: string[]; 
}


