# Backend

## Instalación

1. Instalar Node 20. Si tienes `nvm` instalado, ejecuntando `nvm use` va a usar la version definida en `.nvmrc`.
2. Instalar dependencias con `npm ci`
3. Copia el archivo de variables de entorno por defecto con `cp .env.dist .env`
4. Arranca Postgres con `docker-compose up`.
5. Inicializa la base datos de Couchbase ejecutando `npx ts-node scripts/init-local-database.ts`
6. Arranca la API con `npm start`.


## Inicializar base de con datos de prueba

**Advertencia**: el siguiente comando usa la API para inicializar los datos por lo que es necesario que el backend esté corriendo.

```bash
./scripts/populate-local-database.sh
```

El comando creará 20 edificios y los siguientes usuarios.

 Nombre de Usuario | Contraseña      | Rol             
-------------------|-----------------|-----------------
 admin             | pa$$w0rd        | ADMIN           
 flipper           | flipper1        | FLIPPER         
 caller            | caller10        | CALLER          
 flipper-caller    | flipper-caller1 | FLIPPER, CALLER 

## Crear edificios de prueba

- Utilizar endpoint `test-harness => Create Test Building` en Postman.


## Correr tests

Antes de correr los tests tienes que crear una base de datos `test_mkpremium` en Postgres.
Con ambas bases de datos ejectuta el siguiente comando para ejecutar los tests:

```npm run test```

## Postman

En [este link puedes](https://blue-escape-550088.postman.co/workspace/MKPremium~c0075d2d-4982-4e8a-a961-2885497d812a/collection/14017492-24f0ce87-1df1-45b6-8bf3-128994f495b8?action=share&creator=14017492&active-environment=14017492-34f4e0c8-106d-4d4f-8840-9439c5c2aea3) ver una colección de Postman con algunos de los endpoints de la API.

**Nota**: Algunos de los endpoints pueden no funcionar después de la migración a Postgres. Durante la migración,
el objetivo era mantener el callcenter funcionando y no todos los endpoints fueron migrados.

## Migraciones con Postgres

Usamos `typeorm` como ORM para postgres. Para usarlo, necesitamos la variable de entorno `DATABASE_URL`. Para ejecutar
`typeorm` desde la shell lo hacemos con:


```npm run typeorm migration:show -- -d src/data-source.ts```
