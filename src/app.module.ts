import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [
    TerminusModule,
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    HttpModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, PrismaClient],
})
export class AppModule {}
