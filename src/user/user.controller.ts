import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';


@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get()
    async getAllUser(){
        const users = await this.userService.findAll();

        return {
            statusCode: 200,
            msg: "Get All Users Succesfully",
            metadata: users
        };
    }
}
