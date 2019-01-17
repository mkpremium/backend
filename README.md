# MkPremium/Banks REST API


## Requerimientos

El proyecto utiliza [nvm][1] para instalar el runtime, una version LTS de Node (8.11.1).
Utiliza [docker][2] y [docker-compose][3] para instalar los servicios necesarios para funcionar.


## Instalación

1. Clone el repositorio e ingrese al directorio

        $ git clone https://github.com/bitdistrict/MKBackEnd mkpremium-backend
        $ cd mkpremium-backend
        
2. Instale el runtime de node y sus dependencias

        $ nvm install
        $ npm install
        
    > **Nota**: Es posible que para instalar correctamente las dependencias de node, deba instalar
    paquetes de compilación y build en su sistema operativo
    
    Cada vez que inicie una consola para trabajar en el proyecto puedo volver
    a elegir la version instalada de node mediante el comando
    
        $ nvm use
        
3. Instale dependencias globales

    Algunos scripts del proyecto y herramientas utilizan comandos que debe estar instalados
    globalmente o deben estar incluidos en su PATH
    
        $ npm install node-gyp babel-cli
        
    > **Nota**: [node-gyp][4] utiliza python 2.7, lease su [documentación][4] si necesita realizar
    alguna acción adicional en su sistema operativo 
        
4. Configuración de variables de ambiente y docker

    copie el template de docker, el template de las variables de ambiente y ajuste
    de ser necesario
    
        $ cp env.template .env
        $ cp docker-compose.template.yml docker-compose.yml
        
    El [template][5] de docker-compose incluye los servicios necesario para ejecutar el proyecto
    como son: una instancia de couchbase enterprise 5.5 que por defecto crea un bucket
    y su índice primario
    
5. Inicialice el ambiente de docker

        # docker-compose up -d
        
    El argumento `-d` (aka detached) permite lanzar los servicios sin ocupar la consola
    
    En caso de que necesite detener los servicios puede hacerlo mediante la siguiente
    instrucción
    
        # docker-compose stop
        
    Para mas información acerca de los comandos disponibles lease la documentación de
    [docker-compose][3]
    
    > **Nota**: es posible que en su sistema deba usar `sudo` al usar los comandos docker y docker-compose

6. Correr las migraciones

  Solicite el archivo CSV si no lo tiene. Luego:

 `$ cli/cli-migrate-worksheets.js path/to/CSV/folder`
 
7. Correr el proyecto
 
  Ejecute: `$ npm start`
  
8. Docs
 
  Después de iniciada podría ver los docs [aquí][10]

 9- Panel de couchbase
 
 El panel de couchbase de accede via [el siguiente link][11] el usuario es `Administrator` 
 y el password es `password`.

### Notas

#### Comandos

Para ver los comandos disponibles ejecute:  

`$ cli/cli.js`

##### Crear operador

Para crear un operador ejecute, por ejemplo:   

`$ cli/cli-operator-add.js -u 'robin' -P 'password'`
    
    
## Dependencias opcionales

El proyecto usa herramientas externas para algunos casos concretos, como generación de vistas previas
preprocesado de archivos y migración, estas son opcionales salvo que piense probar o usar
ejecutar dichas partes en su ambiente o realizar deployments de manera manual

- [imagemagick][6], durante la generación de los previews de los meta datos de los edificios
- [q (text as data)][7], previo a la migración de datos, para preprocesar y relacionar la data
- [dos2unix][8], previo a la migración de datos, para transformar los archivos con formatos foráneos
- [rsync][9], durante el proceso de despliegue



[1]: https://github.com/creationix/nvm
[2]: https://docs.docker.com/install/
[3]: https://docs.docker.com/compose/install/
[4]: https://github.com/nodejs/node-gyp
[5]: docker-compose.template.yml
[6]: https://www.imagemagick.org/
[7]: http://harelba.github.io/q/
[8]: https://waterlan.home.xs4all.nl/dos2unix/es/man1/dos2unix.htm
[9]: https://rsync.samba.org/
[10]: http://localhost:9001/docs/
[11]: http://127.0.0.1:8091/ui/index.html
