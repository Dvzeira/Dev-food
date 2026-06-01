# Dev_food — Fluxo Admin: Guia Completo e Didático

> Público-alvo: desenvolvedor júnior aprendendo NestJS.
> Este documento explica **o quê**, **como** e **por quê** de cada decisão do projeto.

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Banco de Dados e Entidades](#2-banco-de-dados-e-entidades)
3. [Configuração e Bootstrap](#3-configuração-e-bootstrap)
4. [Sistema de Autenticação](#4-sistema-de-autenticação)
5. [Autorização por Roles](#5-autorização-por-roles)
6. [Fluxo Admin Completo Passo a Passo](#6-fluxo-admin-completo-passo-a-passo)
7. [DTOs e Validação](#7-dtos-e-validação)
8. [Decisões de Design Importantes](#8-decisões-de-design-importantes)

---

## 1. Visão Geral da Arquitetura

### O que é NestJS?

NestJS é um framework para construir aplicações backend em Node.js usando TypeScript. Ele foi fortemente inspirado no Angular e no Spring Boot (Java), trazendo conceitos como:

- **Injeção de Dependência (DI)**: classes não criam suas próprias dependências — elas as recebem prontas
- **Decorators**: anotações que adicionam comportamento a classes, métodos e parâmetros (ex: `@Controller`, `@Get`, `@Injectable`)
- **Módulos**: unidades organizacionais que agrupam funcionalidades relacionadas

Se você já usou Express puro, pense no NestJS como Express com estrutura, organização e convenções.

### A Pilha de Tecnologias do Dev_food

```
┌─────────────────────────────────────────────┐
│              Cliente (Frontend)             │
│              React — porta 3000             │
└────────────────────┬────────────────────────┘
                     │ HTTP (JSON)
                     ▼
┌─────────────────────────────────────────────┐
│              NestJS Backend                 │
│              porta 3001                     │
│                                             │
│  Controller → Service → Repository          │
└────────────────────┬────────────────────────┘
                     │ TypeORM (SQL)
                     ▼
┌─────────────────────────────────────────────┐
│              PostgreSQL                     │
│         (rodando via Docker)                │
└─────────────────────────────────────────────┘
```

### A Estrutura de Camadas (Controller → Service → Repository)

Esta é a espinha dorsal do projeto. Cada requisição HTTP percorre exatamente essas três camadas:

```
Requisição HTTP
      │
      ▼
┌──────────────┐
│  Controller  │  ← Recebe a requisição, extrai parâmetros, chama o Service
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │  ← Contém a lógica de negócio (regras, cálculos, validações)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │  ← Faz as queries no banco (fornecido pelo TypeORM)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │  ← Banco de dados relacional
└──────────────┘
```

**Por que essa separação existe?**

Cada camada tem uma única responsabilidade:
- O **Controller** nunca deve conter lógica de negócio. Ele é apenas o porteiro.
- O **Service** nunca deve conhecer detalhes de HTTP (Request, Response). Ele só conhece dados e regras.
- O **Repository** nunca deve conter lógica de negócio. Ele só sabe falar SQL.

Isso torna o código testável, manutenível e fácil de entender.

### A Estrutura de Módulos

Cada funcionalidade do sistema é encapsulada em um módulo NestJS:

```
AppModule (raiz)
├── AuthModule      → /auth/register, /auth/login, /auth/me
├── UsersModule     → gerenciamento de usuários
├── CategoriesModule → /categories (CRUD)
├── ProductsModule  → /products (CRUD)
└── OrdersModule    → /orders (CRUD + status)
```

Um módulo NestJS é uma classe decorada com `@Module()` que declara:
- **imports**: outros módulos que este módulo precisa
- **providers**: services, strategies e outros injetáveis
- **controllers**: os controllers deste módulo
- **exports**: o que este módulo disponibiliza para outros módulos

---

## 2. Banco de Dados e Entidades

### O que é uma Entidade?

Uma entidade é uma classe TypeScript que mapeia diretamente para uma tabela no banco de dados. O TypeORM lê os decorators da classe e cria (ou sincroniza) a tabela automaticamente.

### Diagrama de Relacionamentos

```
┌──────────────┐         ┌──────────────┐
│    users     │         │  categories  │
│──────────────│         │──────────────│
│ id (PK)      │         │ id (PK)      │
│ name         │         │ name         │
│ email        │         │ description  │
│ password     │         │ imageUrl     │
│ role         │         │ createdAt    │
│ createdAt    │         │ updatedAt    │
│ updatedAt    │         └──────┬───────┘
└──────┬───────┘                │ 1
       │ 1                      │
       │                        │ N
       │ N            ┌─────────┴──────────┐
       │              │      products       │
       │              │────────────────────│
       │              │ id (PK)            │
       │              │ name               │
       │              │ description        │
       │              │ price              │
       │              │ imageUrl           │
       │              │ isAvailable        │
       │              │ categoryId (FK)    │
       │              │ createdAt          │
       │              │ updatedAt          │
       │              └──────────┬─────────┘
       │                         │
       ▼                         │ referenciado por
┌──────────────┐                 │
│    orders    │                 │
│──────────────│                 │
│ id (PK)      │                 │
│ status       │                 │
│ totalPrice   │                 │
│ deliveryAddr │                 │
│ customerId   │◄────────────────┘
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │ 1
       │
       │ N
┌──────┴──────────────┐
│     order_items     │
│─────────────────────│
│ id (PK)             │
│ quantity            │
│ unitPrice           │ ← snapshot do preço
│ orderId (FK)        │
│ productId (FK)      │
└─────────────────────┘
```

### Entidade: User

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })
  role: Role;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}
```

**Decorator por decorator:**

| Decorator | O que faz | Por que existe |
|---|---|---|
| `@Entity('users')` | Mapeia a classe para a tabela `users` | Sem ele o TypeORM ignora a classe |
| `@PrimaryGeneratedColumn('uuid')` | Cria a coluna `id` como UUID gerado automaticamente | UUIDs são mais seguros que IDs sequenciais (não expõem volume do sistema) |
| `@Column()` | Cria uma coluna simples com o tipo inferido do TypeScript | Mapeamento direto propriedade → coluna |
| `@Column({ unique: true })` | Garante que o email seja único no banco | Impede dois usuários com o mesmo email via constraint do banco |
| `@Column({ select: false })` | A coluna existe no banco, mas o TypeORM **não a inclui** nas queries por padrão | Segurança: a senha nunca vaza acidentalmente em respostas |
| `@Column({ type: 'enum', enum: Role, default: Role.CUSTOMER })` | Cria uma coluna do tipo enum no PostgreSQL com valor padrão | Garante integridade: só valores válidos do enum podem ser inseridos |
| `@CreateDateColumn()` | Preenchida automaticamente com `NOW()` na inserção | Auditoria sem esforço manual |
| `@UpdateDateColumn()` | Atualizada automaticamente com `NOW()` a cada save | Rastreabilidade de modificações |
| `@BeforeInsert()` | Executa o método **antes** de o TypeORM fazer o INSERT | Garante que a senha nunca seja salva em texto puro |

**O `@BeforeInsert` em detalhe:**

```typescript
@BeforeInsert()
async hashPassword() {
  this.password = await bcrypt.hash(this.password, 10);
}
```

Quando o TypeORM chama `repository.save(user)` pela primeira vez, antes de montar o SQL INSERT, ele executa este método. O bcrypt transforma a senha `"minhasenha123"` em algo como `"$2b$10$..."`. O número `10` é o **salt rounds** — quantas vezes o bcrypt itera o hash. Mais rounds = mais seguro, mas mais lento. 10 é o equilíbrio padrão.

### Entidade: Category

```typescript
@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

Entidade simples. `nullable: true` significa que a coluna aceita `NULL` no banco — o campo é opcional. O nome é `unique` porque não faz sentido ter duas categorias "Pizzas".

### Entidade: Product

```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isAvailable: boolean;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ nullable: true })
  categoryId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Pontos importantes:**

`@Column({ type: 'decimal', precision: 10, scale: 2 })` — Para dinheiro, **nunca** use `float` ou `double`. Ponto flutuante causa erros de arredondamento (ex: 0.1 + 0.2 = 0.30000000000000004). `decimal(10,2)` significa: até 10 dígitos no total, sendo 2 após a vírgula. Isso é preciso.

`@ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true, eager: false })` — Muitos produtos pertencem a uma categoria. Se a categoria for deletada, o `categoryId` do produto vira `NULL` em vez de o produto ser deletado junto (`CASCADE`). Isso preserva os produtos mesmo sem categoria.

`@JoinColumn({ name: 'categoryId' })` — Diz ao TypeORM que a coluna de chave estrangeira no banco se chama `categoryId`. Sem isso o TypeORM geraria um nome automático como `category_id`.

`eager: false` — O relacionamento **não** é carregado automaticamente. Você precisa pedir explicitamente (via `relations` ou `leftJoinAndSelect`). Isso evita queries desnecessárias quando você só precisa do produto sem a categoria.

### Entidade: Order

```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @Column()
  deliveryAddress: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: User;

  @Column({ nullable: true })
  customerId: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

`@OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })`:
- Um pedido tem muitos itens
- `cascade: true` — quando você salva um Order com items, o TypeORM automaticamente salva os OrderItems também. Sem cascade você precisaria salvar cada item manualmente.
- `eager: true` — os itens são **sempre** carregados junto com o pedido. Faz sentido aqui porque um pedido sem seus itens é informação incompleta.

### Entidade: OrderItem

```typescript
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: string;

  @ManyToOne(() => Product, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;
}
```

`onDelete: 'CASCADE'` no lado do Order: se o pedido for deletado, todos os seus itens são deletados automaticamente. Faz sentido — itens sem pedido são inúteis.

`onDelete: 'SET NULL'` no lado do Product: se o produto for deletado do cardápio, o item do pedido histórico não é deletado — apenas o `productId` vira `NULL`. O `unitPrice` continua lá, preservando o valor histórico.

`eager: true` no product: toda vez que você carrega um OrderItem, o produto associado já vem junto. Conveniente para exibir detalhes do pedido.

---

## 3. Configuração e Bootstrap

### `main.ts` — O ponto de entrada da aplicação

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);  // (1)

  app.useGlobalPipes(                               // (2)
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());  // (3)

  app.enableCors({                                  // (4)
    origin: 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT ?? 3001;           // (5)
  await app.listen(port);
}
```

**(1) `NestFactory.create(AppModule)`**
Cria toda a aplicação NestJS a partir do módulo raiz. O NestJS lê o `AppModule`, descobre todos os módulos, controllers, services e providers, e monta o sistema de injeção de dependência.

**(2) `ValidationPipe` global**
Este pipe intercepta **toda** requisição que chegue a qualquer controller e valida o body/params contra os DTOs. As três opções são importantes:

- `whitelist: true` — remove silenciosamente qualquer campo que **não** esteja declarado no DTO. Se alguém enviar `{ "name": "Pizza", "hackField": "injeção" }`, o `hackField` é descartado antes de chegar ao service.
- `forbidNonWhitelisted: true` — vai além do whitelist: ao invés de remover silenciosamente, **rejeita a requisição** com erro 400 se houver campos extras. Mais seguro.
- `transform: true` — converte automaticamente tipos. Se o DTO declara `price: number` e o JSON chega como string `"29.90"`, ele converte para `29.90`. Também instancia as classes DTO corretamente (necessário para `@ValidateNested`).

**(3) `HttpExceptionFilter` global**
Intercepta todas as exceções HTTP não tratadas e retorna uma resposta JSON padronizada. Sem ele, erros diferentes teriam formatos diferentes. Com ele, todo erro tem:
```json
{
  "statusCode": 400,
  "message": "...",
  "path": "/auth/login",
  "timestamp": "2026-05-31T..."
}
```

**(4) `enableCors`**
O navegador bloqueia requisições de um domínio para outro por padrão (Same-Origin Policy). O CORS (Cross-Origin Resource Sharing) é o mecanismo que permite explicitamente que `http://localhost:3000` (frontend React) acesse `http://localhost:3001` (backend NestJS). `credentials: true` permite que cookies e headers de autorização sejam enviados cross-origin.

**(5) Porta dinâmica**
`process.env.PORT ?? 3001` — usa a variável de ambiente `PORT` se existir (útil em produção no Heroku/Railway), caso contrário usa 3001.

### `app.module.ts` — O módulo raiz

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({        // (1)
      isGlobal: true,
      load: [databaseConfig, jwtConfig],
    }),
    TypeOrmModule.forRootAsync({ // (2)
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

**(1) `ConfigModule.forRoot`**
Carrega as variáveis de ambiente do arquivo `.env` e as registra no sistema de configuração do NestJS. `isGlobal: true` significa que qualquer módulo pode injetar o `ConfigService` sem precisar importar o `ConfigModule` novamente. `load: [databaseConfig, jwtConfig]` carrega as configurações tipadas dos arquivos de config.

**(2) `TypeOrmModule.forRootAsync`**
Configura o TypeORM de forma assíncrona — ou seja, espera o `ConfigService` estar disponível antes de configurar. Sem `Async`, você teria que configurar de forma síncrona, sem acesso às variáveis de ambiente. O `useFactory` é uma função que recebe o `ConfigService` e retorna as opções do TypeORM.

### `database.config.ts`

```typescript
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432'),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    autoLoadEntities: true,
  }),
);
```

`registerAs('database', ...)` — registra a configuração sob a chave `'database'`. Por isso no `AppModule` usamos `configService.get('database')`.

`entities: [__dirname + '/../**/*.entity{.ts,.js}']` — instrui o TypeORM a encontrar todas as entidades automaticamente, procurando qualquer arquivo que termine em `.entity.ts` ou `.entity.js` em qualquer subpasta.

`synchronize: process.env.NODE_ENV !== 'production'` — esta é uma das opcoes mais importantes. Em desenvolvimento (`NODE_ENV !== 'production'`), o TypeORM **sincroniza automaticamente** o schema do banco com as entidades. Ou seja: se você adicionar uma coluna numa entidade, o TypeORM adiciona a coluna na tabela. **Em produção isso é perigoso** — pode destruir dados. Por isso é desativado em produção, onde se usam migrations.

### `jwt.config.ts`

```typescript
export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
}));
```

Registra a configuração JWT sob a chave `'jwt'`. O `secret` é a chave secreta usada para assinar e verificar tokens. `expiresIn: '7d'` significa que o token expira em 7 dias.

---

## 4. Sistema de Autenticação

### O que é JWT?

JWT (JSON Web Token) é um padrão para transmitir informações de forma segura entre sistemas. Um token JWT é uma string com 3 partes separadas por ponto:

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1dWlkLTEyMyIsImVtYWlsIjoiYWRtaW5AZGV2Zm9vZC5jb20iLCJyb2xlIjoiQURNSU4ifQ.assinatura
      HEADER                              PAYLOAD                                          SIGNATURE
```

- **Header**: algoritmo usado (HS256)
- **Payload**: dados públicos (sub=id do usuário, email, role) — qualquer pessoa pode decodificar, não há segredo aqui
- **Signature**: hash do header + payload com a chave secreta — só o servidor pode gerar e verificar

O fluxo é simples:
1. Cliente envia login com email/senha
2. Servidor verifica credenciais, gera um JWT assinado e devolve
3. Cliente guarda o token (localStorage ou cookie)
4. Em cada requisição seguinte, cliente envia o token no header `Authorization: Bearer <token>`
5. Servidor valida a assinatura do token e confia nos dados do payload

**Por que JWT é chamado de "stateless"?** O servidor não precisa guardar nenhuma sessão. O próprio token carrega as informações do usuário. Qualquer servidor pode validar o token sem consultar um banco de sessões.

### Fluxo de Registro

```
POST /auth/register
{ name, email, password }
         │
         ▼
   AuthController.register()
         │
         ▼
   AuthService.register()
         │
         ├─► UsersService.create()
         │         │
         │         ├─► Verifica se email já existe no banco
         │         │   (lança ConflictException 409 se existir)
         │         │
         │         ├─► usersRepository.create(dto)
         │         │   (instancia o objeto User, mas NÃO salva ainda)
         │         │
         │         └─► usersRepository.save(user)
         │                   │
         │                   ├─► Executa @BeforeInsert: hashPassword()
         │                   │   senha "minhasenha" → "$2b$10$..."
         │                   │
         │                   └─► INSERT INTO users (...) VALUES (...)
         │
         └─► buildAuthResponse(id, email, role, name)
                   │
                   └─► jwtService.sign({ sub: id, email, role })
                             │
                             └─► Retorna { access_token, user }
```

### Fluxo de Login

```typescript
async login(dto: LoginDto) {
  // (1) Busca o usuário pelo email
  const user = await this.usersService.findByEmail(dto.email);

  // (2) Se não encontrou, erro genérico (não revela se o email existe)
  if (!user) throw new UnauthorizedException('Credenciais inválidas');

  // (3) Compara a senha enviada com o hash do banco
  const passwordMatch = await bcrypt.compare(dto.password, user.password);

  // (4) Se a senha não bate, mesmo erro genérico
  if (!passwordMatch) throw new UnauthorizedException('Credenciais inválidas');

  // (5) Gera e retorna o token
  return this.buildAuthResponse(user.id, user.email, user.role, user.name);
}
```

**Por que a mensagem de erro é sempre "Credenciais inválidas"?**

Por segurança. Se fosse "Email não encontrado", um atacante poderia fazer uma lista de quais emails estão cadastrados. Com a mensagem genérica, o atacante não sabe se o email existe ou se a senha está errada.

**Por que o `findByEmail` usa QueryBuilder em vez de `findOneBy`?**

```typescript
async findByEmail(email: string): Promise<User | null> {
  return this.usersRepository
    .createQueryBuilder('user')
    .addSelect('user.password')   // ← a chave
    .where('user.email = :email', { email })
    .getOne();
}
```

Lembra que o campo `password` tem `select: false`? Isso significa que queries normais como `findOneBy({ email })` **não retornam a senha**. Mas para fazer login precisamos da senha para comparar. O `addSelect('user.password')` diz explicitamente: "inclua a senha desta vez". Isso é preciso e seguro — a senha só é buscada quando absolutamente necessário.

### JwtStrategy — Como o token é validado em cada requisição

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // (1)
      ignoreExpiration: false,                                   // (2)
      secretOrKey: configService.get<string>('jwt.secret')!,   // (3)
    });
  }

  validate(payload: JwtPayload) {                               // (4)
    return { sub: payload.sub, email: payload.email, role: payload.role };
  }
}
```

**(1)** Extrai o token do header `Authorization: Bearer <token>`. O Passport sabe onde procurar o token.

**(2)** `ignoreExpiration: false` — tokens expirados são **rejeitados**. Se fosse `true`, tokens expirados seriam aceitos (péssimo para segurança).

**(3)** A chave secreta deve ser a **mesma** usada para assinar. Se alguém tentar forjar um token sem a chave, a verificação falhará.

**(4)** Se o token for válido, este método é chamado com o payload decodificado. O que ele retorna é colocado em `request.user`. Por isso nos controllers você usa `@CurrentUser()` e recebe `{ sub, email, role }`.

**O fluxo de validação por requisição:**

```
Requisição com Authorization: Bearer eyJ...
            │
            ▼
    JwtAuthGuard (estende AuthGuard('jwt'))
            │
            ▼
    Passport intercepta, extrai o token
            │
            ▼
    Verifica assinatura com JWT_SECRET
            │
      ┌─────┴──────┐
  inválido        válido
      │               │
      ▼               ▼
  401 Unauthorized  JwtStrategy.validate(payload)
                        │
                        ▼
                  request.user = { sub, email, role }
                        │
                        ▼
                  Controller recebe a requisição
```

---

## 5. Autorização por Roles

### A diferença entre Autenticação e Autorização

- **Autenticação**: "Quem é você?" — verificar se o token é válido e identificar o usuário
- **Autorização**: "O que você pode fazer?" — verificar se o usuário identificado tem permissão para a ação

O `JwtAuthGuard` faz autenticação. O `RolesGuard` faz autorização.

### O decorator `@Roles`

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

`SetMetadata` é uma função do NestJS que armazena dados arbitrários (metadados) diretamente no handler (método do controller) ou na classe. Quando você escreve:

```typescript
@Roles(Role.ADMIN)
create(@Body() dto: CreateCategoryDto) { ... }
```

O NestJS armazena `{ roles: ['ADMIN'] }` como metadado associado ao método `create`. Isso é lido depois pelo `RolesGuard`.

### O `RolesGuard`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}  // (1)

  canActivate(context: ExecutionContext): boolean {
    // (2) Lê os metadados do handler atual
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // (3) Se não há restrição de role, permite qualquer um
    if (!requiredRoles) return true;

    // (4) Pega o usuário do request (colocado lá pelo JwtStrategy)
    const { user } = context.switchToHttp().getRequest();

    // (5) Verifica se o role do usuário está na lista de roles permitidas
    return requiredRoles.includes(user?.role);
  }
}
```

**(1) Reflector**: é uma ferramenta do NestJS para leitura de metadados. O `RolesGuard` precisa dele para saber quais roles foram definidas no `@Roles()` decorator.

**(2) `getAllAndOverride`**: lê o metadado `ROLES_KEY` primeiro do handler (método), depois da classe. Isso permite colocar `@Roles` tanto no método quanto no controller inteiro.

**(3)** Se `requiredRoles` for `undefined` (nenhum `@Roles` foi aplicado), o guard deixa passar. Isso significa que a rota não tem restrição de role — qualquer usuário autenticado pode acessar.

**(4)** `request.user` foi preenchido pelo `JwtStrategy.validate()`. Por isso o `JwtAuthGuard` **deve vir antes** do `RolesGuard` — sem o JwtAuthGuard, `request.user` seria `undefined`.

**(5)** Verifica se o role do usuário logado está na lista de roles permitidas.

### Como usar nos controllers

```typescript
// Rota pública — sem nenhum guard
@Get()
findAll() { ... }

// Rota que exige apenas autenticação (qualquer role)
@Get('me')
@UseGuards(JwtAuthGuard)
me() { ... }

// Rota que exige autenticação E role ADMIN
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
create() { ... }
```

**A ordem importa**: `JwtAuthGuard` deve ser listado primeiro. O NestJS executa os guards na ordem declarada. Se o JWT falhar, o `RolesGuard` nem é executado.

---

## 6. Fluxo Admin Completo Passo a Passo

### 6.1 Login do Admin

```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "admin@devfood.com",
  "password": "senha123"
}
```

**Passo a passo completo:**

```
1. Requisição chega ao NestJS

2. ValidationPipe valida o body contra LoginDto:
   - email deve ser um email válido (@IsEmail)
   - password deve ter mínimo 6 caracteres (@MinLength(6))
   - campos extras são rejeitados (forbidNonWhitelisted)

3. AuthController.login(dto) é chamado

4. AuthService.login(dto):
   a. usersService.findByEmail("admin@devfood.com")
      → QueryBuilder com addSelect('user.password')
      → SELECT id, name, email, password, role FROM users WHERE email = 'admin@devfood.com'
      → Retorna o objeto User com a senha hasheada

   b. bcrypt.compare("senha123", "$2b$10$...")
      → Roda o mesmo algoritmo de hash na senha fornecida
      → Compara os hashes
      → Retorna true se batem

   c. buildAuthResponse(id, email, "ADMIN", name)
      → jwtService.sign({ sub: "uuid-123", email: "admin@...", role: "ADMIN" })
      → Gera o token JWT assinado com JWT_SECRET

5. Resposta HTTP 200:
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": "uuid-123",
    "name": "Admin",
    "email": "admin@devfood.com",
    "role": "ADMIN"
  }
}
```

O admin guarda o `access_token` e o inclui em todas as requisições seguintes.

### 6.2 Criar uma Categoria (Admin)

```
POST http://localhost:3001/categories
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "Pizzas",
  "description": "As melhores pizzas da cidade",
  "imageUrl": "https://cdn.devfood.com/pizza.jpg"
}
```

**Passo a passo:**

```
1. Requisição chega ao NestJS

