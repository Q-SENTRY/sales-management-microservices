# Usuarios Service

Servicio de gestión de usuarios y autenticación

## Estructura

```
src/
├── controllers/    # Controladores HTTP
├── services/       # Lógica de negocio
├── models/         # Acceso a datos
├── routes/         # Definición de rutas
├── config/         # Configuración
├── middleware/     # Middleware personalizado
└── index.js        # Entry point
```

## Endpoints

- `POST /api/v1/auth/register` - Registrar usuario
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users` - Listar usuarios
- `GET /api/v1/users/:id` - Obtener usuario
- `PUT /api/v1/users/:id` - Actualizar usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario
