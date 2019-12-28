# MKPremium backend node.js

## Ambientes
| env | hostname | host publico | Key
|----|----|----|----|
|Development| ec2-18-130-170-3.eu-west-2.compute.amazonaws.com| callcenter.thebitdemo.com | [BITDISTRICT_UAT.pem](https://drive.google.com/open?id=1lD4f2MReKEkaKqIJiCQqcYMJ_xeBeh-0)
|Produccion| ec2-18-130-88-140.eu-west-2.compute.amazonaws.com| callcenter.servicemk.com | [BITDISTRICT_PRODUCTION.pem](https://drive.google.com/open?id=1Jfm4nqz7IU-FEKaA4J77tcgZX9oSFJbw)

El backend de node.js del callcenter esta compuesto por dos aplicaciónes, una la app de express y otra la app de socket.io, se encuentra desplegado en la carpeta `~/apps/mkpremium`

Actualmente usamos [nvm][1] para manejar la version de node.js que usamos en la app, el proyecto cuenta con un archivo `.nvmrc` que almacena la version usada

El proyecto utiliza [PM2][2] como process manager para mantener vivas las instancias, tenemos las siguientes instancias

nombre instancia|descripcion|
----|----|
mkpremium|Instancia de express
socket|Instancia de socket.io

## Como ver el estado de las instancias

    $ cd ~/apps/mkpremium
    $ nvm use
    $ pm2 status

## Como reiniciar una instancia

    $ cd ~/apps/mkpremium
    $ nvm use
    $ pm2 restart [nombre de la instancia]

## Como levantar las instancias 'mkpremium' y 'websocket' 
**Usar solamente esta opción si las instancias no están levantadas**

    $ cd ~/apps/mkpremium
    $ nvm use
    $ pm2 start mkpremium-pm2.json


[1]: https://github.com/creationix/nvm
[2]: http://pm2.keymetrics.io/