2. JwtAuthGuard é executado:
   a. Extrai "Bearer eyJ..." do header Authorization
   b. Remove "Bearer ", fica com o token
   c. Verifica a assinatura com JWT_SECRET
   d. Decodifica o payload: { sub: "uuid-123", email: "admin@...", role: "ADMIN" }
   e. Chama JwtStrategy.validate(payload)
   f. request.user = { sub: "uuid-123", email: "admin@...", role: "ADMIN" }

3. RolesGuard é executado:
   a. Reflector lê os metadados do método create()
   b. Encontra requiredRoles = ["ADMIN"]
   c. request.user.role = "ADMIN"
   d. "ADMIN" está em ["ADMIN"] → canActivate retorna true

4. ValidationPipe valida o body contra CreateCategoryDto:
   - name: "Pizzas" ✓ (string não vazia)
   - description: "..." ✓ (string, opcional)
   - imageUrl: "https://..." ✓ (URL válida, opcional)

5. CategoriesController.create(dto) é chamado

6. CategoriesService.create(dto):
   a. categoriesRepository.create(dto)
      → Instancia um objeto Category em memória (sem salvar)
   b. categoriesRepository.save(category)
      → INSERT INTO categories (id, name, description, imageUrl, createdAt, updatedAt)
         VALUES (gen_random_uuid(), 'Pizzas', '...', '...', NOW(), NOW())
      → Retorna o objeto Category salvo com o id gerado

