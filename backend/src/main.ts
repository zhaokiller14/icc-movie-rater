import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for HTTP requests
  app.enableCors({
    origin: [
      'https://icc-movie-rating-frontend.azurewebsites.net',
      'http://localhost:4200'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
  
  // Use WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Set global prefix for API routes
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();