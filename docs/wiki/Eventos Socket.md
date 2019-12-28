### Formato de nombres de los eventos
* `<_documentType>:new` cuando un registro es creado.
* `<_documentType>:<id>` cuando un registro es modificado.

### Estructura del evento 

```Javascript
{
  model: String,
  id: String,
  payload: {
    type: String,
    data: {}
  }),
  timestamp: Date
};
```
* `model` nombre del modelo o documentType
* `id` Id del documento creado o modificadp
* `payload.type` contiene el mismo formato del nombre del evento
* `payload.data` contiene el objeto del docuemnto creado o modificado
* `timestamp` fecha del evento

### Lista de posibles eventos basados en el `_documentType`

* `owner:new` 
* `owner:<id>`
* `worksheet:new` 
* `worksheet:<id>`
* `operator:new`
* `operator:<id>`
* `worksheet-queue:new`
* `worksheet-queue:<id>`
* `owner-contact:new`
* `owner-contact:<id>`
* `history:new`
* `scheduledEvent:new`
* `scheduledEvent:<id>`
* `scheduledEvent:notification:<operatorId>` (es disparado cuando un evento programado debe ser notificado)
* `scheduledEvent:notification:*` (escucha todas las notificaciones de eventos programados)
