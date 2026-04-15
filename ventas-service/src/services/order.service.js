class OrderService {
  async createOrder(data) {
    // Publicar evento a RabbitMQ
    return { id: 1, ...data };
  }
}
module.exports = new OrderService();
