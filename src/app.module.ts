import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { LabelModule } from './label/label.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    FirebaseModule,
    UserModule,
    AuthModule,
    EmailModule,
    LabelModule
  ],
})
export class AppModule {}
