import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // Bật validation toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại bỏ các field không khai báo trong DTO
      forbidNonWhitelisted: true, // nếu có field lạ sẽ báo lỗi
      transform: true // tự động transform kiểu dữ liệu nếu có thể
    })
  )

  app.enableCors({
    origin: 'http://localhost:63030', // Thay port bằng cổng Flutter web (kiểm tra terminal khi chạy `flutter run -d chrome`, thường 5000-6000)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
