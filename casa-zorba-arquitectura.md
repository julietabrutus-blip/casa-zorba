# Casa Zorba — Sistema de Gestión de Compras y Pedidos
## Documento de Arquitectura, Diseño y Plan de Desarrollo

---

## SECCIÓN 1: RESUMEN EJECUTIVO DEL SISTEMA

Casa Zorba necesita transformar un proceso 100% manual de compras a proveedores en un sistema automatizado, trazable y escalable. El sistema se denomina **Zorba Operations Platform (ZOP)**.

### Qué hace ZOP

- Se conecta a Tienda Nube y lee los pedidos en tiempo real
- Identifica qué proveedor debe abastecer cada producto
- Consolida productos por proveedor y genera órdenes de compra automáticamente
- Permite revisar, editar y enviar esas órdenes por WhatsApp o email
- Valida las facturas recibidas contra las órdenes emitidas (Módulo 2)
- Controla stock en tránsito y pendiente de entrega
- Mantiene trazabilidad completa: Pedido TN → OC → Envío → Factura → Stock

### Valor de negocio inmediato

- Elimina el trabajo manual de armado de órdenes
- Evita errores de omisión y duplicación
- Da visibilidad en tiempo real del estado de abastecimiento
- Permite escalar el volumen de pedidos sin aumentar el trabajo operativo

---

## SECCIÓN 2: SUPUESTOS Y DEFINICIONES NECESARIAS

### Supuestos adoptados

1. **Un producto tiene UN proveedor principal** asignado. El sistema soportará proveedor alternativo en una fase posterior.
2. **La unidad de trabajo es el pedido de Tienda Nube.** El sistema no parte de facturas.
3. **La consolidación de OC es por proveedor + período.** Por defecto se consolida todo lo pendiente en una OC por proveedor por acción del usuario (no automática al llegar el pedido).
4. **El usuario revisa y confirma antes de enviar.** No hay envío automático sin revisión humana en MVP.
5. **Los precios en la OC son estimados.** El precio real se registra cuando llega la factura.
6. **El stock se calcula como: comprado - entregado a clientes** (no hay almacén físico gestionado en el sistema en MVP).
7. **Autenticación:** un solo usuario administrador en MVP (multi-usuario en fase 2).
8. **Tienda Nube:** se usa la API pública v1. Se necesita obtener Access Token OAuth de la tienda.

### Decisiones de diseño adoptadas

- OC se genera MANUALMENTE por el operador (seleccionando pedidos pendientes), no de forma automática al recibir un pedido. Esto da control al negocio.
- Un pedido puede estar en múltiples OC (si tiene productos de múltiples proveedores).
- Un ítem de pedido puede estar parcialmente asignado a una OC.
- FIFO como criterio de priorización en la vista de pendientes.

---

## SECCIÓN 3: ARQUITECTURA PROPUESTA

### Stack tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | React 18 + Vite + TailwindCSS | Rápido, moderno, gran ecosistema |
| Backend | Node.js 20 + Express | Simple, rápido de desarrollar, gran soporte para APIs |
| Base de datos | PostgreSQL 15 (Neon) | Robusto, relacional, gratuito en Neon |
| ORM | Prisma | Type-safe, migraciones automáticas, excelente DX |
| Auth | JWT + bcrypt | Simple y seguro para MVP |
| OCR (Módulo 2) | Google Vision API | Mayor precisión que Tesseract para facturas en español |
| Storage | Cloudinary (gratuito) | Para facturas PDF/imagen |
| Deploy Frontend | Vercel | Gratis, CI/CD automático desde GitHub |
| Deploy Backend | Render | Gratis (con cold start), CI/CD automático |
| Deploy DB | Neon.tech | PostgreSQL serverless gratuito |

### Arquitectura del sistema

```
┌─────────────────────────────────────────────────────┐
│                    TIENDA NUBE API                   │
└─────────────────────┬───────────────────────────────┘
                      │ OAuth + REST API
┌─────────────────────▼───────────────────────────────┐
│              BACKEND (Node.js/Express)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐  │
│  │TN Service│ │OC Service│ │ Invoice  │ │ Stock  │  │
│  │          │ │          │ │ Service  │ │Service │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘  │
│  ┌──────────────────────────────────────────────┐   │
│  │              Prisma ORM                       │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│          PostgreSQL en Neon.tech                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              FRONTEND (React/Vite)                   │
│  Dashboard │ Pedidos │ OC │ Facturas │ Config │ Stock│
└─────────────────────────────────────────────────────┘

Servicios externos:
- WhatsApp Web (link wa.me) → Fase 1
- WhatsApp Business API → Fase 2
- Cloudinary (storage facturas)
- Google Vision API (OCR facturas)
```

