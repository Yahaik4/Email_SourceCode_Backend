import { Collection } from "fireorm";
import * as admin from "firebase-admin"; 

type RecipientData = {
    recipientId: string;
    recipientType: 'to' | 'cc' | 'bcc';
    isRead: boolean;
};

type Attachment = {
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
    isStarred!: boolean;
    folder!: "inbox" | "sent" | "draft" | "starred";
    recipientIds!: string[]; 
    recipients!: RecipientData[];
    attachments!: Attachment[];
    createdAt!: admin.firestore.Timestamp;
    updatedAt!: admin.firestore.Timestamp;
}

export type EmailEntity = {
    id: string;
    senderId: string;
    subject: string;
    body: string;
    isDraft: boolean;
    isStarred: boolean;
    folder: "inbox" | "sent" | "draft" | "starred";
    recipientIds: string[]; 
    recipients: RecipientData[]; 
    attachments: Attachment[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
};
