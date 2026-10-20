# Requisitos técnicos, legales y pendientes

Este archivo no inventa decisiones faltantes. Distingue obligaciones de implementación de temas que requieren confirmación o revisión profesional.

## Requisitos técnicos
- [ ] Validar transferencias reales antes de acreditar Coins.
- [ ] Detectar referencias y comprobantes duplicados.
- [ ] Asegurar idempotencia de cobros, acreditaciones, reembolsos y retiros.
- [ ] Libro contable con origen de Coins y trazabilidad de contrato, pago, comisión, ganancia, retención y retiro.
- [ ] Bloquear retiros de Coins compradas/promocionales.
- [ ] Proteger registros financieros y registrar ajustes.
- [ ] Implementar temporizadores de aceptación, reserva, cancelación, ausencia y desconexión.
- [ ] Definir zona horaria oficial.
- [ ] Definir técnicamente qué cuenta como actividad de proveedor.
- [ ] Probar permisos por rol, recuperación, sesiones, 2FA opcional, respaldos y recuperación ante fallos.
- [ ] Probar que las sanciones no bloqueen acceso a soporte e historial.
- [ ] Probar que los cambios de configuración no alteren operaciones confirmadas.

## Pendientes financieros antes de habilitar retiros
- [ ] Implementar las equivalencias como conversión de ganancias elegibles, no como opciones de retiro individual. El mínimo de solicitud de retiro es $100 MXN.
- [ ] Confirmar la fórmula exacta de conversión y cómo se calcula el importe pagadero a partir de las ganancias elegibles.
- [ ] Definir redondeos, costos bancarios, comisiones de procesamiento y forma de informarlos.
- [ ] Definir conciliación de transferencias manuales.
- [ ] Definir retiros rechazados, devueltos o enviados a datos incorrectos.
- [ ] Definir tratamiento de contracargos posteriores al pago al proveedor.
- [ ] Verificar identidad/datos de pago exigidos por proveedor y legislación.
- [ ] Revisar impuestos, facturación, contabilidad y retenciones aplicables.
- [ ] Definir conservación de comprobantes de pago.

## Revisión legal/fiscal en México
Un profesional debe revisar antes de operar financieramente:
- [ ] Términos y condiciones para clientes y proveedores.
- [ ] Contratos y responsabilidades de plataforma, clientes y proveedores.
- [ ] Aviso de privacidad, derechos de las personas y conservación de datos.
- [ ] Cookies y consentimiento.
- [ ] Cancelaciones, reembolsos, disputas y contracargos.
- [ ] Tratamiento fiscal de Coins, comisiones, ingresos y pagos.
- [ ] Facturación y comprobantes aplicables.
- [ ] Reglas aplicables a intermediación, transferencias y pagos a proveedores.
- [ ] Requisitos de identificación, prevención de fraude y seguridad de pagos.
- [ ] Notificación de incidentes de seguridad o privacidad cuando corresponda.

## Pruebas de aceptación financiera
- [ ] Pago válido acredita exactamente una vez.
- [ ] Pago no confirmado no acredita Coins.
- [ ] Pago duplicado no duplica saldo.
- [ ] Contrato completado calcula 10 % sobre precio del servicio, excluyendo cargos adicionales.
- [ ] Cancelación aplica 0 %, 10 % o 60 % según etapa.
- [ ] Disputa retiene solo importe discutido cuando sea posible.
- [ ] Ganancias esperan 24 horas si no hay reclamación.
- [ ] Retiro verifica elegibilidad, mínimo $100 MXN (sin confundirlo con equivalencias inferiores), aprobación manual y auditoría.
- [ ] Retiro aprobado tiene objetivo de 1 día hábil si datos completos y sin incidentes externos.
- [ ] Reembolso no puede ejecutarse dos veces.
- [ ] Ajuste manual solo lo hace propietario y queda auditado.
- [ ] Cambio de equivalencia no afecta operaciones confirmadas.

## No inventar
- Costos reales de bancos/proveedores, obligaciones fiscales concretas y plazos legales de conservación deben verificarse.
- El plazo de reporte de 24 horas para disputas está sujeto a derechos legales, contracargos y problemas descubiertos posteriormente.
- La tabla de equivalencias de retiro no implica que Coins compradas o promocionales sean retirables.
- Cualquier asunto no definido debe registrarse y revisarse imparcialmente, no convertirse en regla automática sin aprobación.

## Advertencia de estado
El paquete consolida decisiones de negocio; no demuestra que la plataforma esté implementada, que pruebas hayan pasado ni que exista aprobación legal o fiscal. Marcar casillas solo cuando haya evidencia de finalización.
