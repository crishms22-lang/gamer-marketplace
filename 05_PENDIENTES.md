# Registro de decisiones pendientes — v0.4

Este registro distingue decisiones confirmadas de asuntos todavía abiertos. No inventar respuestas para los puntos pendientes.

## A. Confirmado por el propietario
1. Edad mínima de 18 años.
2. Contador de sanciones global.
3. Escala ordinaria: 1 día, 3 días, 7 días y luego baneo.
4. Suspensiones en días corridos.
5. El contador se reinicia para sanciones al cumplirse un mes; el historial completo se conserva.
6. Durante suspensión se bloquean contratación, comentarios y calificaciones a prestadores.
7. Apelaciones con objetivo de 1 hora a 3 días hábiles, sin importar el día de presentación; revisa una autoridad superior no implicada.
8. El baneo no elimina el historial necesario de contrataciones y decisiones.
9. Cancelación: primeros 3 minutos antes del inicio sin comisión; después y antes del inicio 10%; una vez iniciado 60%, apelable. Base: precio del servicio, excluyendo cargos adicionales.
10. Hay una espera/ventana de al menos 5 minutos antes de entrar con el prestador; es independiente de los 3 minutos gratuitos de cancelación.
11. Clientes y prestadores pueden calificarse mutuamente solo después de una contratación real validada.
12. Solo prestadores aprobados pueden ver y solicitar retiros de ganancias elegibles; clientes no ven esas opciones.
13. Los Coins comprados no son retirables; prestadores no pueden comprarlos; UI y backend/API deben bloquear la compra.
14. Las tablas de compra y retiro son independientes y editables por el administrador.
15. Ajustes manuales de Coins requieren razón y auditoría.
16. El administrador aprueba prestadores; al postularse no deben estar sancionados y el historial puede influir en selección.
17. Solicitudes de staff inicialmente revisadas por administrador; el propietario puede delegar esta función más adelante.
18. El propietario tiene autoridad máxima y los demás actúan según permisos.
19. Menú de tres líneas con disputas, apelaciones, cancelaciones, reembolsos y solicitudes de prestadores/staff.

## B. Pendientes operativos y de producto
1. **Cancelación — aclaración confirmada:** solo los primeros 3 minutos son gratuitos. La espera de al menos 5 minutos antes de entrar con el prestador es independiente y no amplía la ventana gratuita.
2. Definir qué evento exacto inicia el reloj de cancelación y qué prueba que el servicio comenzó; además, quién recibe la comisión y las reglas por desconexión, fuerza mayor, fallo de plataforma, culpa del prestador y contracargos.
3. Definir si “un mes” del contador es mes calendario o fecha a fecha.
4. Definir el alcance completo de suspensión, más allá de contratar, comentar y calificar.
5. Definir horario/zona horaria hábil, inicio/pausas del reloj de apelación y plazo para presentarla.
6. Definir catálogo de faltas muy graves, quién puede imponer medidas urgentes y tiempos de revisión.
7. Definir criterios objetivos de admisión de prestadores por juego, pruebas mínimas, tiempos de revisión y vigencia.
8. Definir edad mínima del staff, período de prueba, criterios por puesto y tiempos de respuesta.
9. Definir tratamiento de reseñas en caso de reembolso, contratación cancelada o disputa; mecanismo contra reseñas falsas/abusivas.
10. Definir plazos de contratación, expiración de solicitudes/reservas, no presentación, evidencias requeridas, moderación y soporte.
11. Definir caducidad de Coins, política de reembolso y contracargos, cargos/impuestos del checkout y tratamiento al cerrar una cuenta.
12. Definir plazos de retención de datos/evidencias, acceso, restauración de cuenta y procesos de privacidad/derechos ARCO.

## C. Bloqueantes antes de activar dinero real
1. Definir qué representa exactamente el saldo/unidad que puede retirarse mediante la tabla de retiro; confirmar que no proviene de Coins comprados.
2. Definir si los valores de retiro son MXN netos, brutos o antes de cargos/impuestos; establecer monto mínimo, límites, tiempos y comisiones.
3. Definir el paquete de retiro de $1,200 MXN por 6,000 Coins y si incluye algún bono. No se ha aprobado bono en esta tabla actualizada.
4. Definir cómo los prestadores podrán contratar a otros prestadores sin comprar Coins ni convertir Coins comprados en efectivo.
5. Elegir proveedor de pagos y verificar que admite el modelo de Coins, marketplace, prestadores y retiros.
6. Definir verificación de identidad/titularidad, prevención de fraude, contracargos, conciliación y manejo de pagos fallidos.
7. Revisar obligaciones fiscales, IVA/ISR, CFDI, retenciones, contratos con prestadores, privacidad, términos, cookies y reembolsos en México.
8. Probar ledger, idempotencia, auditoría, permisos, reembolsos y conciliación antes de producción.

## D. Personalización del panel de administración
- Poder agregar, editar, desactivar y retirar paquetes de compra y equivalencias de retiro.
- Guardar versiones, actor, fecha/hora, motivo y vigencia de cada cambio.
- No alterar compras confirmadas ni retiros pendientes al editar las tablas, salvo procedimiento explícito, autorizado y auditado.
- Permitir ajustes manuales de Coins solo con permiso específico, razón obligatoria y registro inmutable de auditoría.
- Mantener saldos separados por origen y un libro de movimientos; no depender solo de un saldo editable.
