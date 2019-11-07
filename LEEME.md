# PROYECTO ANGULAR

## Instalaciones

### Node
Gestor de paquetes usado por Angular.
Descargar node desde la página oficial e instalar en el ordenador.

### Angular-cli
Framework para la parte customer
npm install -g @angular/cli

### Visual Studio Code
Editor gratuito y ligero bastante integrado con este tipo de proyectos
Descargar de la página oficial e instalar

### Ejecutar comando node para descargar dependencias del proyecto
npm install

## Estructura CSS

### CSS generales
Se referencian en .angular-cli.json en STYLES, ahora mismo hay (en este orden):

1. ootstrap.scss
2. styles.css
3. deeppurple-amber.css

Lueggo hay scss por cada componente (los últimos en orden). El scss de un componente no afecta a otro (Angular diferencia cada componente con un identificador que el crea, por ello el estilo de un componente no afecta a los demás.)


# SERVICIO

## Instalaciones

1. Carpeta con .exe y DLLs asociadas en una carpeta del PC, por ejemplo C:/TPVCoreService
2. Añadir al Path del usuario del sistema: C:\Windows\Microsoft.NET\Framework\v4.0.30319\
3. Si TPVCoreService ya se instaló previamente y está en ejecución (mirar en Servicios):
  - Se ha de detener.
  - Abrir una consola en el sistema, situarse en la ruta del TPVCoreService y ejecutar: InstallUtil.exe TPVCoreService.exe /u
4. Abrir una consola en el sistema, situarse en la ruta del TPVCoreService y ejecutar: InstallUtil.exe TPVCoreService.exe
