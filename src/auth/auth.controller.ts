import { Body, Controller, Param, Post, Put, Req, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { generateToken } from 'src/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change_password.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService
    ){}

    @Post('login')
    async login(@Body() user: LoginDto, @Res({ passthrough: true }) res: Response) {
        try {
            const userData = await this.authService.login(user);

            const token = generateToken(res, this.jwtService, {
                id: userData.id,
                email: userData.email
            });
    
            res.status(200).json({
                statusCode: 200,
                msg: "Login Successfully",
                token: token,
                metadata: true
            });
        } catch(error) {
            res.status(400).json({
                statusCode: 400,
                msg: error.message || 'Login Failed',
                metadata: false
            });
        }
    }

    @Put(':id/password')
    async changePassword(
        @Param('id') id: string,
        @Body() changePasswordDto: ChangePasswordDto,
        @Res() res: Response
    ) {
        try {
            await this.authService.changePassword(id, changePasswordDto.password);
            res.status(200).json({
                statusCode: 200,
                msg: "Password changed successfully",
                metadata: true
            });
        } catch (error) {
            res.status(400).json({
                statusCode: 400,
                msg: error.message || 'Failed to change password',
                metadata: false
            });
        }
    }

    //Đổi thành bearer token để chạy đa nền tảng nha sv Huy
    @Post('signout')
        async signout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1]; // Bearer <token>

            if (!token) {
            return res.status(400).json({
                statusCode: 400,
                msg: 'No token provided',
                metadata: false,
            });
            }

            res.clearCookie('token'); // vẫn xóa cookie nếu có

            return res.status(200).json({
            statusCode: 200,
            msg: 'Logout Successfully',
            metadata: true,
            });
        } catch (error) {
            return res.status(400).json({
            statusCode: 400,
            msg: error.message || 'Logout Failed',
            metadata: false,
            });
        }
    }

    @Post('register')
    async register(@Body() user: RegisterDto, @Res() res: Response)
    {
        try{
            const newUser = await this.authService.register(user);
            
            res.status(200).json({
                statusCode: 200,
                msg: "Register Succesfully",
                metadata: newUser
            });
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message,
                metadata: false
            });
        }
    }

}
