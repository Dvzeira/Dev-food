# 🍕 Dev Food — Sistema de Delivery

Aplicação full-stack de delivery inspirada no iFood, desenvolvida com **NestJS** no backend e **Next.js** no frontend.

## Demonstração

> **Backend (API):** [https://dev-food-backend.onrender.com](https://dev-food-backend.onrender.com)  
> **Frontend:** deploy no Vercel

---

## Funcionalidades

### Cliente
- Cadastro e login com autenticação JWT
- Navegação pelo catálogo com filtro por categoria
- Carrinho de compras persistido em localStorage
- Finalização de pedido com endereço de entrega
- Histórico de pedidos com acompanhamento de status em tempo real

### Admin
- Dashboard com visão geral dos pedidos
- CRUD completo de categorias e produtos
- Gerenciamento de todos os pedidos com atualização de status

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend | NestJS 11 + TypeScript |
| ORM | TypeORM |
| Banco de dados | PostgreSQL 16 |
| Autenticação | JWT (Passport) |
| Validação | class-validator + class-transformer |
| Frontend | Next.js 16 + React 19 |
| Estilo | Tailwind CSS 4 |
| Estado global | Zustand |
| Formulários | react-hook-form + Zod |
| HTTP Client | Axios |
| Infra | Docker (local) · Render (backend) · Vercel (frontend) |

---

## Arquitetura

```
Dev_food/
├── backend/          ← API REST (porta 3001)
│   └── src/
│       ├── auth/         → registro, login, JWT strategy
│       ├── users/        → entidade e serviço de usuários
│       ├── categories/   → CRUD de categorias
│       ├── products/     → CRUD de produtos
│       ├── orders/       → criação e gestão de pedidos
│       └── common/       → guards, decorators, enums, filtros
└── frontend/         ← App Next.js (porta 3000)
    └── app/
        ├── login / register
        ├── home / checkout / orders
        └── admin/ (dashboard, categories, products, orders)
```

---

## Como rodar localmente

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose

### 1. Clone o repositório

```bash
git clone https://github.com/Dvzeira/Dev-food.git
cd Dev-food
```

### 2. Suba o banco de dados

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run start:dev
```

O backend estará disponível em `http://localhost:3001`.

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# edite .env.local: NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

### 5. Popular o banco (opcional)

```bash
cd backend
npx ts-node src/seed.ts
```

Cria um usuário admin, um cliente e alguns produtos de exemplo:
- **Admin:** `admin@devfood.com` / `senha123`
- **Cliente:** `cliente@devfood.com` / `senha123`

---

## Variáveis de Ambiente

**`backend/.env`**
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=devfood
DATABASE_PASSWORD=devfood123
DATABASE_NAME=devfood_db
JWT_SECRET=troque-em-producao
JWT_EXPIRES_IN=7d
PORT=3001
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Decisões de Design

**Preço nunca vem do cliente** — o `CreateOrderDto` aceita apenas `productId` e `quantity`. O `OrdersService` busca os preços no banco, impedindo que um usuário mal-intencionado manipule valores.

**Snapshot de preço no `OrderItem`** — o campo `unitPrice` armazena o preço no momento do pedido. Atualizações futuras de preço não afetam o histórico.

**Senha com `select: false`** — o campo `password` da entidade `User` nunca é retornado por queries padrão, apenas quando explicitamente solicitado (no login).

**Erro genérico no login** — "Credenciais inválidas" tanto para email inexistente quanto para senha errada, evitando enumeração de usuários.

---

## Licença

MIT
