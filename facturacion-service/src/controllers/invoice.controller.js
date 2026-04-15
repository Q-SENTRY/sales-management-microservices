const logger = require('../config/logger');
const invoiceModel = require('../models/invoice.model');

class InvoiceController {
  async getInvoices(req, res, next) {
    try {
      const invoices = await invoiceModel.getAllInvoices();
      res.status(200).json({
        success: true,
        message: 'Facturas obtenidas exitosamente',
        data: invoices,
        count: invoices.length
      });
    } catch (error) {
      logger.error(`Error al obtener facturas: ${error.message}`);
      next(error);
    }
  }

  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      const invoice = await invoiceModel.getInvoiceById(id);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Factura obtenida exitosamente',
        data: invoice
      });
    } catch (error) {
      logger.error(`Error al obtener factura ${req.params.id}: ${error.message}`);
      next(error);
    }
  }

  async getInvoiceByOrderId(req, res, next) {
    try {
      const { orderId } = req.params;
      const invoice = await invoiceModel.getInvoiceByOrderId(orderId);

      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Factura no encontrada para esta orden'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Factura obtenida exitosamente',
        data: invoice
      });
    } catch (error) {
      logger.error(`Error al obtener factura de orden ${req.params.orderId}: ${error.message}`);
      next(error);
    }
  }

  async createInvoice(req, res, next) {
    try {
      const invoiceId = await invoiceModel.createInvoice(req.body);
      res.status(201).json({
        success: true,
        message: 'Factura creada exitosamente',
        data: { id: invoiceId }
      });
    } catch (error) {
      logger.error(`Error al crear factura: ${error.message}`);
      next(error);
    }
  }

  async generateInvoiceFromOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const invoiceId = await invoiceModel.generateInvoiceFromOrder(orderId);
      res.status(201).json({
        success: true,
        message: 'Factura generada exitosamente desde orden',
        data: { id: invoiceId }
      });
    } catch (error) {
      logger.error(`Error al generar factura desde orden ${req.params.orderId}: ${error.message}`);
      next(error);
    }
  }

  async updateInvoiceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { estado } = req.body;
      await invoiceModel.updateInvoiceStatus(id, estado);
      res.status(200).json({
        success: true,
        message: 'Estado de factura actualizado exitosamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar factura ${id}: ${error.message}`);
      next(error);
    }
  }
}

module.exports = new InvoiceController();
