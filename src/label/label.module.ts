import { Module } from '@nestjs/common';
import { LabelRepository } from './label.repository';
import { FirebaseModule } from '../firebase/firebase.module';
import { LabelService } from './label.service';
import { LabelController } from './label.controller';
import { JwtService } from '@nestjs/jwt';
import { EmailRepository } from 'src/email/email.repository';

@Module({
  imports: [FirebaseModule],
  controllers: [LabelController],
  providers: [LabelService, LabelRepository, JwtService, EmailRepository],
  exports: [LabelService],
})
export class LabelModule {}