7. Resposta HTTP 201:
{
  "id": "cat-uuid-456",
  "name": "Pizzas",
  "description": "As melhores pizzas da cidade",
  "imageUrl": "https://cdn.devfood.com/pizza.jpg",
  "createdAt": "2026-05-31T...",
  "updatedAt": "2026-05-31T..."
}
```

### 6.3 Listar Categorias (Público)

```
GET http://localhost:3001/categories
```

Não há guards nesta rota — qualquer um pode listar categorias.

```
1. Requisição chega ao NestJS (sem validação de token)

2. CategoriesController.findAll() é chamado

3. CategoriesService.findAll():
   → categoriesRepository.find({ order: { name: 'ASC' } })
   → SELECT * FROM categories ORDER BY name ASC
   → Retorna array de Category

4. Resposta HTTP 200: [ { "id": "...", "name": "Bebidas", ... }, { ... } ]
```

### 6.4 Atualizar uma Categoria (Admin)

```
PATCH http://localhost:3001/categories/cat-uuid-456
Authorization: Bearer eyJ...

{
  "description": "Pizzas artesanais e tradicionais"
}
```

```
1. Guards executam (igual ao create)

2. ValidationPipe valida contra UpdateCategoryDto (PartialType de CreateCategoryDto):
   - Todos os campos são opcionais
   - Apenas description foi enviado ✓

