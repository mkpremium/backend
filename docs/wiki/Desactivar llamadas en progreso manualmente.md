Bajo muchos casos numintec es posible que no envie los eventos de una llamada y esta queda en estado EN_PROGRESO bloqueando las llamadas para dicho usuario. una solución temporal en manualmente cambiar el estado de la llamada

1. Obtener el ID de la llamada activa, para ello inicie sesion con el usuario afectado en el login la llamada activa es devuelta, tome nota del id
2. Entrar a la consola administrativa, [datos de acceso](https://docs.google.com/document/d/1sS3n8KuZC2k0iuyA3_N5auLBohOstMb7652WYLdx0dA/edit#heading=h.g9kknbk4px53)
3. Una vez dentro de la console ir en el menu laterial izquierdo a Documents y en la nueva pantalla ingresar el id de la llamada en el campo "Document ID", click en el boton "Retrieve Docs"
4. Debe aparecer un unico resultado, dar click sobre el ID del resultado y en el cuadro de dialogo editar el status EN_PROGRESO, cambiar a DESCONOCIDO
5. Pulsa boton save


