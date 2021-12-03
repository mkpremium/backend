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