3. CategoriesController.update(id, dto)

4. CategoriesService.update("cat-uuid-456", dto):
   a. findOne("cat-uuid-456")
      → SELECT * FROM categories WHERE id = 'cat-uuid-456'
      → Lança NotFoundException se não existir
   
   b. Object.assign(category, dto)
      → Mescla as propriedades do dto no objeto category em memória
      → category.description = "Pizzas artesanais e tradicionais"
      → name, imageUrl permanecem iguais
   
   c. categoriesRepository.save(category)
      → UPDATE categories SET description = '...', updatedAt = NOW()
         WHERE id = 'cat-uuid-456'

5. Resposta HTTP 200 com a categoria atualizada
```

**Por que `Object.assign(category, dto)` em vez de uma query de update direta?**

Esta abordagem carrega o objeto atual do banco, modifica apenas os campos enviados, e salva de volta. Isso garante que campos não enviados (como `name`) nunca sejam sobrescritos com `undefined`. É um padrão seguro e idiomático no TypeORM.

### 6.5 Deletar uma Categoria (Admin)

```
DELETE http://localhost:3001/categories/cat-uuid-456
Authorization: Bearer eyJ...
```

```
1. Guards executam

2. CategoriesController.remove(id)
   → HttpCode(204): sem body na resposta

