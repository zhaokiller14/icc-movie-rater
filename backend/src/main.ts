import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ENABLE CORS with proper configuration
  app.enableCors({
    origin: [
      'https://icc-movie-rating-frontend.azurewebsites.net',
      'http://localhost:4200'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Allow-Headers'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 3600
  });
  
  // Set global prefix - IMPORTANT!
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Backend running on port ${port} with CORS enabled`);
}
bootstrap();