### Estructura de repositorio (monorepo)

```
casa-zorba/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── store/
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## SECCIÓN 4: MODELO DE DATOS

### Diagrama de entidades (simplificado)

```
suppliers ──────────────────────────────────────────┐
    │                                                │
    │ 1:N                                            │
products ──────────────────────────────────────────┐│
    │                                               ││
    │ 1:N                                           ││
order_items_tiendanube ←── orders_tiendanube        ││
    │                           │                   ││
    │ N:M (via links)           │ N:M               ││
purchase_order_items ←── purchase_orders ───────────┘│
                              │                      │
                    purchase_order_links             │
                              │                      │
                    supplier_invoices ───────────────┘
                              │
                    supplier_invoice_items
                              │
                    invoice_match_results
```

### Schema Prisma completo (ver archivo schema.prisma)

Las tablas adicionales respecto al modelo inicial son:

- **stock_movements**: registra entradas (OC recibida) y salidas (pedido TN despachado)
- **audit_logs**: historial de todos los cambios del sistema
- **invoice_match_results**: resultado del matching factura vs OC
- **app_settings**: configuración de la integración con Tienda Nube y otras vars

---

## SECCIÓN 5: FLUJOS FUNCIONALES

### Flujo 1: Sincronización de pedidos

```
Usuario hace clic "Sincronizar" 
→ Backend llama GET /v1/orders a Tienda Nube API
→ Filtra pedidos con estado: "paid" o "open" (confirmados)
→ Para cada pedido nuevo: inserta en orders_tiendanube + order_items_tiendanube
→ Busca el product_id interno para cada ítem por tienda_nube_product_id
→ Calcula cantidad_pendiente_compra = cantidad - cantidad_asignada_compra
→ Retorna resumen de pedidos nuevos / actualizados
```

### Flujo 2: Generación de OC

```
Usuario va a "Productos Pendientes"
→ Sistema muestra ítems con cantidad_pendiente_compra > 0 (ordenados FIFO)
→ Usuario selecciona pedidos o ítems a incluir
→ Hace clic "Generar Órdenes de Compra"
→ Backend agrupa ítems por proveedor
→ Crea una purchase_order por proveedor
→ Crea purchase_order_items para cada producto
→ Crea purchase_order_links vinculando OC ↔ pedidos TN
→ Actualiza cantidad_asignada_compra en cada order_item
→ Estado OC: "borrador"
→ Usuario ve vista previa de cada OC
```

### Flujo 3: Envío por WhatsApp

```
Usuario abre OC en estado "borrador" o "pendiente_envio"
→ Sistema genera mensaje de texto con formato:
  "Hola [Proveedor], les pedimos:\n- [Producto] x [Cantidad]\n..."
→ Usuario puede editar observaciones
→ Clic "Copiar mensaje" → clipboard
→ Clic "Abrir WhatsApp" → abre wa.me/[telefono]?text=[mensaje_encoded]
→ Usuario confirma "Marcar como enviada"
→ Sistema registra en whatsapp_logs + cambia estado OC a "enviada"
```

### Flujo 4: Validación de factura (Módulo 2)

```
Usuario sube imagen/PDF de factura del proveedor
→ Sistema sube archivo a Cloudinary → obtiene URL
→ Llama Google Vision API con la URL
→ Extrae: proveedor, fecha, número, ítems, cantidades, precios
→ Sistema busca OC pendiente de ese proveedor
→ Hace matching ítem por ítem:
   - OK: cantidad y precio coinciden
   - Diferencia cantidad: factura ≠ OC
   - Ítem extra: está en factura pero no en OC
   - Ítem faltante: está en OC pero no en factura
→ Muestra pantalla de validación con semáforo
→ Usuario confirma o ajusta
→ Sistema registra factura como procesada
→ Actualiza stock (entrada de mercadería)
```

### Flujo 5: Control de stock

```
ENTRADAS de stock:
- Se registra cuando una factura de proveedor es confirmada
- Cantidad: lo que dice la factura (validada)