3. CategoriesService.remove("cat-uuid-456"):
   a. findOne(id) → busca a categoria (lança 404 se não existir)
   b. categoriesRepository.remove(category)
      → DELETE FROM categories WHERE id = 'cat-uuid-456'
      
      Efeito colateral: produtos desta categoria ficam com categoryId = NULL
      (por causa do onDelete: 'SET NULL' no Product)

4. Resposta HTTP 204 (No Content) — sem body
```

### 6.6 Criar um Produto (Admin)

```
POST http://localhost:3001/products
Authorization: Bearer eyJ...

{
  "name": "Pizza Margherita",
  "description": "Molho, mussarela, tomate e manjericão",
  "price": 45.90,
  "categoryId": "cat-uuid-456",
  "isAvailable": true,
  "imageUrl": "https://cdn.devfood.com/margherita.jpg"
}
```

```
1. Guards: JwtAuthGuard + RolesGuard (ADMIN) ✓

2. ValidationPipe valida CreateProductDto:
   - name: string não vazia ✓
   - price: número positivo com até 2 casas decimais ✓
   - categoryId: UUID válido ✓
   - isAvailable: booleano ✓
   - description, imageUrl: opcionais ✓

3. ProductsController.create(dto)

4. ProductsService.create(dto):
   a. productsRepository.create(dto) — instancia Product
   b. productsRepository.save(product)
      → INSERT INTO products (id, name, description, price, imageUrl,
         isAvailable, categoryId, createdAt, updatedAt)
         VALUES (gen_random_uuid(), 'Pizza Margherita', '...', 45.90, '...', true, 'cat-uuid-456', NOW(), NOW())

