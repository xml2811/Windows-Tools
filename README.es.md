# MPTech Windows Tools

Pequeñas utilidades portables para Windows creadas por MPTech Tools.

Este repositorio está enfocado en herramientas de escritorio simples para usuarios avanzados, técnicos, desarrolladores, administradores de sistemas y profesionales IT.

Sin SaaS. Sin cuentas. Sin servidores. Sin configuración compleja.

## Herramientas disponibles

### Bulk Link Downloader

Herramienta ligera para Windows pensada para procesar y descargar múltiples enlaces rápidamente.

Casos de uso principales:

- Pegar varios enlaces.
- Descargar archivos en lote.
- Mantener un flujo de trabajo local y sencillo.
- Evitar depender de extensiones del navegador.

### Audio Device Switcher

Herramienta portable para Windows que permite cambiar rápidamente el dispositivo de salida de audio predeterminado.

Casos de uso principales:

- Cambiar entre altavoces, monitores, auriculares o interfaces de audio.
- Cambiar el dispositivo predeterminado desde una interfaz sencilla.
- Usar un atajo global de teclado para alternar entre dispositivos.
- Excluir dispositivos del ciclo del atajo sin deshabilitarlos en Windows.
- Mantener la app funcionando en segundo plano desde la bandeja del sistema.

Funciones actuales:

- Detecta dispositivos de salida de audio activos en Windows.
- Muestra el dispositivo de salida predeterminado actual.
- Permite marcar un dispositivo como predeterminado.
- Permite cambiar al siguiente dispositivo.
- Atajo global configurable.
- Control para incluir/excluir dispositivos del ciclo del atajo.
- Modo segundo plano/bandeja.
- Al cerrar la ventana, la app sigue funcionando en la bandeja.
- Menú de bandeja para abrir o cerrar la app.
- Opción de iniciar con Windows.
- Opción de iniciar minimizada.
- Interfaz en español, inglés y portugués.

Archivo release:

releases/audio-device-switcher/audio-device-switcher.exe

## Estructura del proyecto

tools/
- audio-device-switcher/
- bulk-link-downloader/

releases/
- audio-device-switcher/

## Filosofía

Cada herramienta debe ser:

- Pequeña.
- Útil.
- Rápida de construir.
- Fácil de vender o publicar.
- Independiente de servidores.
- Enfocada en un problema claro.
- Simple de mantener.

## Notas

Windows SmartScreen puede mostrar un aviso porque los ejecutables todavía no están firmados con certificado.

Para la función de inicio con Windows, si se mueve el .exe portable después de activar la opción, hay que desactivar y activar de nuevo la opción para que Windows guarde la nueva ruta.