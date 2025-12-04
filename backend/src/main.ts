import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get frontend URL - use exact Azure URL
  const frontendUrl = 'https://icc-movie-rating-backend.azurewebsites.net';
  
  // ENABLE CORS with exact URL
  app.enableCors({
    origin: frontendUrl,  // Single string, not array
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 3600
  });
  
/*   // Set global prefix
  app.setGlobalPrefix('api');
   */
  // IMPORTANT: Use Azure's port (8080), not 3000
  const port = process.env.PORT || 8080;
  await app.listen(port);
  console.log(`Backend running on port ${port} with CORS enabled for ${frontendUrl}`);
}
bootstrap();