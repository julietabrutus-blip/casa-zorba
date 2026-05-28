# Guía de Deploy — Casa Zorba Operations Platform
## Vercel (Frontend) + Render (Backend) + Neon (Base de datos)
### Todo gratuito ✅

---

## PASO 1 — Base de datos en Neon (PostgreSQL gratuito)

1. Ir a https://neon.tech y crear cuenta
2. Crear nuevo proyecto: **casa-zorba**
3. Copiar la **Connection String** que tiene este formato:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Guardarla — la vas a usar en el backend

---

## PASO 2 — Repositorio en GitHub

1. Crear cuenta en https://github.com si no tenés
2. Crear repositorio nuevo: **casa-zorba**
3. Subir el código:
   ```bash
   cd casa-zorba
   git init
   git add .
   git commit -m "Initial commit — Zorba Operations Platform"
   git remote add origin https://github.com/TU_USUARIO/casa-zorba.git
   git push -u origin main
   ```

---

## PASO 3 — Backend en Render (gratuito)

1. Ir a https://render.com y crear cuenta con GitHub
2. Clic en **New → Web Service**
3. Conectar tu repo **casa-zorba**
4. Configurar:
   - **Name:** casa-zorba-backend
   - **Root Directory:** backend
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push`
   - **Start Command:** `npm start`
   - **Plan:** Free

5. En **Environment Variables**, agregar:
   ```
   DATABASE_URL         = [tu connection string de Neon]
   JWT_SECRET           = [genera uno largo: openssl rand -base64 32]
   JWT_EXPIRES_IN       = 7d
   NODE_ENV             = production
   FRONTEND_URL         = https://casa-zorba.vercel.app
   TIENDA_NUBE_CLIENT_ID      = [de tu app TN]
   TIENDA_NUBE_CLIENT_SECRET  = [de tu app TN]
   TIENDA_NUBE_ACCESS_TOKEN   = [de tu tienda TN]
   TIENDA_NUBE_STORE_ID       = [ID de tu tienda TN]
   TIENDA_NUBE_API_URL        = https://api.tiendanube.com/v1
   SMTP_HOST            = smtp.gmail.com
   SMTP_PORT            = 587
   SMTP_USER            = [tu email]
   SMTP_PASS            = [app password de Gmail]
   EMAIL_FROM           = Casa Zorba <tu@email.com>
   ```

6. Clic **Create Web Service** → esperar que deployee (~5 min)
7. Copiar la URL del backend: `https://casa-zorba-backend.onrender.com`

### ⚠️ Crear el primer usuario (una sola vez)
Una vez deployado el backend, ejecutar desde Render Shell o localmente:
```bash
cd backend
npm run db:seed
```
Esto crea: **admin@casazorba.com** / **zorba2024**
**Cambiá el password inmediatamente después.**

---

## PASO 4 — Frontend en Vercel (gratuito)

1. Ir a https://vercel.com y crear cuenta con GitHub
2. Clic en **New Project**
3. Importar tu repo **casa-zorba**
4. Configurar:
   - **Framework Preset:** Vite
   - **Root Directory:** frontend
   - **Build Command:** `npm run build`
   - **Output Directory:** dist

5. En **Environment Variables**, agregar:
   ```
   VITE_API_URL = https://casa-zorba-backend.onrender.com/api
   ```

6. Clic **Deploy** → esperar ~2 min
7. Tu app queda en: `https://casa-zorba.vercel.app`

---

## PASO 5 — Obtener credenciales de Tienda Nube

1. Ir a https://www.tiendanube.com/tienda/aplicaciones/crear
2. Crear una nueva aplicación:
   - Nombre: Casa Zorba Operations
   - Redirect URI: `https://casa-zorba-backend.onrender.com/api/auth/tiendanube/callback`
3. Guardar **Client ID** y **Client Secret**
4. Para obtener el **Access Token**:
   - El flujo OAuth de TN requiere autorizar la app desde el panel de tu tienda
   - O podés usar la API de TN con un token de prueba desde el panel de partners
   - URL de autorización: `https://www.tiendanube.com/apps/{CLIENT_ID}/authorize`

---

## PASO 6 — Verificar que todo funciona

1. Abrir `https://casa-zorba.vercel.app`
2. Login con `admin@casazorba.com` / `zorba2024`
3. Ir a Dashboard → clic **Sincronizar Tienda Nube**
4. Si hay pedidos en TN, deberían aparecer en **Pedidos**
5. Ir a **Proveedores** → crear tu primer proveedor
6. Ir a **Productos** → crear productos y asignarlos al proveedor
7. Ir a **Pendientes** → seleccionar ítems → **Generar OC**
8. Ir a **Órdenes de Compra** → abrir la OC → **WhatsApp**

---

## Notas importantes sobre el plan gratuito

| Plataforma | Limitación gratuita |
|-----------|-------------------|
| Render | El servidor "duerme" después de 15 min sin uso. El primer request tarda ~30 seg en despertar. |
| Neon | 0.5 GB de storage, suficiente para cientos de miles de registros |
| Vercel | Sin límite práctico para apps de este tipo |

### Para evitar el cold start de Render
Podés usar un servicio como https://uptimerobot.com (gratuito) para hacer un ping cada 14 minutos y mantener el servidor activo.

---

## Estructura de archivos generados

```
casa-zorba/
├── backend/
│   ├── prisma/
│   │   └── seed.js
│   ├── src/
│   │   ├── config/prisma.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── tiendanube.controller.js
│   │   │   ├── supplier.controller.js
│   │   │   ├── product.controller.js
│   │   │   ├── purchaseOrder.controller.js
│   │   │   ├── invoice.controller.js
│   │   │   ├── stock.controller.js
│   │   │   └── dashboard.controller.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── tiendanube.routes.js
│   │   │   ├── supplier.routes.js
│   │   │   ├── product.routes.js
│   │   │   ├── purchaseOrder.routes.js
│   │   │   ├── invoice.routes.js
│   │   │   ├── stock.routes.js
│   │   │   └── dashboard.routes.js
│   │   ├── services/
│   │   │   ├── tiendanube.service.js
│   │   │   └── purchaseOrder.service.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── tiendanube.js
│   │   │   ├── purchaseOrders.js
│   │   │   ├── products.js
│   │   │   ├── suppliers.js
│   │   │   ├── dashboard.js
│   │   │   └── stock.js
│   │   ├── components/Layout.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── OrdersPage.jsx
│   │   │   ├── PendingPage.jsx
│   │   │   ├── PurchaseOrdersPage.jsx
│   │   │   ├── PurchaseOrderDetailPage.jsx
│   │   │   ├── SuppliersPage.jsx
│   │   │   ├── ProductsPage.jsx
│   │   │   └── StockPage.jsx
│   │   ├── store/auth.store.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── schema.prisma
├── casa-zorba-arquitectura.md
└── DEPLOY-GUIDE.md
```