5. Resposta HTTP 201 com o produto criado
```

### 6.7 Listar Produtos com Filtro por Categoria

```
GET http://localhost:3001/products?categoryId=cat-uuid-456
```

```
1. Sem guards — rota pública

2. ProductsController.findAll(categoryId)
   → @Query('categoryId') extrai o parâmetro da query string

3. ProductsService.findAll("cat-uuid-456"):
   a. createQueryBuilder
      .leftJoinAndSelect('product.category', 'category')
      .orderBy('product.name', 'ASC')
      .where('product.categoryId = :categoryId', { categoryId })
      .getMany()
   
   → SELECT p.*, c.* FROM products p
     LEFT JOIN categories c ON p.categoryId = c.id
     WHERE p.categoryId = 'cat-uuid-456'
     ORDER BY p.name ASC

4. Resposta: array de produtos com o objeto category aninhado
[
  {
    "id": "...",
    "name": "Pizza Margherita",
    "price": "45.90",
    "category": { "id": "cat-uuid-456", "name": "Pizzas" },
    ...
  }
]
```

### 6.8 Visualizar Todos os Pedidos (Admin)

```
GET http://localhost:3001/orders
Authorization: Bearer eyJ...  (role ADMIN)
```

```
1. JwtAuthGuard (nível de controller) — valida token
2. RolesGuard + @Roles(ADMIN) — verifica role

3. OrdersController.findAll(status?)
   → @Query('status') é opcional

4. OrdersService.findAllForAdmin():
   createQueryBuilder
     .leftJoinAndSelect('order.customer', 'customer')
     .leftJoinAndSelect('order.items', 'items')
     .leftJoinAndSelect('items.product', 'product')
     .orderBy('order.createdAt', 'DESC')
   
   → SELECT o.*, u.*, oi.*, p.*
     FROM orders o
     LEFT JOIN users u ON o.customerId = u.id
     LEFT JOIN order_items oi ON oi.orderId = o.id
     LEFT JOIN products p ON oi.productId = p.id
     ORDER BY o.createdAt DESC

