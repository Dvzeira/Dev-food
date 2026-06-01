import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './app.module';
import { User } from './users/entities/user.entity';
import { Role } from './common/enums/role.enum';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userRepo = app.get<Repository<User>>(getRepositoryToken(User));

  const existing = await userRepo.findOneBy({ email: 'admin@devfood.com' });

  if (!existing) {
    const admin = userRepo.create({
      name: 'Admin',
      email: 'admin@devfood.com',
      password: 'admin123',
      role: Role.ADMIN,
    });
    await userRepo.save(admin);
    console.log('✅ Admin criado: admin@devfood.com / admin123');
  } else {
    console.log('ℹ️  Admin já existe');
  }

  await app.close();
}

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
