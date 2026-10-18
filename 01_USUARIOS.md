# Reglamento de Usuarios — v0.4 (borrador)

## 1. Cuenta y edad
- **CONFIRMADO:** edad mínima de 18 años.
- En el primer registro aparecerá “Soy mayor de 18 años”, junto con acceso a las políticas aplicables.
- Guardar versión de los textos aceptados, fecha/hora y cuenta asociada. **PENDIENTE de revisión legal:** términos, aviso de privacidad y consentimiento de cookies no esenciales pueden requerir controles separados.
- Registro con celular verificado por SMS y contraseña, según la especificación.
- Nunca compartas contraseñas ni códigos SMS. El staff no debe pedir contraseñas de videojuegos.

## 2. Uso permitido y prohibido
Se permite consultar servicios, contratar, reportar problemas, abrir disputas y publicar reseñas elegibles. Se propone prohibir fraude, suplantación, acoso, amenazas, extorsión, doxxing, spam, manipulación de reseñas, falsificación de pruebas, acceso no autorizado, explotación de errores, evasión de sanciones y servicios que impliquen trampas, robo de cuentas o violación de reglas del juego. La lista definitiva debe aprobarse antes de publicar.

## 3. Contrataciones y reseñas
- Antes de contratar, revisar precio, alcance, duración, condiciones y política de cancelación. Los cambios acordados deben quedar registrados.
- **CONFIRMADO:** cliente y prestador pueden calificarse mutuamente por calidad y confiabilidad solo después de que exista una contratación real.
- El backend debe comprobar que la cuenta que califica participó en la contratación y que esta alcanzó el estado que habilita la reseña; no basta con mostrar u ocultar un botón.
- No declarar finalizado un servicio no realizado ni presionar para retirar reclamaciones legítimas.

## 4. Modalidades de contratación
- **Solicitud inmediata:** el cliente elige prestador y envía una contratación; el prestador recibe la misión/solicitud y puede aceptarla o rechazarla.
- **Reserva:** el cliente propone la cantidad de Coins, horario y duración. El prestador revisa la misión y la oferta y puede aceptar o rechazar sin cargo ni penalización por el simple rechazo.
- Los eventos de aceptación, rechazo, cancelación, inicio y finalización deben registrarse con fecha/hora.

## 5. Cancelaciones
- **CONFIRMADO:** primeros 3 minutos antes de iniciar el servicio: sin comisión.
- **CONFIRMADO:** después de esos 3 minutos y antes del inicio: comisión del 10% del precio del servicio.
- **CONFIRMADO:** una vez iniciado el servicio: comisión del 60% del precio del servicio, con posibilidad de apelación.
- La base de cálculo excluye cargos adicionales.
- **CONFIRMADO:** debe existir una ventana de al menos 5 minutos antes de entrar con el prestador para que el cliente pueda reconsiderar/cancelar.
- **PENDIENTE BLOQUEANTE:** aclarar si esos 5 minutos son una ventana adicional sin comisión o si la regla de 3 minutos sigue corriendo dentro de ella. No codificar la combinación hasta resolverlo.
- La interfaz debe mostrar el importe estimado de la comisión y del reembolso antes de confirmar la cancelación.
- No aplicar automáticamente en fallos de plataforma, incumplimiento del prestador, doble cobro, error de precio u otras causas que requieran revisión.
- **PENDIENTE:** evento que inicia el reloj, prueba de inicio, destinatario de la comisión y reglas por desconexión, fuerza mayor, contracargo o culpa del prestador.

## 6. Coins
- **CONFIRMADO:** Coins comprados no se pueden retirar.
- Los saldos comprados, promocionales, ganancias de prestadores y saldo retirable deben mantenerse separados.
- **CONFIRMADO:** prestadores aprobados no pueden comprar Coins; la opción se oculta en su interfaz y el backend debe rechazar intentos directos.
- **CONFIRMADO:** las opciones de retiro solo se muestran a prestadores aprobados; los clientes no las ven.
- **PENDIENTE:** caducidad, reembolsos, contracargos, impuestos, cargos de pago y tratamiento al cerrar una cuenta.

## 7. Suspensiones, apelaciones y menú
- Durante una suspensión, la persona no puede contratar, comentar ni calificar prestadores.
- El menú de tres líneas incluye disputas, apelaciones, cancelaciones, reembolsos, solicitud de ingreso al programa de prestadores y solicitud de staff.
- La autorización de páginas y acciones siempre se comprobará en backend.

## 8. Historial y privacidad
Los reportes y evidencias solo deben usarse para resolver el caso, con acceso limitado y retención definida. El baneo no borrará el historial de contrataciones necesario para auditoría y corrección de errores. **PENDIENTE:** plazos de conservación, canal de privacidad, derechos ARCO y tiempos de soporte.