SALIDAS de stock:
- Se registra cuando un pedido TN pasa a estado "shipped" o "delivered"
- Cantidad: lo del pedido TN

Stock disponible = Σ entradas - Σ salidas
Stock en tránsito = OC enviadas pero sin factura confirmada
Stock comprometido = pedidos TN pagados sin despachar
```

---

## SECCIÓN 6: ENDPOINTS / API

### Auth
- `POST /api/auth/login` — login con email + password → JWT
- `POST /api/auth/refresh` — refresh token

### Tienda Nube
- `GET /api/tiendanube/sync` — sincroniza pedidos desde TN
- `GET /api/tiendanube/orders` — lista pedidos sincronizados (con filtros)
- `PATCH /api/tiendanube/orders/:id/fulfillment` — actualiza estado abastecimiento

### Proveedores
- `GET /api/suppliers` — lista proveedores
- `POST /api/suppliers` — crear proveedor
- `PUT /api/suppliers/:id` — editar proveedor
- `DELETE /api/suppliers/:id` — desactivar proveedor

### Productos
- `GET /api/products` — lista productos con su proveedor asignado
- `POST /api/products` — crear producto (con relación a proveedor)
- `PUT /api/products/:id` — editar producto
- `GET /api/products/pending` — productos con cantidad pendiente de compra

### Órdenes de Compra
- `GET /api/purchase-orders` — lista OC con filtros (estado, proveedor, fecha)
- `POST /api/purchase-orders/generate` — genera OC desde ítems seleccionados
- `GET /api/purchase-orders/:id` — detalle de OC con ítems y pedidos origen
- `PATCH /api/purchase-orders/:id/status` — cambiar estado OC
- `PUT /api/purchase-orders/:id` — editar OC (agregar/quitar ítems, obs)
- `POST /api/purchase-orders/:id/send-whatsapp` — registra envío WhatsApp + genera link
- `POST /api/purchase-orders/:id/send-email` — envía email al proveedor
- `DELETE /api/purchase-orders/:id` — cancelar OC (soft delete)

### Facturas (Módulo 2)
- `POST /api/invoices/upload` — sube archivo a Cloudinary
- `POST /api/invoices/:id/process` — corre OCR y extrae datos
- `POST /api/invoices/:id/match` — hace matching con OC
- `GET /api/invoices` — lista facturas
- `GET /api/invoices/:id` — detalle de factura con matching

### Stock
- `GET /api/stock` — vista de stock por producto
- `GET /api/stock/movements` — historial de movimientos
- `GET /api/stock/alerts` — productos con stock bajo o sobrecomprado

### Dashboard
- `GET /api/dashboard/summary` — KPIs: pedidos pendientes, OC activas, ítems sin proveedor, stock crítico

---

## SECCIÓN 7: PANTALLAS / UI

### 1. Dashboard General
- KPIs: Pedidos sin abastecer / OC pendientes de envío / OC sin factura / Stock en alerta
- Gráfico de pedidos por semana
- Actividad reciente (últimas OC, últimas sincronizaciones)
- Botón "Sincronizar Tienda Nube"

### 2. Pedidos de Tienda Nube
- Tabla: N° pedido | Fecha | Cliente | Total | Estado TN | Estado abastecimiento
- Filtros: estado, fecha, abastecido/pendiente
- Click en pedido → detalle con ítems y estado de compra de cada uno

### 3. Productos Pendientes de Abastecimiento
- Tabla agrupada por proveedor
- Columnas: Producto | SKU | Proveedor | Cant. pedida | Cant. asignada | Cant. pendiente | Pedidos origen
- Checkbox para seleccionar qué incluir en OC
- Botón "Generar OC por proveedor seleccionado"

### 4. Órdenes de Compra — Lista
- Tabla: N° OC | Proveedor | Fecha | Estado | Canal envío | Ítems | Acciones
- Estados con colores: Borrador (gris) | Pendiente envío (amarillo) | Enviada (azul) | Confirmada (verde) | Cancelada (rojo)
- Filtros por estado y proveedor

### 5. Detalle de Orden de Compra
- Cabecera: proveedor, fecha, estado, número OC
- Tabla de ítems: producto, código proveedor, cantidad, precio estimado
- Pedidos de TN que originaron esta OC
- Observaciones (editable)
- Botones: Editar | Enviar WhatsApp | Enviar Email | Cancelar

### 6. Pantalla Envío WhatsApp / Email
- Vista previa del mensaje generado (editable)
- Número de WhatsApp del proveedor (editable en el momento)
- Botón "Copiar mensaje"
- Botón "Abrir WhatsApp Web"
- Botón "Ya lo envié manualmente" → marca como enviada
- Alternativa: formulario de email con asunto y cuerpo

### 7. Carga de Factura (Módulo 2)
- Upload de imagen o PDF (drag & drop)
- Preview del archivo
- Selección del proveedor si no se detecta automáticamente
- Botón "Procesar con OCR"

### 8. Validación Factura vs OC
- Lado izquierdo: datos extraídos por OCR
- Lado derecho: datos de la OC correspondiente
- Tabla de matching ítem por ítem con semáforo (OK / Diferencia / Extra / Faltante)
- Resumen: total factura vs total OC
- Botón "Confirmar factura" → actualiza stock

### 9. Configuración — Productos y Proveedores
- CRUD de proveedores: nombre, teléfono WhatsApp, email, modo envío preferido
- CRUD de productos: nombre, SKU Zorba, código proveedor, proveedor asignado, activo

### 10. Tabla de Equivalencias
- Grilla editable: Código Zorba | Nombre | Código Proveedor | Proveedor | SKU TN
- Import/Export CSV
- Buscador por código o nombre

### 11. Stock
- Tabla por producto: stock disponible | en tránsito | comprometido | disponible neto
- Historial de movimientos por producto
- Alertas configurables (stock mínimo)

---

## SECCIÓN 8: PLAN DE DESARROLLO POR ETAPAS

### ETAPA 1 — MVP Core (4-6 semanas)
Objetivo: el flujo completo de pedido → OC → WhatsApp funcionando.

- [ ] Setup proyecto (monorepo, DB, deploy inicial)
- [ ] Auth básica (login/JWT)
- [ ] Integración Tienda Nube (sync pedidos)
- [ ] CRUD Proveedores y Productos
- [ ] Tabla de equivalencias producto → proveedor
- [ ] Generación de OC por proveedor
- [ ] Vista previa y edición de OC
- [ ] Envío por WhatsApp (link wa.me)
- [ ] Envío por email (nodemailer)
- [ ] Dashboard básico
- [ ] Deploy completo en Vercel + Render + Neon

### ETAPA 2 — Facturación y Stock (3-4 semanas)
- [ ] Upload de facturas (Cloudinary)
- [ ] OCR con Google Vision API
- [ ] Matching factura vs OC
- [ ] Confirmación de factura
- [ ] Módulo de stock (entradas/salidas/movimientos)
- [ ] Alertas de stock
- [ ] Dashboard con KPIs completos

### ETAPA 3 — Optimización (2-3 semanas)
- [ ] Import/Export CSV de productos
- [ ] Historial de cambios y auditoría
- [ ] Multi-usuario con roles
- [ ] WhatsApp Business API
- [ ] Reportes de rentabilidad por pedido
- [ ] Análisis de costos financieros

---

## SECCIÓN 9: RIESGOS Y DECISIONES IMPORTANTES

### Riesgo 1: API de Tienda Nube — Rate Limiting
TN limita a 40 requests/minuto. Si hay muchos pedidos, la sincronización puede ser lenta.
**Solución**: paginación + retry con backoff + timestamp de última sync.

### Riesgo 2: Productos sin proveedor asignado
Si un producto de TN no tiene proveedor en ZOP, no puede generar OC.
**Solución**: pantalla de "ítems sin asignar" que alerta y permite asignar rápido.

### Riesgo 3: OCR con baja precisión en facturas manuscritas o de baja calidad
**Solución**: Google Vision es muy bueno pero igual mostrar siempre los datos extraídos para corrección manual antes de confirmar.

### Riesgo 4: Duplicación de pedidos en OC
Si el usuario genera OC dos veces por error.
**Solución**: sistema bloquea ítems ya asignados (cantidad_asignada_compra = cantidad). Solo se puede forzar asignación doble con acción explícita.

### Riesgo 5: Sincronización en tiempo real vs manual
**Decisión adoptada**: sincronización manual con botón. Se puede agregar webhook de TN en etapa 3.

### Riesgo 6: Precios en OC
No siempre se conoce el precio de compra al generar la OC.
**Solución**: campo precio_estimado es opcional en MVP. El precio real se carga con la factura.
