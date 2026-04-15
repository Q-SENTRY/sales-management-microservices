# 📖 CONTRIBUTING.md - Guía de Contribución

## Bienvenido al Proyecto

¡Gracias por tu interés en contribuir a **Sales Management Microservices**!

Este documento describe el proceso de contribución, estándares de código y flujo de trabajo con Git.

---

## 🌳 Flujo de Trabajo con Git (Git Flow)

### Ramas Principales

```
main (Producción - PROTEGIDA)
 ↑
develop (Desarrollo - PROTEGIDA)
 ↑
feature/*, bugfix/*, hotfix/*
```

### 1. Partir desde `develop`

```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Crear feature branch
git checkout -b feature/nombre-descriptivo
```

### 2. Nombrar Ramas Correctamente

**Formato:** `tipo/descripcion-corta`

**Tipos válidos:**
- `feature/` - Nueva funcionalidad
- `bugfix/` - Corrección de bug
- `hotfix/` - Corrección urgente de producción
- `refactor/` - Refactorización de código
- `docs/` - Cambios en documentación
- `test/` - Nuevos tests

**Ejemplos:**
```bash
git checkout -b feature/usuarios-autenticacion
git checkout -b bugfix/validacion-email-incorrecto
git checkout -b refactor/usuarios-service-clean-code
git checkout -b docs/actualizar-readme
```

### 3. Trabajar en tu Feature

```bash
# Crear commits con mensajes descriptivos
git add .
git commit -m "feat: agregar endpoint POST /auth/register"
git commit -m "fix: validar email antes de registro"

# Subir a GitHub
git push origin feature/usuarios-autenticacion
```

### 4. Crear Pull Request

Cuando completaste tu feature:

1. Ir a **GitHub**
2. Click en **"Compare & pull request"**
3. Asegurarse que:
   - Base: `develop` (no `main`)
   - Compare: tu rama
   - Descripción clara de cambios
   - Mínimo 2 reviews antes de merge

---

## 📝 Convención de Commits

