# Dev_food

Sistema de delivery inspirado no iFood, desenvolvido como projeto de portfólio para demonstrar domínio de NestJS (backend) e React/Next.js (frontend).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS + TypeScript |
| Banco de dados | PostgreSQL (via Docker) |
| ORM | TypeORM |
| Frontend | Next.js 14+ (App Router) + React |
| Estilização | Tailwind CSS + shadcn/ui |

## Fluxos da aplicação

### Admin
- Cadastrar, editar e excluir **categorias**
- Cadastrar, editar e excluir **produtos**
- Visualizar todos os **pedidos**
- Alterar o **status dos pedidos**

### Customer
- Criar conta e fazer login
- Visualizar produtos (filtro por categoria)
- Adicionar produtos ao carrinho e fazer pedidos
- Visualizar histórico de pedidos e acompanhar status

## Estrutura do monorepo

```
Dev_food/
├── CLAUDE.md
├── docker-compose.yml       ← PostgreSQL local
├── backend/                 ← NestJS REST API (porta 3001)
│   └── CLAUDE.md
└── frontend/                ← Next.js (porta 3000)
    └── CLAUDE.md
```

## Como rodar o projeto

```bash
# 1. Subir o banco de dados
docker-compose up -d

# 2. Backend
cd backend
npm install
npm run start:dev

# 3. Frontend
cd frontend
npm install
npm run dev
```

## Variáveis de ambiente

**`backend/.env`**
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=devfood
DATABASE_PASSWORD=devfood123
DATABASE_NAME=devfood_db
JWT_SECRET=change-in-production
JWT_EXPIRES_IN=7d
PORT=3001
```

**`frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Boas práticas gerais

- Nunca commitar arquivos `.env` (apenas `.env.example`)
- Toda mutação de dados passa pelo backend — o frontend nunca calcula preços
- Autenticação via JWT Bearer token; roles: `ADMIN` e `CUSTOMER`
- Código em inglês; commits em português ou inglês (consistência no projeto)