5. Retorna todos os pedidos com cliente, itens e produtos aninhados
```

**Por que usar QueryBuilder aqui em vez de `find`?**

O `find` com `relations` pode fazer queries ineficientes (N+1). O QueryBuilder permite escrever o JOIN explicitamente, gerando uma única query SQL eficiente.

### 6.9 Atualizar Status de um Pedido (Admin)

Este é o fluxo central do painel admin — a cozinha ou o entregador atualiza o status do pedido.

```
PATCH http://localhost:3001/orders/order-uuid-789/status
Authorization: Bearer eyJ...  (role ADMIN)

{
  "status": "CONFIRMED"
}
```

**Estados possíveis e seu ciclo:**

```
PENDING → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED
                                                    ↘ CANCELLED (de qualquer estado)
```

```
1. JwtAuthGuard valida o token
2. RolesGuard verifica role ADMIN

3. ValidationPipe valida UpdateOrderStatusDto:
   - status deve ser um valor válido do enum OrderStatus
   - @IsEnum(OrderStatus) rejeita strings arbitrárias

4. OrdersController.updateStatus("order-uuid-789", dto)

5. OrdersService.updateStatus("order-uuid-789", { status: "CONFIRMED" }):
   a. ordersRepository.findOneBy({ id: "order-uuid-789" })
      → SELECT * FROM orders WHERE id = 'order-uuid-789'
      → Lança NotFoundException se não existir
   
   b. order.status = "CONFIRMED"
   
   c. ordersRepository.save(order)
      → UPDATE orders SET status = 'CONFIRMED', updatedAt = NOW()
         WHERE id = 'order-uuid-789'

6. Resposta HTTP 200 com o pedido atualizado
```

**Nota importante:** O código atual **não valida transições de estado**. Um admin pode ir de DELIVERED direto para PENDING. Em um sistema de produção, seria necessário adicionar lógica de transição de estados (ex: só pode ir de CONFIRMED para PREPARING, não para PENDING).

---

## 7. DTOs e Validação

### O que é um DTO?

DTO significa **Data Transfer Object** (Objeto de Transferência de Dados). É uma classe simples que define o formato dos dados que chegam numa requisição. O DTO serve como um contrato: "a requisição deve ter exatamente esses campos, com esses tipos e essas regras".

Sem DTOs, você ficaria fazendo `if (!req.body.email)` em todo lugar — verboso, propenso a erros e difícil de manter.

### Como o `class-validator` funciona

Os decorators do `class-validator` são anotações que adicionam regras de validação ao DTO:

```typescript
// create-order.dto.ts
export class CreateOrderItemDto {
  @IsUUID()          // deve ser uma string no formato UUID v4
  productId: string;

