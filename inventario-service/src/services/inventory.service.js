class InventoryService {
  async updateStock(productId, quantity) {
    return { productId, quantity };
  }
}
module.exports = new InventoryService();
