# Gamer Marketplace — código fuente MVP

**Versión:** 1.0 · **Fecha:** 21 de octubre de 2026  
**Tecnología:** Node.js + Express + PostgreSQL + HTML/CSS/JavaScript  
**Objetivo:** primera demo pública controlada con Coins de prueba. No es una plataforma lista para cobrar dinero real.

## Qué incluye
- Interfaz responsive en español, estilo gamer oscuro con acentos violeta/cian.
- Navegación Inicio, Explorar, Contratos, Coins y Perfil.
- Categorías: Minecraft, Fortnite, Warzone y Free Fire.
- Registro con edad mínima de 18 años y verificación telefónica simulada en modo demo.
- Publicaciones pendientes de aprobación manual.
- Saldo de prueba separado entre Coins compradas y ganadas.
- Contratos con saldo retenido y comisión del 30% / proveedor 70%.
- Entrega, reseña, disputa, cancelación solicitada para revisión manual.
- Panel de moderación, resumen financiero en Coins, crédito manual de prueba y libro de auditoría.
- PostgreSQL con restricciones, historial append-only lógico e idempotencia en créditos.
- Health check para Render: `/api/health`.

## Límites intencionales de esta versión
- **No hay cobros, depósitos, retiros ni transferencias reales.** `REAL_MONEY_ENABLED` debe permanecer `false`.
- No hay integración SMS real. `DEMO_MODE=true` muestra el código de prueba en pantalla; cualquiera que pueda acceder a la demo podría usarla. No usar este modo como autenticación de una plataforma real.
- No está implementada una liberación automática a las 72 horas; el usuario debe confirmar la entrega o abrir una disputa.
- Cancelaciones solo crean solicitudes para revisión manual; no ejecutan fórmulas de reembolso ni multas porque las reglas financieras exactas siguen pendientes.
- La administración de disputas permite reembolso total o liberación al proveedor; los resultados parciales se deben revisar manualmente fuera de este MVP.
- No se han integrado proveedores de pago, cumplimiento fiscal, revisión legal, notificaciones SMS/email, carga segura de archivos ni verificación de identidad.
- Este proyecto no puede garantizar “cero errores”; se incluye una lista de pruebas y hay que probarlo en el entorno de Render antes de invitar usuarios.

## Requisitos
- Node.js 20 o superior
- PostgreSQL 14 o superior
- npm

## Ejecutar localmente
1. Instala Node.js 20+ y PostgreSQL.
2. Crea una base de datos vacía, por ejemplo `gamer_marketplace`.
3. Copia `.env.example` a `.env` y configura `DATABASE_URL`.
4. Cambia `JWT_SECRET` por un secreto aleatorio largo (mínimo 32 caracteres).
5. Para demo local, `DEMO_MODE=true`. Usa un teléfono de prueba en `OWNER_PHONE` si necesitas propietario.
6. Ejecuta:

```bash
npm install
npm run check
npm test
npm start
```

7. Abre `http://localhost:3000`.

El servidor crea las tablas a partir de `db.sql` al iniciar. Mantén `OWNER_PHONE` como el teléfono exacto normalizado que registrarás para la cuenta propietaria. En el primer registro con ese teléfono, la cuenta recibe el rol `owner`.

## Desplegar en Render
1. Sube el contenido de este ZIP a un repositorio nuevo o a la rama que decidas. No se ha actualizado tu GitHub automáticamente.
2. En Render crea una base de datos **PostgreSQL**. Copia su **Internal Database URL** al servicio web como `DATABASE_URL` cuando estén en la misma región.
3. Crea un Web Service desde el repositorio.
4. Build command: `npm install`; Start command: `npm start`.
5. Variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` = Internal Database URL de Render PostgreSQL
   - `JWT_SECRET` = secreto aleatorio largo (Render puede generarlo)
   - `DEMO_MODE=true` solo para una prueba controlada
   - `REAL_MONEY_ENABLED=false`
   - `OWNER_PHONE` = teléfono normalizado de la cuenta propietaria que registrarás
6. Despliega y abre `/api/health`. Debe devolver `{"ok":true,...}`.
7. Registra la cuenta propietaria usando el teléfono de `OWNER_PHONE`, toma el código demo y completa el perfil. No publiques el teléfono de administración.
8. Antes de invitar personas, prueba con dos cuentas de prueba: cliente y proveedor. Acredita Coins de prueba desde el panel propietario con una clave de idempotencia única.
9. Para una demo realmente pública, desactiva el registro abierto o integra SMS real y controles de abuso antes de exponer el sitio. En este MVP no existe un sistema de invitaciones/registro cerrado, por lo que la demo abierta no es adecuada para producción.

## Seguridad y datos
- No subir `.env`, contraseñas ni secretos a GitHub.
- Usa solo datos de prueba. No uses tarjetas ni cuentas bancarias reales.
- `DEMO_MODE=true` es solo para pruebas y muestra el código OTP al cliente.
- El uso de `ssl: rejectUnauthorized=false` en producción facilita la conexión a PostgreSQL administrado, pero para entornos que requieran verificación estricta del certificado se debe configurar CA/SSL correctamente.
- El libro de movimientos registra actor, referencia, motivo, cantidad y clave de idempotencia en los flujos relevantes. La primera versión todavía requiere revisión de seguridad independiente antes de manejar fondos reales.
- La tabla de `ledger_entries` se usa para historial; no hay interfaz para borrar movimientos. Un ajuste correctivo debe hacerse mediante otro asiento.
- La comisión se registra en Coins internas y no representa MXN ni beneficio neto.

## Reglas actuales del producto reflejadas
- Comisión estándar del 30% y proveedor recibe el 70% al completar.
- Todas las publicaciones pasan revisión manual.
- Todos los usuarios pueden publicar y comprar.
- Multas/bonificaciones en fondo separado.
- No Premium, anuncios, promociones pagadas ni programa especial de profesionales.
- La equivalencia final de Coins, reglas de cancelación y retiros están pendientes y no se simulan como operaciones reales.

## Estructura
- `server.js` — API y servidor web
- `db.sql` — esquema PostgreSQL
- `public/` — interfaz
- `render.yaml` — plantilla de despliegue Render
- `.env.example` — variables de entorno de ejemplo
- `test/` — pruebas básicas
