class NotificationService {
  async sendEmail(to, subject, body) {
    return { sent: true, to, subject };
  }
}
module.exports = new NotificationService();
