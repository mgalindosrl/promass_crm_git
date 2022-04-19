///Ambiente que usaremos para las peticiones a Genesys
const ENVIRONMENT = 'mypurecloud.com';
var wrapups = [];

///Metodo que obtiene las variables de la URL
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&]*)"),
    results = regex.exec(location);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

///Obtenemos las variables que enviamos en la pagina principal
if (window.location) {
    userId = getParameterByName('userId');
    contactListId = getParameterByName('contactListId');
    contactId = getParameterByName('contactId');
    conversationId = getParameterByName('conversationId');
    participantId = getParameterByName('participantId');
}

///Metodo que crea una suscripcion a las notificaciones de Genesys
///El canal al que nos suscribimos es users.conversations, con esto obtendremos todos los eventos de una conversacion asignada al usuario (INBOUND, OUTBOUND o DIALER)
///Se vuelve a abrir aqui, ya que el socket de la pagina anterior se cerro con el redireccionamiento
var Notifications = () => {
    ///Obtenemos los wrapups para la calificacion de las llamadas
    ObtenerWrapups("d7addc38-2a59-47ab-808b-bff94b0c7d67");

    ///Se abre el canal de notificaciones
    $.ajax({
        headers: {
            'Authorization': 'bearer ' + localStorage.getItem('token'),
            'Content-Type': 'application/json'
        },
        url: `https://api.${ENVIRONMENT}/api/v2/notifications/channels`,
        type: "POST",
        success: function (data) {
            ///Obtenemos el id del canal que se nos asigno
            var settings = {
                "url": `https://api.${ENVIRONMENT}/api/v2/notifications/channels/${data.id}/subscriptions`,
                "method": "POST",
                "timeout": 0,
                "headers": {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    ///Obtenemos el token del localstorage
                    "authorization": "Bearer " + localStorage.getItem('token')
                },
                "data": JSON.stringify([
                    {
                        ///Enviamos el userId de agente dinamicamente
                        "id": `v2.users.${userId}.conversations`
                    }
                ]),
            };

            $.ajax(settings).done(function (response) {
                ///Creamos un websocket con la uri proporcionada en el paso anterior.
                var socket = new WebSocket(data.connectUri);

                ///Evento open, para verificar que se abrio el socket
                socket.onopen = function (e) {
                    console.log("Abierto");
                }

                ///Evento donde llegaran todas las actualizaciones de las conversaciones
                socket.onmessage = function (e) {
                    ///Obtenemos solamente el eventBody.
                    var topic = JSON.parse(e.data).eventBody;

                    ///Detectamos que no sean evento heartbeat
                    if (topic.message != "WebSocket Heartbeat") {

                        ///Si el evento recibido ya contiene el parametro wrapup, regresamos a la pagina principal
                        topic.participants.forEach((val, index) => {
                            if (val.wrapup && val.purpose == "agent") {
                                window.location.replace("/");
                            }
                        })
                    }
                }

                ///Evento de error del websocket
                socket.onerror = function (e) {
                    console.log(e);
                }
            });
        },
        error: function (error) {
            console.log(error);
        }
    });
}

///Metodo para obtener la informacion del lead y presentarla en pantalla
var GetLeadId = () => {
    var settings = {
        "url": `https://api.${ENVIRONMENT}/api/v2/outbound/contactlists/${contactListId}/contacts/${contactId}`,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ///Obtenemos el token del localstorage
            "authorization": "Bearer " + localStorage.getItem('token')
        }
    };

    $.ajax(settings).done(function (response) {
        ///Obtenemos la informacion del lead y la asignamos a los elementos en pantalla.
        $("#contactName").text("Nombre: " + response.data.nombre + " " + response.data.apaterno + " " + response.data.amaterno);
        $("#contactPhone").text("Telefono: " + response.data.telefono);
        $("#contactSubBrand").text("Sub marca: " + response.data.submarca);
        $("#contactModel").text("Modelo: " + response.data.modelo);
        $("#contactBrand").text("Marca: " + response.data.marca);
        $("#contactQuote").text("Cotizacion: " + response.data.id_proveedor);
    });
}

///Metodo que se invoca cuando el agente califica la llamada
var Calificar = () => {
    var settings = {
        "url": `https://api.${ENVIRONMENT}/api/v2/conversations/calls/${conversationId}/participants/${participantId}`,
        "method": "PATCH",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ///Obtenemos el token del localstorage
            "authorization": "Bearer " + localStorage.getItem('token')
        },
        "data": JSON.stringify({
            "wrapup": {
                "code": "38e85bd0-2831-4a00-b131-e18882fabc56"
            }
        })
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
    });
}

var ObtenerWrapups = (queueId) => {
    var settings = {
        "url": `https://api.${ENVIRONMENT}/api/v2/routing/queues/${queueId}/wrapupcodes?pageSize=100`,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ///Obtenemos el token del localstorage
            "authorization": "Bearer " + localStorage.getItem('token')
        }
    };

    $.ajax(settings).done(function (response) {
        $dropdown = $("#wrapupSelect");

        response.entities.forEach((val, index) => {
            console.log(val);
            $dropdown.append($("<option/>").val(val.id).text(val.name));
        })
    });
}

Notifications();

GetLeadId();