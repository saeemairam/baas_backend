import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    // isGlobal: true = every module can read config without importing it again
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DATABASE_HOST'),
        port: Number(config.get('DATABASE_PORT')),
        database: config.get<string>('DATABASE_NAME'),
        username: config.get<string>('DATABASE_USER'),
        password: config.get<string>('DATABASE_PASSWORD'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
