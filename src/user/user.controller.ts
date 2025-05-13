import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request, Response } from 'express';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService){}

    @Get()
    async getAllUser(@Res() res: Response) {
        try{
            const users = await this.userService.findAll();

            return res.status(200).json({
                statusCode: 200,
                msg: "Get All Users Succesfully",
                metadata: users
            });
        }catch(error){
            return res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get All Users Faild",
                metadata: false
            });
        }
    }

    @Post()
    async updateProfile(@Body() user: UpdateUserDto, @Res() res: Response){
        try{
            const updated = await this.userService.updateUser(user)

            return res.status(200).json({
                statusCode: 200,
                msg: 'Update Profile Successfully',
                metadata: updated,
            });
        }catch(error){
            return res.status(400).json({
                statusCode: 400,
                msg: error.message || "Update Users Faild",
                metadata: false
            });
        }

    }
}
