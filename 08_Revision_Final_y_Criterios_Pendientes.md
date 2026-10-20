# Revisión final y criterios pendientes

## Correcciones incorporadas
- La tabla de retiro se identifica expresamente como tabla de equivalencias de conversión de ganancias elegibles, no como lista de retiros individuales.
- El mínimo de solicitud de retiro se mantiene en $100 MXN y se repite en las reglas de Coins, proveedores y pruebas técnicas.
- Se aclara que la tabla no hace retirables las Coins compradas ni las promocionales.
- El índice refleja esta revisión y confirma que el paquete aún no se ha subido a GitHub.

## Reglas revisadas por coherencia
- La comisión por contrato completado es del 10 % del precio del servicio, excluyendo cargos adicionales. La comisión de cancelación (0 %, 10 % o 60 %, según la etapa) es una regla separada y se destina a la plataforma según la decisión documentada.
- La aceptación del proveedor inicia el temporizador de cancelación; el botón “Iniciar servicio” registra el comienzo real del servicio.
- Las solicitudes inmediatas vencen tras 15 minutos sin respuesta; las reservas, tras 24 horas. El vencimiento no genera sanción automática.
- Las ganancias esperan 24 horas tras finalizar el servicio si no hay reclamación; en disputa, se retiene solo el importe discutido cuando sea técnicamente posible.
- La progresión de sanciones se expresa como suspensiones de 1, 3 y 7 días; después puede aplicarse expulsión o bloqueo permanente conforme a revisión y apelación.
- La apertura pública no significa que cobros o retiros reales deban activarse sin pruebas y verificaciones.

## Pendientes que no deben convertirse en supuestos
1. **Fórmula financiera exacta:** falta especificar cómo se calcula el dinero pagadero a partir de las ganancias elegibles en Coins, incluidos redondeos, costos y conciliación. La decisión del mínimo de $100 MXN está cerrada, pero no sustituye esta fórmula.
2. **Cancelación después del inicio:** la regla define una comisión del 60 % sobre el precio del servicio y que va a la plataforma; antes de programarla, conviene definir de forma explícita cómo se calcula el importe restante, si lo hay, y cómo se distribuye según el servicio efectivamente prestado. No se debe asumir que el proveedor recibe automáticamente el 40 %.
3. **Notificaciones:** la regla de mantenerlas activas debe implementarse distinguiendo avisos operativos/seguridad de mensajes opcionales y respetando los consentimientos y opciones que exija la ley.
4. **Actividad de proveedor:** aún debe definirse qué acciones cuentan para evitar ocultar perfiles de manera inconsistente tras 30 días.
5. **Zona horaria:** definir la zona horaria oficial para plazos, cierres, sanciones y registros.
6. **Legal y fiscal:** términos, privacidad, cookies, reembolsos, obligaciones fiscales, facturación, pagos e identificación requieren revisión profesional para México antes de activar operaciones financieras reales.

## Estado de publicación
Este ZIP es documentación consolidada, no evidencia de que el software esté implementado o probado. No se ha actualizado GitHub. La siguiente etapa es revisar/decidir los pendientes que afectan reglas de negocio; después se podrá preparar una actualización conjunta de los archivos, solo cuando el usuario lo autorice.
