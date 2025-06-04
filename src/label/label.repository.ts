import { Injectable } from '@nestjs/common';
import { getRepository } from 'fireorm';
import { LabelModel, LabelEntity } from './label.entity';
import * as admin from 'firebase-admin';
import { CustomException } from '../common/exceptions/custom.exception';
import { EmailRepository } from '../email/email.repository';
import { EmailWithStatus } from '../email/email.entity';

@Injectable()
export class LabelRepository {
  private labelRepository = getRepository(LabelModel);

  constructor(private readonly emailRepository: EmailRepository) {}

  async createLabel(labelName: string, userId: string): Promise<LabelEntity> {
    const existingLabel = await this.labelRepository
      .whereEqualTo('userId', userId)
      .whereEqualTo('labelName', labelName)
      .findOne();

    if (existingLabel) {
      throw new CustomException('Label already exists');
    }

    const label = new LabelModel();
    label.labelName = labelName;
    label.userId = userId;
    label.emailIds = [];
    label.createdAt = admin.firestore.Timestamp.now();

    return await this.labelRepository.create(label);
  }

  async findLabelByNameAndUser(labelName: string, userId: string): Promise<LabelEntity | null> {
    return await this.labelRepository
      .whereEqualTo('userId', userId)
      .whereEqualTo('labelName', labelName)
      .findOne();
  }

  async findAllLabelsByUserId(userId: string): Promise<LabelEntity[]> {
    return await this.labelRepository
      .whereEqualTo('userId', userId)
      .orderByAscending('createdAt')
      .find();
  }

  async getEmailsByLabel(labelName: string, userId: string): Promise<EmailWithStatus[]> {
    const label = await this.findLabelByNameAndUser(labelName, userId);
    if (!label) {
      throw new CustomException('Label does not exist');
    }

    const emails: EmailWithStatus[] = [];
    for (const emailId of label.emailIds) {
      const email = await this.emailRepository.findEmailById(emailId, userId);
      if (email) {
        emails.push(email);
      } else {
        console.warn(`Email with ID ${emailId} not found or not accessible by user ${userId}`);
      }
    }

    return emails;
  }

  async addEmailsToLabel(labelName: string, userId: string, emailIds: string[]): Promise<LabelEntity> {
    const label = await this.findLabelByNameAndUser(labelName, userId);
    if (!label) {
      throw new CustomException('Label does not exist');
    }

    const updatedEmailIds = Array.from(new Set([...label.emailIds, ...emailIds]));
    label.emailIds = updatedEmailIds;

    return await this.labelRepository.update(label);
  }

  async removeEmailsFromLabel(labelName: string, userId: string, emailIds: string[]): Promise<LabelEntity> {
    const label = await this.findLabelByNameAndUser(labelName, userId);
    if (!label) {
      throw new CustomException('Label does not exist');
    }

    label.emailIds = label.emailIds.filter(id => !emailIds.includes(id));

    return await this.labelRepository.update(label);
  }

  async deleteLabel(labelName: string, userId: string): Promise<boolean> {
    const label = await this.findLabelByNameAndUser(labelName, userId);
    if (!label) {
      throw new CustomException('Label does not exist');
    }

    await this.labelRepository.delete(label.id);
    return true;
  }
}