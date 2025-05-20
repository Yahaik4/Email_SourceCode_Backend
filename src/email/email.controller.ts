import { Body, Controller, Delete, Param, Post, Query, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { EmailService } from './email.service';
import { Get, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { getUserIdFromToken } from 'src/utils/jwt.util';
import { JwtService } from '@nestjs/jwt';
import { CreateEmailDto } from './dto/create-email.dto';
import { Attachment, RecipientData } from './email.entity';
import { FirebaseService } from 'src/firebase/firebase.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UpdateEmailDto } from './dto/update-email.dto';
import { SendEmailDto } from './dto/send-email.dto';
import { customLabelDto } from './dto/customLabel.dto';
import { SearchEmailDto } from './dto/search-email.dto';
import { EmailRepository } from './email.repository';

@Controller('email')
export class EmailController {
    constructor(
        private readonly emailService: EmailService,
        private readonly jwtService: JwtService,
        private readonly firebaseService: FirebaseService,
        private readonly emailRository: EmailRepository
    ){}


    @Get('getAllEmail')
    async getAllEmailOfLabel(@Req() req, @Res() res: Response, @Query('label') label: string,) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                return res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailRository.getAllEmailOfLabel(label, userId);
                
                return res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            return res.status(400).json({
                statusCode: 400,
                msg: "Get All Email Starred Faild",
                metadata: false
            });
        }
    }

    @Get('/:id')
    async findEmailById(@Req() req, @Res() res: Response, @Param('id') emailId: string){
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findEmailById(emailId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get Email Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get Email Faild",
                metadata: false
            });
        }
    }

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
                msg: "Get All Email Rerecipient Faild",
                metadata: false
            });
        }
    }

    @Get()
    async getAllEmailByFolder(@Req() req, @Res() res: Response, @Query('folder') folder: string) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findEmailByFolder(folder, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Successfully",
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

    @Get('starred')
    async getAllEmailStarred(@Req() req, @Res() res: Response) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const emails = await this.emailService.findAllEmailStarred(userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Get All Emails Successfully",
                    metadata: emails
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Get All Email Starred Faild",
                metadata: false
            });
        }
    }

    @Post('saveDraft')
    @UseInterceptors(FilesInterceptor('attachments'))
    async saveDraft(
        @UploadedFiles() files: Express.Multer.File[], 
        @Body() emailDto: CreateEmailDto, 
        @Req() req, @Res() res: Response) 
    {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);

            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const attachments: Attachment[] = [];
                if(files && files.length > 0){
                    for(const file of files){
                        const upload = await this.firebaseService.uploadAttachment(file);
                        attachments.push(upload);
                    }
                }
                if(emailDto.recipients != null && Array.isArray(emailDto.recipients)){
                    const validRecipients: RecipientData[] = [];

                    for(const recipient of emailDto.recipients){
                        const recipientId = await this.emailService.findUserIdByUserEmail(recipient.recipientId);

                        if(recipientId){
                            validRecipients.push({
                                recipientId: recipientId,
                                recipientType: recipient.recipientType
                            })
                        }
                    }

                    emailDto.recipients = validRecipients;
                }
                emailDto.attachments = attachments;
                const newEmailDraft = await this.emailService.createEmailDraft(emailDto, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Create Email Draft Successfully",
                    metadata: newEmailDraft
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


    @Post('updateDraft')
    @UseInterceptors(FilesInterceptor('attachments'))
    async updateDraft(
        @UploadedFiles() files: Express.Multer.File[], 
        @Body() emailDto: UpdateEmailDto, 
        @Req() req, @Res() res: Response) 
    {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);

            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const attachments: Attachment[] = [];
                if(files && files.length > 0){
                    for(const file of files){
                        const upload = await this.firebaseService.uploadAttachment(file);
                        attachments.push(upload);
                    }
                }
                if(emailDto.recipients != null && Array.isArray(emailDto.recipients)){
                    const validRecipients: RecipientData[] = [];

                    for(const recipient of emailDto.recipients){
                        const recipientId = await this.emailService.findUserIdByUserEmail(recipient.recipientId);

                        if(recipientId){
                            validRecipients.push({
                                recipientId: recipientId,
                                recipientType: recipient.recipientType
                            })
                        }
                    }

                    emailDto.recipients = validRecipients;
                }
                emailDto.attachments = attachments;
                const newEmailDraft = await this.emailService.updateEmailDraft(emailDto);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Create Email Draft Successfully",
                    metadata: newEmailDraft
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


    @Post('sent')
    async sendEmail(
        @Body() sendEmailDto: SendEmailDto,
        @Req() req, @Res() res: Response)
    {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);

            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const send = await this.emailService.sendEmail(sendEmailDto.id);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Send Email Successfully",
                    metadata: send
                });  
            }
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Sent Email Faild",
                metadata: false
            });
        }
    }

    @Post('creatAndSendEmail')
    @UseInterceptors(FilesInterceptor('attachments'))
    async creatAndSendEmail(
        @UploadedFiles() files: Express.Multer.File[], 
        @Body() emailDto: CreateEmailDto,
        @Req() req, @Res() res: Response)
    {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);

            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const attachments: Attachment[] = [];
                if(files && files.length > 0){
                    for(const file of files){
                        const upload = await this.firebaseService.uploadAttachment(file);
                        attachments.push(upload);
                    }
                }
                if(emailDto.recipients != null && Array.isArray(emailDto.recipients)){
                    const validRecipients: RecipientData[] = [];

                    for(const recipient of emailDto.recipients){
                        const recipientId = await this.emailService.findUserIdByUserEmail(recipient.recipientId);

                        if(recipientId){
                            validRecipients.push({
                                recipientId: recipientId,
                                recipientType: recipient.recipientType
                            })
                        }
                    }

                    emailDto.recipients = validRecipients;
                }
                emailDto.attachments = attachments;
                const send = await this.emailService.createAndSendEmail(emailDto, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Send Email Successfully",
                    metadata: send
                });  
            }
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Sent Email Faild",
                metadata: false
            });
        }
    }

    @Post('moveToTrash')
    async moveToTrash(
        @Body() sendEmailDto: SendEmailDto,
        @Req() req, @Res() res: Response)
    {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);

            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const send = await this.emailService.moveToTrash(sendEmailDto.id, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Move to Trash Successfully",
                    metadata: send
                });  
            }
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Move to Trash Faild",
                metadata: false
            });
        }
    }

    @Delete('/:id')
    async deleteEmail(@Req() req, @Res() res: Response, @Param('id') emailId: string) {
        try{
            console.log(emailId);
            
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const result = await this.emailService.deleteEmail(emailId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Delete Emails Successfully",
                    metadata: result
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Delete Email Faild",
                metadata: false
            });
        }
    }

    @Post('/readEmail')
    async readEmail(@Req() req, @Res() res: Response, @Body() emailId: SendEmailDto) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const read = await this.emailService.updateReadEmail(emailId.id, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "Read Emails Successfully",
                    metadata: read
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "Read Email Faild",
                metadata: false
            });
        }
    }

    @Post('/customLabel')
    async customLabel(@Req() req, @Res() res: Response, @Body() customLabelDto: customLabelDto) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const customLabel = await this.emailService.customLabel(customLabelDto.emailIds, userId, customLabelDto.label);

                res.status(200).json({
                    statusCode: 200,
                    msg: "customLabel Successfully",
                    metadata: customLabel
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "customLabel Faild",
                metadata: false
            });
        }
    }

    @Post('/removeLabel')
    async removeLabel(@Req() req, @Res() res: Response, @Body() removeLabelDto: SearchEmailDto) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const customLabel = await this.emailService.removeLabel(userId, removeLabelDto.keyword);

                res.status(200).json({
                    statusCode: 200,
                    msg: "removeLabel Successfully",
                    metadata: customLabel
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "removeLabel Faild",
                metadata: false
            });
        }
    }

    @Post('/search')
    async searchEmailBySubjectOrLabel(@Req() req, @Res() res: Response, @Body() searchDto: SearchEmailDto) {
        try{
            const userId = getUserIdFromToken(req, this.jwtService);
            
            if(!userId){
                res.status(400).json({
                    statusCode: 400,
                    msg: "Invalid or missing token",
                    metadata: false
                });
            }else{
                const search = await this.emailService.searchEmailBySubjectOrLabel(searchDto.keyword, userId);

                res.status(200).json({
                    statusCode: 200,
                    msg: "search Successfully",
                    metadata: search
                });
            }    
        }catch(error){
            res.status(400).json({
                statusCode: 400,
                msg: error.message || "search Faild",
                metadata: false
            });
        }
    }

    

}
