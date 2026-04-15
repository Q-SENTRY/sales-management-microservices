class NotificationController {
  async sendEmail(req, res) {
    res.json({ success: true, message: 'Email enviado' });
  }
  async sendSMS(req, res) {
    res.json({ success: true, message: 'SMS enviado' });
  }
  async getLogs(req, res) {
    res.json({ success: true, data: [] });
  }
}
module.exports = new NotificationController();
