class ProductModel {
  async getAllProducts() {
    try {
      return [];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductModel();
