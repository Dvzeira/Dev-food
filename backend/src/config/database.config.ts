import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => {
    const synchronize =
      process.env.DB_SYNCHRONIZE === 'true' ||
      process.env.NODE_ENV !== 'production';

    // Render fornece DATABASE_URL; localmente usamos as variáveis individuais
    if (process.env.DATABASE_URL) {
      return {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize,
        autoLoadEntities: true,
      };
    }

    return {
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT ?? '5432'),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      synchronize,
      autoLoadEntities: true,
    };
  },
);
