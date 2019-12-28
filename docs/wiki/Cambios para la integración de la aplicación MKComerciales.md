## Ejemplo model Building del servidor actual

```
{
      "_documentType": "building",
      "_migrateId": "2",
      "address": {
        "type": "CL",
        "street": "ABADESSA OLZET",
        "number": 29,
        "fullAddress": "ABADESSA OLZET 29",
        "registerNumber": 19,
        "postalCode": {
          "number": 8019,
          "verified": true
        },
        "city": "BARCELONA",
        "province": "BARCELONA",
        "zone": "VALLCARCA I ELS PENITENTS  #  GRÀCIA"
      },
      "buildingDate": 0,
      "buildingType": "VERTICAL",
      "cadastre": {
        "reference": "5431504DF2853A0001HA",
        "address": "CL ABADESSA OLZET 29"
      },
      "coefficient": 100,
      "elements": {
        "number": 3,
        "average": 51,
        "commons": 0
      },
      "floorArea": 153,
      "id": "e194e5ed-1768-43b0-b82a-cbe6747d3be6",
      "landArea": 694,
      "location": {
        "lat": 41.3947183,
        "lng": 2.1087675
      },
      "owner": {
        "name": "PLANCHERIA TORT",
        "address": {
          "fullAddress": "BALMES, 431",
          "city": "BARCELONA"
        },
        "phones": \[\]
      },
      "propertyType": "Parcela construida sin divisi�n horizontal",
      "roofArea": 0,
      "state": "MALO",
      "use": "Residencial"
    } 
```
A este documento `building` hay que añadirle los siguientes campos:
- En el campo `elements` hay que añadir un nuevo campo `entities`que tendrá que tener un array de objetos `Entity`.
-- El objeto `Entity` es el siguiente
```
Entity{
  "idEntity": string,
  "Expiration": timestamp,
  "Rent": Number,
  "Situation": string,
  "Surface": Number,
  "Type": string
}
```
- Hay que añadir un campo nuevo `Negociation`
-- El `status`es el `building.{id}.data.state` de Firebase.
```
Negociation{
  "idNegociationHistory": string,
  "status": string
}
```
Con esto, se acabaría el objeto building del servidor quedando de esta manera:
```

{
  "_documentType": "building",
  "_migrateId": "2",
  "address": {
    "type": "CL",
    "street": "ABADESSA OLZET",
    "number": 29,
    "fullAddress": "ABADESSA OLZET 29",
    "registerNumber": 19,
    "postalCode": {
      "number": 8019,
      "verified": true
    },
    "city": "BARCELONA",
    "province": "BARCELONA",
    "zone": "VALLCARCA I ELS PENITENTS  #  GRÀCIA"
  },
  "buildingDate": 0,
  "buildingType": "VERTICAL",
  "cadastre": {
    "reference": "5431504DF2853A0001HA",
    "address": "CL ABADESSA OLZET 29"
  },
  "coefficient": 100,
  "elements": { 
    "number": 3, //nb
    "average": 51,
    "commons": 0,
    "entities": [
      //Objetos Entity
    ]
  },
  Negociation:{
    idNegociationHistory: "asdfaferfsadfasads",
    status: "En venta"
  },
  "floorArea": 153,
  "id": "e194e5ed-1768-43b0-b82a-cbe6747d3be6",
  "landArea": 694,
  "location": {
    "lat": 41.3947183,
    "lng": 2.1087675
  },
  "owner": {
    "name": "PLANCHERIA TORT",
    "address": {
      "fullAddress": "BALMES, 431",
      "city": "BARCELONA"
    },
    "phones": []
  },
  "propertyType": "Parcela construida sin divisi�n horizontal",
  "roofArea": 0,
  "state": "MALO",
  "use": "Residencial"
}
```
A parte de este documento, hay que crear nuevos documentos en la Base de Datos.
Hay que crear un nuevo objeto `NegociationHistory`
```
NegociationHistory{
  "idNegociationHistory": string,
  "Proposes": [
    //Conjunto de objetos Propose
  ]
}
```
Objeto `Propose`:
```
Propose{
  "idPropose": string,
  "Accepted": boolean,
  "Aspiration": {
    "ReceptionDate": Number,
    "Value": Number
  },
  "LastDate": Number,
  "SendDate": Number,
  "Value": Number
 }
```
El `idNegociationHistory` "asdfaferfsadfasads" de building es una referencia al documento NegociationHistory.

Además, hay que crear otro objeto `Meeting`que representa una cita:
```
Meeting{
  "owner": //Objeto Owner que relaciona el Building con Person
  "streetMeeting": string,
  "timestamp": Number,
  "dateMeeting": Number 
}
```
## EndPoints que hay que crear
Hay que crear los siguientes EndPoints:
- para el objeto Proposal : uno de creación de Proposal y otro para hacer Update
- para el objeto Meeting : uno de creación de Meeting, otro de Update, y otro de Delete
- para el objeto Entity : uno de creación de Entity, otro de Update, y otro de Delete.
