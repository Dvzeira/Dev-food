import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Role } from '../common/enums/role.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly productsService: ProductsService,
  ) {}

  async create(customerId: string, dto: CreateOrderDto): Promise<Order> {
    const orderItems: Partial<OrderItem>[] = [];
    let totalPrice = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findOne(itemDto.productId);

      if (!product.isAvailable) {
        throw new BadRequestException(
          `Produto "${product.name}" não está disponível`,
        );
      }

      const unitPrice = Number(product.price);
      totalPrice += unitPrice * itemDto.quantity;

      orderItems.push({
        productId: product.id,
        quantity: itemDto.quantity,
        unitPrice,
      });
    }

    const order = this.ordersRepository.create({
      customerId,
      deliveryAddress: dto.deliveryAddress,
      totalPrice,
      items: orderItems as OrderItem[],
    });

    return this.ordersRepository.save(order);
  }

  findAllForAdmin(status?: OrderStatus): Promise<Order[]> {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC');

    if (status) {
      query.where('order.status = :status', { status });
    }

    return query.getMany();
  }

  findAllForCustomer(customerId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(
    id: string,
    requesterId: string,
    requesterRole: Role,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { customer: true, items: { product: true } },
    });

    if (!order) throw new NotFoundException('Pedido não encontrado');

    if (requesterRole !== Role.ADMIN && order.customerId !== requesterId) {
      throw new ForbiddenException('Acesso negado');
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.ordersRepository.findOneBy({ id });
    if (!order) throw new NotFoundException('Pedido não encontrado');

    order.status = dto.status;
    return this.ordersRepository.save(order);
  }
}
