# 📊 Project Structure Overview

## Estructura Completa del Proyecto

```
sales-management-microservices/
│
├── 📁 frontend-react/                          # Frontend React (Port 3000)
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 usuarios-service/                        # Users & Auth (Port 3001)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   └── user.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   └── user.service.js
│   │   ├── models/
│   │   │   └── user.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── user.routes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   ├── config/
│   │   │   ├── config.js
│   │   │   ├── database.js
│   │   │   └── logger.js
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 productos-service/                       # Products (Port 3002)
│   ├── src/
│   │   ├── controllers/product.controller.js
│   │   ├── services/product.service.js
│   │   ├── models/product.model.js
│   │   ├── routes/product.routes.js
│   │   ├── middleware/errorHandler.js
│   │   ├── config/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 ventas-service/                          # Sales & Orders (Port 3003)
│   ├── src/
│   │   ├── controllers/order.controller.js
│   │   ├── services/order.service.js
│   │   ├── models/order.model.js
│   │   ├── routes/order.routes.js
│   │   ├── events/                           # RabbitMQ events
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 inventario-service/                      # Inventory (Port 3004)
│   ├── src/
│   │   ├── controllers/inventory.controller.js
│   │   ├── services/inventory.service.js
│   │   ├── models/inventory.model.js
│   │   ├── routes/inventory.routes.js
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 facturacion-service/                     # Invoices (Port 3005)
│   ├── src/
│   │   ├── controllers/invoice.controller.js
│   │   ├── services/invoice.service.js
│   │   ├── models/invoice.model.js
│   │   ├── routes/invoice.routes.js
│   │   ├── pdf/                             # PDF generation
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 notificaciones-service/                  # Notifications (Port 3006)
│   ├── src/
│   │   ├── controllers/notification.controller.js
│   │   ├── services/notification.service.js
│   │   ├── models/notification.model.js
│   │   ├── routes/notification.routes.js
│   │   ├── email/                          # Email service
│   │   ├── sms/                            # SMS service (Twilio)
│   │   ├── middleware/
│   │   ├── config/
│   │   ├── app.js
│   │   └── index.js
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
│
├── 📁 database/                                # Database
│   └── schema.sql                             # SQL schema initial
│
├── 📁 docs/                                   # Documentation
│   ├── arquitectura.md                       # Architecture details
│   ├── flujo-ventas.md                      # Sales flow
│   ├── ENDPOINTS.md                         # API endpoints
│   └── GIT_WORKFLOW.md                      # Git guide
│
├── 📄 docker-compose.yml                      # Container orchestration
├── 📄 .env.example                            # Environment variables
├── 📄 .gitignore                              # Git ignore rules
├── 📄 package.json                            # Root package
├── 📄 README.md                               # Main README
├── 📄 SETUP.md                                # Setup guide
├── 📄 CONTRIBUTING.md                         # Contribution guide
└── 📄 LICENSE                                 # MIT License
```

---

## 📊 Tech Stack por Servicio

### Usuarios Service
- Node.js + Express
- MySQL
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Joi (validation)

### Productos Service
- Node.js + Express
- MySQL
- Joi (validation)

### Ventas Service
- Node.js + Express
- MySQL
- amqplib (RabbitMQ)
- Joi (validation)

### Inventario Service
- Node.js + Express
- MySQL
- amqplib (RabbitMQ)

### Facturación Service
- Node.js + Express
- MySQL
- PDFKit (PDF generation)
- amqplib (RabbitMQ)

### Notificaciones Service
- Node.js + Express
- nodemailer (email)
- amqplib (RabbitMQ)
- Twilio (SMS opcional)

### Frontend
- React 18+
- Axios (HTTP client)
- React Router (routing)
- Context API (state)

---

## 🗂️ Files por Categoría

### Configuración
```
.env.example
docker-compose.yml
.gitignore
package.json (root)
```

### Frontend
```
frontend-react/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   └── App.js
├── public/
├── package.json
└── Dockerfile
```

### Backend - Service Structure
Cada servicio tiene:
```
src/
├── {entity}.controller.js    # HTTP handlers
├── {entity}.service.js       # Business logic
├── {entity}.model.js         # Data access
├── {entity}.routes.js        # Route definitions
├── config/                   # Configuration files
├── middleware/               # Custom middleware
├── app.js                    # Express setup
└── index.js                  # Server entry

package.json
Dockerfile
README.md
```

### Database
```
database/
└── schema.sql              # SQL DDL + initial data
```

### Documentation
```
docs/
├── arquitectura.md         # System architecture
├── flujo-ventas.md        # Sales process
├── ENDPOINTS.md           # API reference
└── GIT_WORKFLOW.md        # Git guidelines
```

### Root Files
```
.env.example               # Environment template
.gitignore               # Git rules
docker-compose.yml       # Container setup
README.md               # Project overview
SETUP.md                # Quick start
CONTRIBUTING.md         # Developer guide
package.json            # Root dependencies
```

---

## 🔄 Data Flow

```
Frontend React (3000)
    ↓
API Calls (HTTP/JSON)
    ↓
Microservices
├─→ Usuarios (3001)
├─→ Productos (3002)
├─→ Ventas (3003)
├─→ Inventario (3004)
├─→ Facturación (3005)
└─→ Notificaciones (3006)
    ↓
MySQL Database (3306)
    ↓
Business Logic
    ↓
RabbitMQ Events (5672)
```

---

## 🚀 Quick Start Commands

```bash
# Setup
cp .env.example .env
docker-compose up --build

# Development
docker-compose up -d
docker-compose logs -f

# Stop
docker-compose down
docker-compose down -v  # with cleanup

# Database
docker-compose exec mysql mysql -u root -ppassword123 sales_management_db

# Backend (individual service)
cd usuarios-service
npm install
npm run dev

# Testing
npm test
npm run lint

# Git
git checkout -b feature/nombre
git add .
git commit -m "feat: descripción"
git push origin feature/nombre
```

---

## 📋 Checklists para Desarrollo

### Antes de Push
- [ ] Tests pasan
- [ ] Linting sin errores
- [ ] Código funciona localmente
- [ ] Commits con mensajes claros
- [ ] Documentación actualizada
- [ ] Node modules no incluidos
- [ ] .env no incluido (solo .env.example)

### Antes de Pull Request
- [ ] Rama actualizada con develop
- [ ] Conflictos resueltos
- [ ] PR description clara
- [ ] Mínimo 1 screenshot si UI change
- [ ] Todos los requisitos del checklist

### Antes de Deploy
- [ ] Tests completos pasan
- [ ] Documentación actualizada
- [ ] Database migrations preparadas
- [ ] Environment variables documentadas
- [ ] Rollback plan disponible

---

## 📞 Team Roles

| Rol | Dev | Rama | Responsabilidades |
|-----|-----|------|------------------|
| **Backend 1** | Dev 1 | `feature/usuarios` | Usuarios Service, Auth |
| **Backend 2** | Dev 2 | `feature/productos` | Productos Service, Frontend |
| **Backend 3** | Dev 3 | `feature/ventas-inventario` | Ventas, Inventario, Notificaciones |

---

## 📈 Next Steps

1. ✅ Clone repository
2. ✅ Run `docker-compose up --build`
3. ✅ Create feature branch
4. ✅ Develop your feature
5. ✅ Create pull request
6. ✅ Get reviews + merge
7. ✅ Deploy to production

---

**Version:** 1.0.0
**Last Updated:** 2024
**Status:** Ready for Development ✅
