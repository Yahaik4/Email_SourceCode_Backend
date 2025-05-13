import { Controller, Post } from '@nestjs/common';
import { EmailService } from './email.service';
import { Get, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { getUserIdFromToken } from 'src/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';

@Controller('email')
export class EmailController {
    constructor(
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService
    ){}

    @Get('sent')
    async findAllSentEmails(@Req() req, @Res() res: Response) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findAllSentEmails(userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Sent Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get All Email Send Faild",
                metadata: false
            });
        }
    }


    @Get('rerecipient')
    async findAllRerecipientEmails(@Req() req, @Res() res: Response) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findAllRerecipientEmails(userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Rerecipient Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get All Email Rerecipient Faild",
                metadata: false
            });
        }
    }

    @Post('createEmail')
    async createEmail(@Req() req, @Res() res: Response) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findAllRerecipientEmails(userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Rerecipient Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get All Email Rerecipient Faild",
                metadata: false
            });
        }
    }
}
