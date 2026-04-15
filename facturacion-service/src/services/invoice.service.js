class InvoiceService {
  async generateInvoice(orderData) {
    return { invoiceId: 1, ...orderData };
  }
}
module.exports = new InvoiceService();
