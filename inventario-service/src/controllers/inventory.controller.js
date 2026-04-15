class InventoryController {
  async getInventory(req, res) {
    res.json({ success: true, message: 'GET inventario', data: [] });
  }
  async getProductStock(req, res) {
    res.json({ success: true, productId: req.params.productId, stock: 0 });
  }
  async reserveStock(req, res) {
    res.json({ success: true, message: 'Stock reservado' });
  }
  async adjustStock(req, res) {
    res.json({ success: true, message: 'Stock ajustado' });
  }
}
module.exports = new InventoryController();
