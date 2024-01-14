# Backend

## Instalación

1. Instalar Node 18. Si tienes `nvm` instalado, ejecuntando `nvm use` va a usar la version definida en `.nvmrc`.
2. Instalar dependencias con `npm ci`
3. Copia el archivo de variables de entorno por defecto con `cp .env.dist .env`
4. Arranca bases de datos (Couchbase y Postgres) con `docker-compose up`.
5. Inicializa la base datos de Couchbase ejecutando `npx ts-node scripts/init-local-database.ts`
6Arranca la api con `npm start`.


## Inicializar base de con datos de prueba

**Advertencia 1**: el siguiente comando usa la API para inicializar los datos por lo que es necesario que el backend esté corriendo.
**Advertencia 2**: el script crea un usuario admin en Couchbase y luego lo usa para pegarle a la API para crear recursos.
La API guardara los datos en Couchbase solo si la variable de entorno `DATABASE` es `couchbase`. Hay un script
equivalente para crear un usuario admin en Postgres, en `./scripts/populate-local-database.sh` hay un comentario
relacionado.
```bash
./scripts/populate-local-database.sh
```

El comando creará 20 edificios y los siguientes usuarios.

 Nombre de Usuario | Contraseña      | Rol             
-------------------|-----------------|-----------------
 admin             | admin           | ADMIN           
 flipper           | flipper1        | FLIPPER         
 caller            | caller10        | CALLER          
 flipper-caller    | flipper-caller1 | FLIPPER, CALLER 

## Crear edificios de prueba

- Utilizar endpoint `test-harness => Create Test Building` en Postman.


## Correr tests

Antes de correr los tests tienes que crear una base de datos `test_mkpremium` en Postgres.
Con ambas bases de datos ejectuta el siguiente comando para ejecutar los tests:

```npm run test```

## Migraciones con Postgres

Usamos `typeorm` como ORM para postgres. Para usarlo, necesitamos la variable de entorno `DATABASE_URL`. Para ejecutar
`typeorm` desde la shell lo hacemos con:


```npm run typeorm migration:show -- -d src/data-source.ts```

## Grabaciones

En [esta carpeta](https://drive.google.com/drive/folders/1ihrCwLEm63P-uBI12kcbpuYaDA73T-rX) iremos guardando grabaciones como forma de documentación.

## Gestión de nodos Couchbase

### Añadir nodo

1.
Usar [este](https://eu-west-1.console.aws.amazon.com/ec2/v2/home?region=eu-west-1#LaunchTemplateDetails:launchTemplateId=lt-0f071d39b784bfdf1) `Launch Template`.
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

## Consultas de Couchbase

### Siguiente ficha disponible

```
SELECT worksheet.id
FROM mkpremium worksheet

WHERE worksheet._documentType = 'worksheet'
  AND worksheet.status IN ['OPEN', 'LOOKING_MEETING']
AND worksheet.queueId IS NULL
AND worksheet.buildingAddress.province IN ["MADRID","BARCELONA","ILLES BALEARS","VALENCIA"]

ORDER BY worksheet.viewedAt LIMIT 1
```

### Ficha para callcenter

```
SELECT worksheet.id      id,
       worksheet.status  status,
       worksheet.queueId queueId,
       {
        building.id, building.address, building.metadata, building.`use`, "usage": building.`use`,
        building.location, building.recentProposal, building.cadastre, building.floorArea,
        "negotiationStatus": CASE WHEN building.negotiationStatus IS MISSING 
            THEN "PENDIENTE"
            ELSE building.negotiationStatus
            END,
        "featuredOwnerId": building.ownerId,
        "cadastreReference": building.cadastre.reference
        } building,
        ARRAY {
            o.id,
            o.name,
            o.featuredContact,
            o.type,
            o.status,
            "person": {
                "contacts": ARRAY c FOR c IN o.person.contacts WHEN c.status != 'BAD' END
            }
        } FOR o IN owners END relatedOwners

FROM mkpremium worksheet
JOIN mkpremium building ON building._documentType = 'building'
                            AND building.id = worksheet.relatedBuildingIds[0]
NEST mkpremium owners ON owners._documentType = 'owner' AND owners.buildingId = building.id
                          AND owners.status NOT IN ['WITHOUT_CONTACT', 'ERRONEO']

WHERE worksheet._documentType = 'worksheet' AND worksheet.id = $1
```
