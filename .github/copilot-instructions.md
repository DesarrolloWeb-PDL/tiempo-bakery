# Copilot Instructions (Tiempo Bakery)

## Objetivo
Optimizar costo de uso de agentes sin perder calidad en tareas normales.

## Perfil activo
Balanceado (Perfil 2)

## Perfiles disponibles

### Perfil 1: Ultra ahorro
- Modelo economico para casi todo.
- Delegar solo cuando sea estrictamente necesario.
- Respuestas cortas y foco en cambios minimos.

### Perfil 2: Balanceado (activo)
- Modelo economico para tareas rutinarias.
- Modelo intermedio solo para arquitectura o bugs complejos.
- Sin uso de modelo premium por defecto.

## Delegación
- No delegar si el analisis requiere hasta 6 archivos.
- Delegar exploracion recien cuando haya 7+ archivos o ambiguedad alta.
- Delegar implementacion solo si hay logica nueva en multiples archivos.
- Si el cambio es de un solo archivo, resolver inline salvo bloqueo real.

## Modelos (preferencia de costo)
- Tareas rutinarias: economico.
- Arquitectura/bugs complejos: intermedio.
- Premium: solo con justificacion explicita.

## Verificación
- Ejecutar solo validaciones necesarias para el cambio.
- No correr suites completas si no son relevantes al archivo tocado.

## Estilo operativo
- Ir al grano, con cambios mínimos y sin refactors innecesarios.
- Explicar trade-offs cuando sea necesario, pero en formato corto.
