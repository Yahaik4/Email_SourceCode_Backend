import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';

@Module({
  providers: [UserRepository, UserService],
  controllers: [UserController]
})
export class UserModule {}
