## Conectar al servidor de socket

### Incluir la librería socket.io al proyecto
El servidor de socket tendrá disponible la librería `socket.io.js` en
`http://<socket-server>/socket.io/socket.io.js`. Tmabién es posible incluir la
misma librería desde otra fuente.

## Conexión
Para la conexión se necesita la URL válida del servidor socket y el token de autenticación.
```JavaScript
<script src="http://<socket-server>/socket.io/socket.io.js"></script>

<script>
  var socket = io('http://<socket-server>', { 
     query: 'token=' + authToken 
  });

  socket.on('connect', function(){
     console.log('Cliente conectado');
  });

  socket.on('<evento>', function(data){ });
</script>
````

### Escuchar eventos
Para escuchar eventos sólo es necesario utilizar la funcion: `socket.on(<nombre-de-evento>, function(data) {});` la cual recibe como argumentos el nombre del evento a escuchar (String) y una función callback que recibe la data enviada en forma de objeto.

### Eventos del backend
- `<_documentType>:<id>` cuando un registro es modificado.
```JavaScript
socket.on('owner:5fe1d64e-9383-4483-9443-8a1ed79c2ba0', function(data){
  console.log(data); 
});
```
- `<_documentType>:new` cuando un registro es creado.
```JavaScript
socket.on('owner:new', function(data){
  console.log(data); 
});
```
Donde `data` tiene el siguiente formato:
```JavaScript
{ 
  model: 'owner',
  id: '5fe1d64e-9383-4483-9443-8a1ed79c2ba0',
  payload:
    { 
      type: 'update-owner',
      data:
      { 
        id: '5fe1d64e-9383-4483-9443-8a1ed79c2ba0',
        ...
        _documentType: 'owner' 
        } 
    },
  timestamp: '2018-02-14T19:30:03.156Z' 
}
```

### Notas
- `_documentType` puede tener los siguiente valores: `owner`, `operator` y `worksheet` (u otro modelo definido en el backend). 
- Es posible que en backend envíe un evento de tipo `custom` en este caso se debe conocer con anticipación el nombre d elos eventos custom que se pretenden enviar.
- La propiedad `type` del payload tiene el siguiente formato: `<eventType>-<_documentType>` donde `eventType` puede tener cualquiera de los siguientes valores: `add`, `update`, `remove`, `read` y `custom`.


