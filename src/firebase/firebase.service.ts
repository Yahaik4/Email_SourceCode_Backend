import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { Attachment } from 'src/email/email.entity';

@Injectable()
export class FirebaseService {
  private storage = admin.storage().bucket();

  /**
   * Upload file lên Firebase Storage
   * @param file - file được gửi lên (từ Multer)
   * @param folder - thư mục con muốn lưu (ví dụ: 'avatars')
   * @returns URL công khai để truy cập ảnh
   */
  async uploadFile(file: Express.Multer.File, folder = 'uploads'): Promise<string> {
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
    const fileUpload = this.storage.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
      public: true, // Cho phép truy cập công khai
    });

    // URL công khai của ảnh
    return `https://storage.googleapis.com/${this.storage.name}/${fileName}`;
  }

  async uploadAttachment(file: Express.Multer.File, folder = 'attachment'): Promise<Attachment> {
    const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
    const fileUpload = this.storage.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
      },
    });

    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    return {
      fileName: file.originalname,
      fileUrl: url,
      mimeType: file.mimetype,
      size: file.size
    }
  }
}