Seguir [Conventional Commits](https://www.conventionalcommits.org/):

### Formato
```
<tipo>(<scope>): <descripción>

<cuerpo opcional>
<pie opcional>
```

### Tipos

```
feat      Agregar feature nueva
fix       Corregir bug
docs      Cambios en documentación
style     Cambios de formato (sin lógica)
refactor  Refactorizar código
perf      Mejora de performance
test      Agregar o actualizar tests
chore     Cambios en build o dependencies
ci        Cambios en CI/CD
```

### Ejemplos

```bash
# Feature
git commit -m "feat(usuarios): agregar endpoint registro"
git commit -m "feat(productos): agregar búsqueda por categoria"

# Bug fix
git commit -m "fix(inventario): corregir cálculo de stock"
git commit -m "fix(ventas): validar cantidad antes de crear orden"

# Documentación
git commit -m "docs: actualizar README con nuevos endpoints"
git commit -m "docs(arquitectura): agregar diagrama de flujo"

# Refactor
git commit -m "refactor(usuarios): mejorar organizaci\u00f3n de carpetas"

# Chore
git commit -m "chore: actualizar dependencias"
git commit -m "chore(docker): mejorar dockerfile"
```

---

## 💻 Standards de Código

### JavaScript

#### Estilo

```javascript
// ✅ BUENO
const getUserById = async (id) => {
  const user = await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return user;
};

// ❌ MALO
const get_user_by_id=(id)=>{
const u=db.query("SELECT * FROM usuarios WHERE id="+id);
return u;
}
```

#### Nombres
- Variables y funciones: `camelCase`
- Clases: `PascalCase`
- Constantes: `UPPER_SNAKE_CASE`
- Archivos: `lowercase-kebab-case.js`

```javascript
// Variables
const userName = 'Juan';
const userEmail = 'juan@example.com';

// Funciones
const calculateTotal = (items) => { ... };

// Clases
class UserService { ... }

// Constantes
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;

// Archivos
user.model.js
user.controller.js
user.service.js
error.handler.js
```

#### Comentarios

```javascript
/**
 * Obtener usuario por ID
 * @param {number} id - ID del usuario
 * @returns {Promise<Object>} Usuario encontrado
 */
const getUserById = async (id) => {
  // Validar que id sea un número positivo
  if (!id || id <= 0) {
    throw new Error('ID inválido');
  }

  return await db.query('SELECT * FROM usuarios WHERE id = ?', [id]);
};
```

#### Async/Await

```javascript
// ✅ BUENO
try {
  const user = await getUserById(1);
  console.log(user);
} catch (error) {
  logger.error(`Error: ${error.message}`);
}

// ❌ MALO (Callbacks)
db.query('SELECT...', (err, result) => {
  if (err) {
    console.log(err);
  }
  console.log(result);
});
```

---

## 🧪 Testing

### Estructura de Tests

```javascript
// user.service.test.js
const UserService = require('../services/user.service');
const UserRepository = require('../models/user.model');

jest.mock('../models/user.model');

describe('UserService', () => {
  let userService;

  beforeEach(() => {
    userService = new UserService(UserRepository);
  });

  describe('getUserById', () => {
    it('should return user when id is valid', async () => {
      const mockUser = { id: 1, name: 'Juan' };
      UserRepository.getUserById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(1);

      expect(result).toEqual(mockUser);
      expect(UserRepository.getUserById).toHaveBeenCalledWith(1);
    });

    it('should throw error when user not found', async () => {
      UserRepository.getUserById.mockResolvedValue(null);

      await expect(userService.getUserById(999)).rejects.toThrow('Usuario no encontrado');
    });
  });
});
```

### Ejecutar Tests

```bash
npm test                  # Ejecutar todos los tests
npm test -- --coverage    # Con cobertura
npm test -- --watch       # Modo watch
```

---

## 📋 Checklist Antes de Push

- [ ] Código funciona localmente
- [ ] Tests pasan (`npm test`)
- [ ] Sin errores de linting (`npm run lint`)
- [ ] Commits con mensajes claros
- [ ] Actualicé documentación si necesario
- [ ] Actualicé `.env.example` si agregué variables
- [ ] Cambios están en rama feature (no en main/develop)
- [ ] Rebaséame con `develop` antes de hacer PR

```bash
# Antes de push
git rm -r node_modules  # No commitear node_modules
git add .
git commit -m "feat: descripción clara"

# Rebase antes de PR (si hay cambios en develop)
git fetch origin
git rebase origin/develop
git push -f origin feature/mi-feature
```

---

## 🔍 Revisión de Código (PR Process)

### Qué Revisar

- **Funcionalidad:** ¿Funciona la feature?
- **Tests:** ¿Hay tests? ¿Pasan?
- **Documentación:** ¿Está actualizada?
- **Código:** ¿Sigue los standards?
- **Seguridad:** ¿Hay vulnerabilidades?
- **Performance:** ¿Hay queries N+1?

### Template de PR

```markdown
## Descripción
Breve descripción de qué cambios se hacen.

## Tipo de cambio
- [ ] Feature nueva
- [ ] Bug fix
- [ ] Breaking change
- [ ] Actualización de documentación

## Cambios
- Descripción del cambio 1
- Descripción del cambio 2

## Testing
- [ ] Tests unitarios pasados
- [ ] Tests de integración pasados
- [ ] Probado en desarrollo local

## Screenshot/Video
[Si aplica]

## Checklist
- [ ] Mi código sigue los standards
- [ ] Actualicé la documentación
- [ ] No agregué dependencias innecesarias
- [ ] Tests pasan
- [ ] Sin código comentado
```

---

## 🚀 Desarrollo Local

### Setup Inicial

```bash
# Clonar repo
git clone https://github.com/usuario/sales-management-microservices.git
cd sales-management-microservices

# Crear fork personal [RECOMENDADO]
git remote add fork https://github.com/TU_USUARIO/sales-management-microservices.git
git remote add upstream https://github.com/REPO_ORIGINAL/sales-management-microservices.git

# Copiar .env
cp .env.example .env

# Instalar dependencias
npm run install:all

# Iniciar desarrollo
npm run dev:build

# Acceder a servicios
- Frontend: http://localhost:3000
- Usuarios: http://localhost:3001
- Productos: http://localhost:3002
```

### Desarrollo por Servicio

```bash
# Terminal 1: Usuarios Service
cd usuarios-service
npm install
npm run dev

# Terminal 2: Productos Service
cd ../productos-service
npm install
npm run dev

# Terminal 3: Docker para BD
docker-compose up mysql rabbitmq
```

---

## 🐛 Reportar Bugs

**No** reportar issues de seguridad públicamente.

### Formato de Bug Report

```markdown
## Descripción
[Descripción clara del bug]

## Pasos para reproducir
1. Paso 1
2. Paso 2
3. Paso 3

## Comportamiento esperado
[Qué debería pasar]

## Comportamiento actual
[Qué pasa realmente]

## Screenshots/Logs
[Si aplica]

## Entorno
- OS: [Windows/Mac/Linux]
- Node: [versión]
- Docker: [versión]
```

---

## 📚 Recursos

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Flow](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Clean Code JS](https://github.com/ryanmcdermott/clean-code-javascript)
- [REST API Best Practices](https://restfulapi.net/)

---

## ❓ Preguntas?

- Discord/Slack del equipo
- Crear discussion en GitHub
- Email al tech lead

---

**¡Gracias por contribuir!** 🎉

**Happy Coding!** 💻
