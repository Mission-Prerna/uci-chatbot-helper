import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth-jwt.guard';
import { JwtStrategy } from './auth-jwt.strategy';

@Module({
    imports: [],
    providers: [
      {
        provide: APP_GUARD,
        useClass: JwtAuthGuard,
      },
      JwtStrategy,
    ],
  })
export class AuthModule {}
