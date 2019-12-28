# Instrucciones para ejecutar la migracion

1. descomprima en la carpeta de la aplicacion /home/ubuntu/apps/mkpremium/csv los archivos

    - PERSONAS.csv
    - EDIFICIOS.csv
    - PROPIETARIOS.csv
    - LLAMADAS.csv
    - SITARR.csv

2. Es posible que los archivos al ser generados en windows tengan el caracter BOM, que es bastante problematico para eliminarlo  de todos los archivos a importar, ejecute

    sed -i '1s/^\xEF\xBB\xBF//' /home/ubuntu/apps/mkpremium/csv/*.csv

2. genere el archivo `cross_table.csv`, ejecute
    - `cd /home/ubuntu/apps/mkpremium`
    - `sh migrations/query_csv.sh`

3. Ejecute la migracion de CSV, ejecute
    - `cd /home/ubuntu/apps/mkpremium`
    - `nvm use`
    - `npm run migrate`

4. descomprima el archivo BIT.rar en data, ejecute
    - `cd /home/ubuntu`
    - `rm -rf data/`
    - `unrar x /home/ubuntu/BIT.rar data/`

5. Ejecute la carga de metadata, ejecute
    - `cd /home/ubuntu/apps/mkpremium`
    - `nvm use`
    - `npm run metadata -- /home/ubuntu/data`


# Herramientas

## nohup

Los comandos de migracion pueden tomar tiempo en ejecutarse por es es bueno "desconectarlos" y enviarlos a background para asi evitar se cierren inesperadamente porque se cierra la sesion SSH o cualquier otro motivo ajeno al mismo comando para hacerlo solo debe prefijar cada comando con `nohup` y sufijarlo con `&`. Ej

    $ nohup npm run migrate &

Pulse enter 2 veces, una para ejecutar y otra para aceptar el mensaje. toda la salida se almacena en un archivo `nohup.out` ubicado en el mismo lugar donde ejecuto el comando para visualizarlo en tiempo real (a medida que se escribe)

    $ tail -f nohup.out

## htop
htop es un visor de procesor, entre otras cosas. es util para saber si un proceso se encuentra ejecutandose, por ejemplo al ejecutar uno de los pasos de migracion, si uso el comando nohup no podra saber si esta o no en ejecucion, para ello, debe ejecutar

    $ htop

Y filtrar, todos los scripts de migracion comienzan por `seed_`. Para filtrar solo los proceso de migracion pulse la tecla F4 y escriba `seed_` y podra ver todos los procesos y sub-procesos, para conocer cual es el proceso padre pulse F5 para la vista de arbol de procesos. Para salir simplemente pulse Q o F10

