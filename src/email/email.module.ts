import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailRepository } from './email.repository';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from 'src/firebase/firebase.service';
import { EmailGateway } from './email.gateway';
import { AuthRepository } from 'src/auth/auth.repository'; // Import AuthRepository

@Module({
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailRepository,
    JwtService,
    FirebaseService,
    EmailGateway,
    AuthRepository, // Thêm AuthRepository vào providers
  ],
})
export class EmailModule {}