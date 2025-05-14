import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { generateToken } from 'src/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

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

            generateToken(res, this.jwtService, {
                id: userData.id,
                email: userData.email
            });
    
            res.status(200).json({
                statusCode: 200,
                msg: "Login Successfully",
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

    @Post('signout')
    async signout(@Res({ passthrough: true }) res: Response, @Req() req: Request)
    {
        try{
            const token = req.cookies?.token;

            if(!token){
                res.status(400).json({
                    statusCode: 400,
                    msg: 'No token found',
                    metadata: false
                });
            }
            res.clearCookie('token');

            res.status(200).json({
                statusCode: 200,
                msg: 'Logout Successfully',
                metadata: true,
            });
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || 'LogOut Faild',
                metadata: false
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