  @IsInt()           // deve ser um número inteiro
  @IsPositive()      // deve ser positivo (> 0)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()                      // deve ser um array
  @ValidateNested({ each: true }) // valida cada elemento do array
  @Type(() => CreateOrderItemDto) // class-transformer instancia cada item como CreateOrderItemDto
  items: CreateOrderItemDto[];

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;
}
```

`@ValidateNested({ each: true })` com `@Type(() => CreateOrderItemDto)` é um padrão importante: sem o `@Type`, o `class-transformer` não sabe que os objetos dentro do array devem ser instâncias de `CreateOrderItemDto`, e a validação aninhada não funciona. O `transform: true` no `ValidationPipe` é o que ativa o `class-transformer`.

### O padrão `PartialType`

```typescript
// update-category.dto.ts
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
```

`PartialType` é uma função do `@nestjs/mapped-types` que cria uma nova classe com todas as propriedades do DTO original, mas **todas opcionais**. Ao invés de duplicar a definição e adicionar `@IsOptional()` em tudo, você herda tudo automaticamente. Também herda as validações — se `name` deve ser string não vazia quando presente no create, também deve ser quando presente no update.

### Tabela de decorators usados no projeto

| Decorator | Validação |
|---|---|
| `@IsString()` | Deve ser string |
| `@IsNotEmpty()` | Não pode ser string vazia |
| `@IsEmail()` | Deve ser email válido |
| `@MinLength(6)` | String com mínimo 6 caracteres |
| `@IsOptional()` | Campo não é obrigatório |
| `@IsUrl()` | Deve ser URL válida |
| `@IsNumber({ maxDecimalPlaces: 2 })` | Número com até 2 casas decimais |
| `@IsPositive()` | Número > 0 |
| `@IsBoolean()` | Deve ser boolean |
| `@IsUUID()` | Deve ser UUID v4 |
| `@IsArray()` | Deve ser array |
| `@ValidateNested({ each: true })` | Valida cada item do array |
| `@IsInt()` | Deve ser inteiro |
| `@IsEnum(OrderStatus)` | Deve ser valor válido do enum |

---

## 8. Decisões de Design Importantes

### 8.1 Por que `unitPrice` é armazenado no `OrderItem`?

```typescript
// OrderItem
@Column({ type: 'decimal', precision: 10, scale: 2 })
unitPrice: number;  // <- snapshot do preço no momento do pedido
```

Imagine o cenário: um cliente fez um pedido da "Pizza Margherita" por R$ 45,90. Depois, o admin aumenta o preço para R$ 52,90. Se o `OrderItem` apenas guardasse a referência ao produto (como uma FK), o pedido histórico mostraria R$ 52,90 — errado.

Ao salvar o `unitPrice` no `OrderItem`, o preço histórico fica imutável. O pedido sempre mostrará o valor correto de quando foi feito.

**Onde isso acontece no código:**

```typescript
// orders.service.ts
const product = await this.productsService.findOne(itemDto.productId);
const unitPrice = Number(product.price);   // captura o preço atual
totalPrice += unitPrice * itemDto.quantity;
orderItems.push({ productId: product.id, quantity: itemDto.quantity, unitPrice });
//                                                                    ^^^^^^^^^^^
//                                            salvo do banco, não do cliente
```

### 8.2 Por que o preço nunca vem do cliente?

No `CreateOrderItemDto`:
```typescript
export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
  // Perceba: não há campo "price" aqui!
}
```

Se o preço viesse do frontend, um usuário mal-intencionado poderia enviar `{ "productId": "...", "quantity": 1, "price": 0.01 }` e comprar qualquer produto por 1 centavo. O `OrdersService` sempre busca o preço no banco, ignorando completamente qualquer valor que o cliente tentasse enviar.

### 8.3 `select: false` no campo password

```typescript
@Column({ select: false })
password: string;
```

Esta opção diz ao TypeORM: "nunca inclua esta coluna nas queries SELECT por padrão". Isso é uma defesa em profundidade — mesmo que um desenvolvedor acidentalmente retorne o objeto `User` diretamente numa resposta, a senha não estará lá. A senha só é buscada explicitamente em `findByEmail` usando `.addSelect('user.password')`.

### 8.4 `SET NULL` vs `CASCADE` nas foreign keys

O projeto usa dois comportamentos distintos para foreign keys, cada um com uma justificativa:

**`onDelete: 'SET NULL'` — usado em:**
- `Product.categoryId`: se a categoria "Pizzas" for deletada, os produtos dessa categoria continuam existindo, mas sem categoria. O produto não deve sumir porque a categoria sumiu.
- `Order.customerId`: se um usuário for deletado, os pedidos históricos não devem ser apagados. São dados financeiros importantes.
- `OrderItem.productId`: se um produto for removido do cardápio, os itens de pedidos antigos não devem desaparecer.

**`onDelete: 'CASCADE'` — usado em:**
- `OrderItem.orderId`: se um pedido for deletado, **todos os seus itens devem ser deletados também**. Um item sem pedido não faz sentido e seria lixo no banco.

A regra geral: use `CASCADE` quando o filho não faz sentido sem o pai. Use `SET NULL` quando o filho tem valor histórico independente.

### 8.5 Por que `synchronize: true` só em desenvolvimento?

```typescript
synchronize: process.env.NODE_ENV !== 'production'
```

Em desenvolvimento, é conveniente: você adiciona uma coluna na entidade e o banco é atualizado automaticamente. Em produção, isso é **perigoso**: se houver um bug no código da entidade, o TypeORM pode tentar alterar ou destruir tabelas com dados reais. Em produção usa-se migrations — scripts controlados e revisados que alteram o schema incrementalmente.

### 8.6 A separação `findAllForAdmin` vs `findAllForCustomer`

```typescript
// Admin vê todos os pedidos, com dados do cliente e filtro por status
findAllForAdmin(status?: OrderStatus): Promise<Order[]>

// Cliente vê apenas seus próprios pedidos
findAllForCustomer(customerId: string): Promise<Order[]>
```

Isso poderia ser uma única função com parâmetros opcionais, mas a separação explícita tem vantagens:
- Mais legível — a intenção é clara no nome
- Mais seguro — não há risco de esquecer de filtrar por `customerId` e vazar pedidos de outros usuários
- Queries diferentes — o admin precisa de joins com o customer, o cliente não

### 8.7 O `@CurrentUser()` decorator personalizado

```typescript
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

Sem este decorator, você precisaria de:
```typescript
create(@Req() request: Request) {
  const user = request.user as AuthUser;
  return this.ordersService.create(user.sub, dto);
}
```

Com o decorator:
```typescript
create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
  return this.ordersService.create(user.sub, dto);
}
```

Mais limpo, mais expressivo, e o Service nunca precisa saber que o usuário veio de um request HTTP.

---

## Resumo Visual do Fluxo Admin

```
Admin faz login
      │
      ▼
POST /auth/login → { access_token }
      │
      └── Admin usa o token em todas as requisições seguintes:
          Authorization: Bearer <token>

          ┌────────────────────────────────────────┐
          │          GESTÃO DE CATEGORIAS          │
          │                                        │
          │  POST   /categories     → criar        │
          │  GET    /categories     → listar (pub) │
          │  GET    /categories/:id → detalhar (pub│
          │  PATCH  /categories/:id → editar       │
          │  DELETE /categories/:id → remover      │
          └────────────────────────────────────────┘

          ┌────────────────────────────────────────┐
          │           GESTÃO DE PRODUTOS           │
          │                                        │
          │  POST   /products       → criar        │
          │  GET    /products       → listar (pub) │
          │  GET    /products/:id   → detalhar(pub)│
          │  PATCH  /products/:id   → editar       │
          │  DELETE /products/:id   → remover      │
          └────────────────────────────────────────┘

          ┌────────────────────────────────────────┐
          │           GESTÃO DE PEDIDOS            │
          │                                        │
          │  GET   /orders           → todos       │
          │  GET   /orders?status=X  → filtrados   │
          │  GET   /orders/:id       → um pedido   │
          │  PATCH /orders/:id/status → atualizar  │
          └────────────────────────────────────────┘
```

---

*Documento gerado em 2026-05-31 para o projeto Dev_food — NestJS + TypeORM + PostgreSQL.*
