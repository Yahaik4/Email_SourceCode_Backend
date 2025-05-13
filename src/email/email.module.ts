import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailRepository } from './email.repository';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [EmailRepository ,EmailService],
  controllers: [EmailController]
})
export class EmailModule {}
