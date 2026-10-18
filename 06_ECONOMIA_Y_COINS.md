# Economía y Coins — v0.4 (borrador)

## 1. Compra de Coins por clientes
Esta tabla muestra los paquetes que el cliente puede comprar con dinero real en MXN. Son valores confirmados por el propietario.

| Precio (MXN) | Coins |
|---:|---:|
| $19 | 50 |
| $35 | 100 |
| $68 | 200 |
| $100 | 300 |
| $150 | 500 |
| $500 | 1,750 |
| $1,000 | 3,500 |
| $1,500 | 6,000 |

## 2. Equivalencias de retiro para prestadores
Esta tabla es independiente de la tabla de compra. Solo se muestra a prestadores aprobados y no significa que los Coins comprados sean retirables.

| Retiro indicado (MXN) | Coins asociados |
|---:|---:|
| $10 | 50 |
| $20 | 100 |
| $40 | 200 |
| $60 | 300 |
| $100 | 500 |
| $350 | 1,750 |
| $700 | 3,500 |
| $1,200 | 6,000 |

**Pendiente bloqueante:** precisar si la columna de Coins representa una unidad interna de ganancias de trabajo, una referencia visual u otro saldo separado. Hasta resolverlo, no activar retiros reales ni asumir que Coins comprados se convierten en efectivo.

## 3. Visibilidad y elegibilidad
- Clientes comunes: pueden ver paquetes de compra y comprar Coins.
- Prestadores aprobados: no pueden comprar Coins; la opción de compra debe ocultarse y la API/backend debe rechazar compras incluso si se llama directamente.
- Prestadores aprobados: pueden ver las opciones de retiro y solicitar retiro solo del saldo de ganancias elegible.
- Clientes comunes: no deben ver la sección de retiros.
- El cambio de rol no debe convertir retroactivamente Coins comprados en ganancias retirables.

## 4. Administración de tablas
El panel administrativo debe permitir agregar, editar, desactivar o retirar paquetes de compra y equivalencias de retiro, tanto antes como después del lanzamiento, con permisos autorizados.

Cada cambio debe guardar versión, quién lo realizó, fecha/hora, motivo y fecha de vigencia. Cambiar una tabla no debe modificar operaciones ya confirmadas ni retiros pendientes, salvo procedimiento explícito y auditado.

## 5. Ajustes manuales
El administrador puede agregar o quitar Coins de una cuenta. Cada ajuste debe guardar:
- quién lo realizó;
- fecha/hora;
- cuenta afectada;
- cantidad y tipo de saldo afectado;
- motivo obligatorio;
- referencia del caso u operación, cuando aplique.

Los movimientos históricos no se borran ni se editan silenciosamente. Los errores se corrigen mediante movimientos compensatorios auditados. Los cambios de saldo no deben cambiar el origen del saldo sin una operación financiera autorizada.

## 6. Separación contable y seguridad
Mantener libros/saldos separados para:
1. Coins comprados por usuarios.
2. Coins promocionales o bonificaciones, si se habilitan.
3. Ganancias de prestadores por servicios.
4. Saldo retirable confirmado.
5. Pagos reales recibidos/pendientes.
6. Comisiones y costes de plataforma.

No permitir transferencias libres de Coins entre usuarios en V1, salvo decisión futura explícita. Toda acreditación de compra debe depender de confirmación del proveedor de pagos y ejecutarse una sola vez. No acreditar mediante parámetros de URL o mensajes del cliente.

## 7. Retiros y operaciones de dinero real
Antes de habilitar retiros hay que definir proveedor de pagos, saldo elegible, KYC/titularidad, límites, tiempos, comisiones, impuestos, reembolsos, contracargos y conciliación. Los pagos fallidos deben conciliarse antes de reintentarse. No aprobar más que el saldo retirable confirmado.

La comisión del 40% mencionada para streaming/donaciones corresponde a una posible fase futura; no se debe aplicar automáticamente a las contrataciones de la primera versión.

## 8. Cambios futuros
Los precios, equivalencias, promociones y comisiones futuras deben ser configurables y versionados. Los cambios nuevos no modifican términos aceptados ni operaciones pasadas de forma retroactiva.
