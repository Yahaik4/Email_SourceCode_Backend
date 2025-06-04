import { Collection, getRepository } from 'fireorm';
import * as admin from 'firebase-admin';

@Collection('Labels')
export class LabelModel {
  id: string;
  labelName: string;
  userId: string;
  emailIds: string[];
  createdAt: admin.firestore.Timestamp;
}

export interface LabelEntity {
  id: string;
  labelName: string;
  userId: string;
  emailIds: string[];
  createdAt: admin.firestore.Timestamp;
}