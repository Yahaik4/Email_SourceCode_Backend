import { Body, Controller, Get, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from 'src/firebase/firebase.service';
import { getUserIdFromToken } from 'src/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';

@Controller('users')
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly firebaseService: FirebaseService
    ){}

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

    @Post('email')
    async getUserByEmail(@Body('email') email: string, @Res() res: Response) {
        try {
            if (!email) {
                return res.status(400).json({
                    statusCode: 400,
                    msg: "Email is required in request body",
                    metadata: false
                });
            }
            const user = await this.userService.findUserByEmail(email);
            if (!user) {
                return res.status(404).json({
                    statusCode: 404,
                    msg: "User not found",
                    metadata: false
                });
            }
            return res.status(200).json({
                statusCode: 200,
                msg: "Get User by Email Successfully",
                metadata: user
            });
        } catch (error) {
            return res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get User by Email Failed",
                metadata: false
            });
        }
    }


    @Post('update-profile')
    @UseInterceptors(
        FileInterceptor('avatar', {
          fileFilter: (req, file, cb) => {
            if (!file.mimetype.match(/^image\/(png|jpg|jpeg|webp)$/)) {
              return cb(new Error('Only image files are allowed (png, jpg, jpeg, webp)!'), false);
            }
            cb(null, true);
          },
          limits: {
            fileSize: 5 * 1024 * 1024, // giới hạn file 5MB
          },
        })
    )
    async updateProfile(
        @UploadedFile() file: Express.Multer.File, 
        @Body() user: UpdateUserDto, 
        @Res() res: Response,
        @Req() req: Request
    ){
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                if(file){
                    const fileUpload = await this.firebaseService.uploadFile(file);
                    user.avatar = fileUpload;
                }
    
                const updated = await this.userService.updateUser(user, userId)
    
                return res.status(200).json({
                    statusCode: 200,
                    msg: 'Update Profile Successfully',
                    metadata: updated,
                });
            }

        }catch(error){
            return res.status(400).json({
                statusCode: 400,
                msg: error.message || "Update Users Faild",
                metadata: false
            });
        }
    }
}
