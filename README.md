# Backend


## Instalación

```bash
nvm use
npm install
cp .env.dist .env
tsx ts-node scripts/init-local-database.ts
npm start
```

## Inicializar Couchbase con datos de prueba

```bash
./populate-local-database.sh
```

El comando creará 20 edificios y los siguientes usuarios.

Nombre de Usuario | Contraseña | Rol
----|---|---
admin | admin | ADMIN
flipper | flipper1 | FLIPPER
caller | caller10 | CALLER
flipper-caller | flipper-caller1 | FLIPPER, CALLER

## Crear edificios de prueba

- Utilizar endpoint `test-harness => Create Test Building` en Postman.


## Gestión de nodos Couchbase

### Añadir nodo

1. Usar [este](https://eu-west-1.console.aws.amazon.com/ec2/v2/home?region=eu-west-1#LaunchTemplateDetails:launchTemplateId=lt-0f071d39b784bfdf1) `Launch Template`.
2. Añadir servidores desde consola de Couchbase
3. Crear indices.
4. Apuntar servicios a nuevas instancias.
5. Crear alarma para CPU media > 90% por 5 minutos.

## Quitar nodo

1. Quitar nodo de lista en cadena de conexión.
2. Esperar deploy para que no quede ningún servicio apuntando a al nodo.
3. **Asegurarse de que hayan otros nodos con indices**
4. Quitar nodo del cluster desde consola de Couchbase.
5. Parar o terminar instancia en EC2.
