import { Body, Controller, Delete, Get, HttpStatus, Post, Req, Res, Param } from '@nestjs/common';
import { Response, Request } from 'express';
import { LabelService } from './label.service';
import { CreateLabelDto, AddEmailsToLabelDto, RemoveEmailsFromLabelDto } from './dto/label.dto';
import { getUserIdFromToken } from '../utils/jwt.util';
import { JwtService } from '@nestjs/jwt';

@Controller('label')
export class LabelController {
  constructor(
    private readonly labelService: LabelService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async createLabel(@Req() req: Request, @Res() res: Response, @Body() dto: CreateLabelDto) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const label = await this.labelService.createLabel(dto, userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Create Label Successfully',
        metadata: label,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Create Label Failed',
        metadata: false,
      });
    }
  }

  @Get()
  async getAllLabels(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const labels = await this.labelService.getAllLabelsByUserId(userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Get All Labels Successfully',
        metadata: labels,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Get All Labels Failed',
        metadata: false,
      });
    }
  }

  @Post('addEmail')
  async addEmailsToLabel(@Req() req: Request, @Res() res: Response, @Body() dto: AddEmailsToLabelDto) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const label = await this.labelService.addEmailsToLabel(dto, userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Add Emails to Label Successfully',
        metadata: label,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Add Emails to Label Failed',
        metadata: false,
      });
    }
  }

  @Get(':labelName/emails')
  async getEmailsByLabel(@Req() req: Request, @Res() res: Response, @Param('labelName') labelName: string) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const emails = await this.labelService.getEmailsByLabel(labelName, userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Get Emails by Label Successfully',
        metadata: emails,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Get Emails by Label Failed',
        metadata: false,
      });
    }
  }


  @Post('removeEmail')
  async removeEmailsFromLabel(@Req() req: Request, @Res() res: Response, @Body() dto: RemoveEmailsFromLabelDto) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const label = await this.labelService.removeEmailsFromLabel(dto, userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Remove Emails from Label Successfully',
        metadata: label,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Remove Emails from Label Failed',
        metadata: false,
      });
    }
  }

  @Delete(':labelName')
  async deleteLabel(@Req() req: Request, @Res() res: Response, @Param('labelName') labelName: string) {
    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (!userId) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          msg: 'Invalid or missing token',
          metadata: false,
        });
      }

      const result = await this.labelService.deleteLabel(labelName, userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        msg: 'Delete Label Successfully',
        metadata: result,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        msg: error.message || 'Delete Label Failed',
        metadata: false,
      });
    }
  }
}