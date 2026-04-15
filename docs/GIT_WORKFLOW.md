# 🌳 Git Branches & Workflow Guide

## Estrategia: Git Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  MAIN (Producción)                          │
│                 ⬆️  (merges from release)                   │
└─────────────────────────────────────────────────────────────┘
                           ↑
┌─────────────────────────────────────────────────────────────┐
│                 DEVELOP (Integración)                       │
│              ⬆️  (merges from features)                     │
└─────────────────────────────────────────────────────────────┘
          ↑                     ↑                    ↑
    feature/***          bugfix/***            hotfix/***
    (Dev 1)              (Dev 2)               (Dev 3)
```

---

## 📋 Ramas Recomendadas por Desarrollador

### Desarrollador 1: Usuarios Service

**Rama Principal:** `feature/usuarios`

```bash
# Crear rama
git checkout develop
git pull origin develop
git checkout -b feature/usuarios

# Trabajar en:
- src/controllers/auth.controller.js
- src/services/auth.service.js
- src/models/user.model.js
- Endpoints de autenticación
- JWT implementation
- Password hashing

# Subir cambios
git add .
git commit -m "feat(usuarios): crear endpoint login"
git push origin feature/usuarios

# Crear PR en GitHub
# Base: develop
# Compare: feature/usuarios
```

### Desarrollador 2: Productos Service

**Rama Principal:** `feature/productos`

```bash
# Crear rama
git checkout develop
git pull origin develop
git checkout -b feature/productos

# Trabajar en:
- src/controllers/product.controller.js
- src/services/product.service.js
- src/models/product.model.js
- Endpoints de productos
- Búsqueda y filtrado
- Categorías

# Commits
git commit -m "feat(productos): CRUD endpoints"
git commit -m "feat(productos): agregar busqueda por categoria"
git push origin feature/productos
```

### Desarrollador 3: Ventas & Inventario

**Rama Principal:** `feature/ventas-inventario`

```bash
# Crear rama
git checkout develop
git pull origin develop
git checkout -b feature/ventas-inventario

# Trabajar en:
- ventas-service/
- inventario-service/
- Endpoints de órdenes
- Gestión de stock
- RabbitMQ events
- Integración inter-servicios

# Commits
git commit -m "feat(ventas): crear endpoint ordenes"
git commit -m "feat(inventario): reservar stock"
git commit -m "feat(rabbitmq): publicar eventos"
git push origin feature/ventas-inventario
```

---

## 🔄 Flujo Completo: Paso a Paso

### 1️⃣ Crear Feature Branch

```bash
# Terminal
git checkout develop
git pull origin develop
git checkout -b feature/usuarios-login

# Confirmación
git branch -a
# Deberías ver:
# * feature/usuarios-login (rama actual)
#   develop
#   main
#   origin/develop
#   origin/main
```

### 2️⃣ Hacer Cambios en Local

```bash
# Editar archivos
vim usuarios-service/src/controllers/auth.controller.js
vim usuarios-service/src/services/auth.service.js

# Ver cambios
git status

# Staging
git add usuarios-service/

# Commit con mensaje descriptivo
git commit -m "feat(usuarios): implementar endpoint login"
git commit -m "feat(usuarios): agregar validacion email"
git commit -m "feat(usuarios): generar JWT token"

# Ver commits
git log --oneline -5
```

### 3️⃣ Subir a GitHub

```bash
# Push a rama feature
git push origin feature/usuarios-login

# Confirmación en GitHub
# - Ir a https://github.com/tu-usuario/repo
# - Ver "Compare & pull request"
```

### 4️⃣ Crear Pull Request

En GitHub:

1. Click en **"Compare & pull request"**
2. Verificar:
   - **Base:** develop ✓
   - **Compare:** feature/usuarios-login ✓
3. Título: `Implementar autenticación JWT`
4. Descripción:
   ```markdown
   ## Descripción
   Agrega endpoints de login y generación de JWT tokens para usuarios.

   ## Tipo de cambio
   - [x] Feature nueva
   - [ ] Bug fix
   - [ ] Breaking change

   ## Cambios
   - Endpoint POST /auth/login
   - Endpoint POST /auth/refresh
   - Validación de credenciales
   - JWT token generation

   ## Testing
   - [x] Tests unitarios
   - [x] Probado en desarrollo local
   - [x] Probado con Postman

   ## Checklist
   - [x] Código sigue standards
   - [x] Documentado
   - [x] Tests pasan
   ```

5. Click en **"Create pull request"**

### 5️⃣ Code Review

- Mínimo 2 aprobaciones
- Resolver comentarios
- Si hay cambios:
  ```bash
  git add .
  git commit -m "fix: resolver feedback del review"
  git push origin feature/usuarios-login
  # PR se actualiza automáticamente
  ```

### 6️⃣ Merge a Develop

- Un revisor hace click en **"Merge pull request"**
- Seleccionar **"Create a merge commit"**
- Delete branch option
- PR cerrado automáticamente

### 7️⃣ Actualizar Local

```bash
# Volver a develop
git checkout develop
git pull origin develop

# Tu rama local se puede eliminar
git branch -d feature/usuarios-login
```

---

## 🔀 Sincronizar con Develop

Si hay cambios en `develop` mientras trabajas:

```bash
# Opción 1: Rebase (Recomendado)
git fetch origin
git rebase origin/develop
git push -f origin feature/usuarios-login

# Opción 2: Merge
git fetch origin
git merge origin/develop
git push origin feature/usuarios-login

# En caso de conflictos:
# - Editar archivos
# - git add .
# - git rebase --continue (o git merge --continue)
# - git push -f (si usaste rebase)
```

---

## 🚨 Situaciones Especiales

### Bug en Producción (Hotfix)

```bash
# Partir desde main (no develop)
git checkout main
git pull origin main
git checkout -b hotfix/bug-critico

# Hacer cambios
git commit -m "fix: corregir bug en login"
git push origin hotfix/bug-critico

# PR a main y develop
# 1. Merge a main
# 2. Merge a develop (para mantener sincronizado)
```

### Cambios en Main que faltan en Develop

```bash
# Si main tiene cambios que no están en develop
git checkout develop
git pull origin main
git push origin develop
```

---

## 📊 Estado de Ramas

```bash
# Ver todas las ramas
git branch -a

# Ver ramas remotas
git branch -r

# Ver ramas con último commit
git branch -v

# Ver ramas merged en develop
git branch --merged develop

# Ver ramas no merged
git branch --no-merged develop
```

---

## 🧹 Limpiar Ramas Locales

```bash
# Eliminar rama local
git branch -d feature/usuarios-login

# Forzar eliminación
git branch -D feature/usuarios-login

# Limpiar referencias remotas eliminadas
git remote prune origin

# Eliminar todas las ramas merged
git branch --merged | xargs git branch -d
```

---

## 📈 Visualizar Árbol de Commits

```bash
# Árbol simple
git log --graph --oneline --all

# Árbol detallado
git log --graph --decorate --oneline --all

# Alias útil (agregar a .gitconfig)
git config --global alias.tree 'log --graph --decorate --oneline --all'
git tree
```

---

## ✅ Checklist Intra-Branch

```bash
# Antes de hacer push
[ ] git status  # Sin cambios no staged
[ ] git diff    # Revisar cambios
[ ] npm test    # Tests pasan
[ ] npm run lint # Sin errores

# Commits
[ ] Mensajes descriptivos
[ ] Relacionados a feature específica
[ ] Sin debug/console.log

# Antes de PR
[ ] Actualizado con develop: git rebase origin/develop
[ ] Código funciona localmente: npm run dev
[ ] Tests pasan: npm test
[ ] Documentación actualizada
[ ] .env.example actualizado (si necesario)

# Antes de merge
[ ] 2 approvals mínimo
[ ] Todos los comentarios resueltos
[ ] CI/CD verde (builds pasan)
[ ] Conflictos resueltos
```

---

## 🔗 Comandos Rápidos

```bash
# Crear y cambiar de rama
git checkout -b feature/nueva-feature

# Cambiar de rama
git checkout develop

# Subir cambios
git add .
git commit -m "mensaje"
git push origin feature/nueva-feature

# Rebase interactivo (limpiar commits)
git rebase -i develop

# Squash commits
git rebase -i HEAD~3  # Últimos 3 commits

# Cherry-pick un commit
git cherry-pick abc123

# Deshacer commit (sin perder cambios)
git reset --soft HEAD~1

# Ver diff
git diff develop..feature/nueva  # Cambios en la rama

# Stash cambios
git stash           # Guardar sin commit
git stash pop       # Recuperar
git stash list      # Ver lista
```

---

## 📚 Recursos

- [Git Flow Cheatsheet](https://danielkummer.github.io/git-flow-cheatsheet/)
- [Pro Git Book](https://git-scm.com/book/en/v2)
- [Atlassian Git Tutorials](https://www.atlassian.com/git/tutorials)

---

**¡Keep calm and git push!** 🚀
