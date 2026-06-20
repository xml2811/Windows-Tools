# Audio Device Switcher

Herramienta portable para Windows creada por MPTech Tools para cambiar rápidamente el dispositivo de salida de audio predeterminado.

## Qué hace

Audio Device Switcher permite cambiar entre dispositivos de salida de audio de Windows sin abrir la configuración de sonido.

Está pensada para usuarios que cambian a menudo entre altavoces, monitores, auriculares, dispositivos Bluetooth o interfaces de audio.

## Funciones

- Detecta dispositivos de salida de audio activos en Windows.
- Muestra el dispositivo de salida predeterminado actual.
- Permite establecer cualquier dispositivo detectado como predeterminado.
- Permite cambiar al siguiente dispositivo.
- Atajo global de teclado configurable.
- Permite excluir dispositivos del ciclo del atajo.
- Modo segundo plano/bandeja.
- Al cerrar la ventana, la app sigue funcionando en la bandeja.
- Menú de bandeja con Abrir app y Cerrar app.
- Opción de iniciar con Windows.
- Opción de iniciar minimizada.
- Interfaz en español, inglés y portugués.

## Release

Ejecutable portable:

../../releases/audio-device-switcher/audio-device-switcher.exe

Checksum:

../../releases/audio-device-switcher/checksums.txt

## Uso

1. Abre audio-device-switcher.exe.
2. Selecciona el dispositivo de salida de audio que quieras.
3. Pulsa Predeterminar.
4. Configura un atajo global si lo necesitas.
5. Cierra la ventana para dejar la app funcionando en la bandeja.
6. Usa el icono de la bandeja para abrir o cerrar completamente la app.

## Comportamiento del atajo

El atajo alterna entre los dispositivos incluidos.

Los dispositivos excluidos se ignoran en el ciclo del atajo, pero no se deshabilitan en Windows.

Esto permite mantener un dispositivo disponible manualmente, pero evitar que el atajo cambie a él.

## Inicio con Windows

La app puede iniciarse con Windows sin permisos de administrador.

Escribe una entrada en el registro del usuario actual:

HKCU\Software\Microsoft\Windows\CurrentVersion\Run

Si mueves el ejecutable portable después de activar el inicio con Windows, desactiva y activa de nuevo la opción para que Windows guarde la nueva ruta.

## Notas

Windows SmartScreen puede mostrar un aviso porque el ejecutable todavía no está firmado con certificado.

Esta herramienta no usa cuentas, nube, tracking, servidores ni APIs externas.