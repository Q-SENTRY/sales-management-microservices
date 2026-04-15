class InvoiceController {
  async getInvoices(req, res) {
    res.json({ success: true, data: [] });
  }
  async createInvoice(req, res) {
    res.status(201).json({ success: true, message: 'Factura creada' });
  }
  async getInvoiceById(req, res) {
    res.json({ success: true, invoiceId: req.params.id });
  }
  async downloadPDF(req, res) {
    res.json({ success: true, message: 'PDF' });
  }
}
module.exports = new InvoiceController();
