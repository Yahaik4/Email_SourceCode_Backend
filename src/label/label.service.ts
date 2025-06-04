import { Injectable } from '@nestjs/common';
import { LabelRepository } from './label.repository';
import { LabelEntity } from './label.entity';
import { CreateLabelDto, AddEmailsToLabelDto, RemoveEmailsFromLabelDto } from './dto/label.dto';
import { EmailWithStatus } from 'src/email/email.entity';

@Injectable()
export class LabelService {
  constructor(private readonly labelRepository: LabelRepository) {}

  async createLabel(dto: CreateLabelDto, userId: string): Promise<LabelEntity> {
    return await this.labelRepository.createLabel(dto.labelName, userId);
  }

  async getAllLabelsByUserId(userId: string): Promise<LabelEntity[]> {
    return await this.labelRepository.findAllLabelsByUserId(userId);
  }

  async addEmailsToLabel(dto: AddEmailsToLabelDto, userId: string): Promise<LabelEntity> {
    return await this.labelRepository.addEmailsToLabel(dto.labelName, userId, dto.emailIds);
  }

  async removeEmailsFromLabel(dto: RemoveEmailsFromLabelDto, userId: string): Promise<LabelEntity> {
    return await this.labelRepository.removeEmailsFromLabel(dto.labelName, userId, dto.emailIds);
  }

  async getEmailsByLabel(labelName: string, userId: string): Promise<EmailWithStatus[]> {
    return await this.labelRepository.getEmailsByLabel(labelName, userId);
  }

  async deleteLabel(labelName: string, userId: string): Promise<boolean> {
    return await this.labelRepository.deleteLabel(labelName, userId);
  }
}