# Coins, comisiones, pagos y contabilidad

## Principios
- Coins compradas por clientes no son retirables.
- Proveedores aprobados no pueden comprar Coins; bloquear en interfaz y backend.
- Solo proveedores aprobados ven opciones de retiro.
- No hay transferencias gratuitas de Coins entre usuarios en la primera versión.
- Coins no vencen mientras exista la cuenta, sujeto a obligaciones legales y tratamiento de cuentas cerradas.
- Ajustes manuales de saldo solo por el propietario y siempre auditados.

## Paquetes de compra
| Precio MXN | Coins |
|---:|---:|
| $19 | 50 |
| $35 | 100 |
| $68 | 200 |
| $100 | 300 |
| $150 | 500 |
| $500 | 1,750 |
| $1,000 | 3,500 |
| $1,500 | 6,000 |

## Equivalencias de conversión para ganancias elegibles de proveedores

Las cantidades de esta tabla indican equivalencias de conversión entre Coins elegibles y valor en MXN; **no son opciones para solicitar retiros individuales**. El mínimo para solicitar un retiro sigue siendo $100 MXN. Las Coins compradas o promocionales no se vuelven retirables por aparecer en esta tabla. Antes de activar retiros, la implementación debe calcular el valor pagadero únicamente sobre ganancias elegibles y confirmadas, sin mezclar fuentes de saldo.


| Equivalencia indicada | Coins |
|---:|---:|
| $10 MXN | 50 |
| $20 MXN | 100 |
| $40 MXN | 200 |
| $60 MXN | 300 |
| $100 MXN | 500 |
| $350 MXN | 1,750 |
| $700 MXN | 3,500 |
| $1,200 MXN | 6,000 |

Pendiente crítico: confirmar e implementar la fórmula exacta que convierte las ganancias elegibles en dinero pagadero, así como costos, impuestos, límites y redondeos. La tabla no permite retiros inferiores a $100 MXN ni implica que Coins compradas o promocionales puedan retirarse.

## Saldos y ganancias
- La interfaz puede mostrar saldo común, pero el backend distingue origen: compradas, promocionales, ganancias, ganancias pendientes, ganancias confirmadas/retirables, retiros en revisión y movimientos reales de dinero.
- Cliente puede elegir qué tipo de Coins válidas usar al pagar.
- Comisión por contrato completado: 10 % del precio del servicio, excluyendo cargos adicionales. Ejemplo: 100 Coins → 10 Coins plataforma, 90 proveedor antes de otros ajustes.
- Ganancias retenidas 24 horas tras finalizar el servicio si no hay reclamación.
- Si existe disputa, retener solo el importe discutido hasta resolverla; ganancias no disputadas pueden liberarse cuando corresponda.
- Los paquetes, equivalencias y comisiones los modifica solo el propietario. Cambios no afectan operaciones confirmadas.
- Una posible comisión futura del 40 % para donaciones/transmisiones no se aplica automáticamente a contratos de servicios de la primera versión.

## Pagos y retiros
- Pagos iniciales por transferencia con verificación manual.
- No acreditar Coins hasta verificar recepción real.
- Registrar quién validó, fecha, importe, referencia y cuenta.
- Prevenir comprobantes reutilizados, pagos duplicados y cambios concurrentes; operaciones idempotentes.
- Retiro mínimo: $100 MXN. Las equivalencias de conversión no reducen este mínimo; el saldo elegible debe alcanzar el equivalente pagadero mínimo antes de crear una solicitud de retiro.
- Retiros con revisión manual.
- Objetivo: procesar en 1 día hábil después de aprobado y con datos completos. Informar y registrar retrasos externos.
- Solo ganancias elegibles y confirmadas pueden retirarse; no permitir retiro de Coins compradas/promocionales.
- Reembolsos y contracargos: investigar, conservar pruebas, corregir una sola vez y usar Coins o medio de pago según corresponda legal y técnicamente.
- Cada movimiento registra actor, fecha/hora, cuenta, importe, tipo, motivo y saldo resultante.
- Impuestos, facturación, comisiones bancarias y obligaciones de retención requieren validación profesional.
