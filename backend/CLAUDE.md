# Backend — Dev_food

API REST construída com NestJS + TypeORM + PostgreSQL.

## Tecnologias

- **NestJS** — framework Node.js com injeção de dependência, decorators e módulos
- **TypeORM** — ORM com suporte a entidades TypeScript e migrations
- **PostgreSQL** — banco relacional (rodando via Docker)
- **Passport + JWT** — autenticação stateless com Bearer token
- **class-validator + class-transformer** — validação e transformação de DTOs
- **bcrypt** — hash de senhas

## Estrutura de módulos

```
src/
├── main.ts                   ← bootstrap, ValidationPipe global, CORS, filtro global
├── app.module.ts             ← raiz: importa ConfigModule, TypeOrmModule e todos os módulos
├── config/
│   ├── database.config.ts    ← TypeORM config carregada do .env
│   └── jwt.config.ts         ← JWT secret/expiresIn do .env
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts       ← @Roles(Role.ADMIN)
│   │   └── current-user.decorator.ts ← @CurrentUser() nos controllers
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        ← valida Bearer token
│   │   └── roles.guard.ts           ← verifica role do usuário autenticado
│   ├── enums/
│   │   ├── role.enum.ts             ← ADMIN | CUSTOMER
│   │   └── order-status.enum.ts    ← PENDING | CONFIRMED | PREPARING | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
│   └── filters/
│       └── http-exception.filter.ts ← resposta de erro padronizada
├── auth/                     ← registro, login, estratégia JWT
├── users/                    ← CRUD de usuários (admin) + perfil próprio
├── categories/               ← CRUD de categorias
├── products/                 ← CRUD de produtos + filtro por categoria
└── orders/                   ← criação e gestão de pedidos
```

## Padrão por módulo

Cada módulo segue a estrutura:
```
nome/
├── nome.module.ts
├── nome.controller.ts
├── nome.service.ts
├── entities/
│   └── nome.entity.ts
└── dto/
    ├── create-nome.dto.ts
    └── update-nome.dto.ts    ← usa PartialType(CreateNomeDto)
```

## Autenticação e autorização

- `POST /auth/register` e `POST /auth/login` são rotas públicas
- Rotas protegidas usam `@UseGuards(JwtAuthGuard)` ou `@UseGuards(JwtAuthGuard, RolesGuard)`
- Para restringir a admins: adicionar `@Roles(Role.ADMIN)` acima do guard
- O decorator `@CurrentUser()` injeta `{ sub, email, role }` diretamente no parâmetro do controller

Exemplo de uso:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Patch(':id/status')
updateStatus(
  @Param('id') id: string,
  @Body() dto: UpdateOrderStatusDto,
) {}
```

## Entidades e relacionamentos

```
User (1) ───< Order (N)
Category (1) ───< Product (N)
Order (1) ───< OrderItem (N) >─── Product (1)
```

**Regra importante:** `OrderItem.unitPrice` armazena o preço do produto **no momento do pedido**. Isso garante que o valor histórico do pedido não mude se o preço do produto for atualizado posteriormente.

## DTOs e validação

- Todo dado de entrada passa por um DTO com decorators do `class-validator`
- `ValidationPipe` com `whitelist: true` e `forbidNonWhitelisted: true` no `main.ts`
- Nunca confiar no preço enviado pelo cliente — o `OrdersService` busca o preço diretamente no banco

## Boas práticas NestJS aplicadas neste projeto

- Módulos coesos: cada módulo encapsula sua entidade, controller, service e DTOs
- Services são injetáveis e não acessam `Request`/`Response` diretamente
- Controllers são finos: apenas recebem, validam (via pipes) e delegam ao service
- Guards são globais ou aplicados por controller/rota, nunca lógica de auth no service
- Respostas de erro padronizadas via `HttpExceptionFilter` global
- `ConfigModule.forRoot()` com `isGlobal: true` para acesso ao `.env` em qualquer módulo
- `synchronize: true` apenas em desenvolvimento; em produção usar migrations

## Endpoints resumidos

| Módulo | Método | Rota | Acesso |
|--------|--------|------|--------|
| Auth | POST | `/auth/register` | Público |
| Auth | POST | `/auth/login` | Público |
| Auth | GET | `/auth/me` | JWT |
| Categories | GET | `/categories` | Público |
| Categories | POST/PATCH/DELETE | `/categories[/:id]` | ADMIN |
| Products | GET | `/products` | Público |
| Products | GET | `/products/:id` | Público |
| Products | POST/PATCH/DELETE | `/products[/:id]` | ADMIN |
| Orders | POST | `/orders` | CUSTOMER |
| Orders | GET | `/orders/my` | CUSTOMER |
| Orders | GET | `/orders` | ADMIN |
| Orders | GET | `/orders/:id` | JWT |
| Orders | PATCH | `/orders/:id/status` | ADMIN |

## Scripts

```bash
npm run start:dev    # desenvolvimento com hot reload
npm run build        # compilar para produção
npm run start:prod   # rodar build de produção
npm run test         # testes unitários
npm run test:e2e     # testes end-to-end
```
