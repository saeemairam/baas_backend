import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module.js';

@Module({
  imports: [
    // isGlobal: true = every module can read config without importing it again
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
