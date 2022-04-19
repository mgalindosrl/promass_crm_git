///Client id de un oAuth implicit grant con el scope de conversations, routing y users
const CLIENT_ID = '4d6339f3-4b75-454a-a34e-614fed71b5a2';
///Ambiente que usaremos para las peticiones a Genesys
const ENVIRONMENT = 'mypurecloud.com';

var token = "";
var usuario = {};
var agent = [];
var customer = [];

///Metodo que obtiene las variables de la URL
function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\#&]" + name + "=([^&#]*)"),
        results = regex.exec(location.hash);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

///Si la url tiene un # obtenemos el token, este # lo va a poner Genesys en la url despues del login
if (window.location.hash) {
    ///Se obtiene el token y se asigna a la variable token.
    token = getParameterByName('access_token');

    ///O lo podemos guardar en localstorage para usarlo despues.
    localStorage.setItem('token', token);

    ///Eliminamos el token de la url
    location.hash = ''
} else {
    //Si el token no existe hacemos una solicitud de login a Genesys, aparecera la pantalla de login de Genesys 
    ///y posteriormente Genesys redireccionara al CRM o a la url que este seteada en el valor "redirect_uri"
    ///esta url tiene que ser igual a la configurada en Genesys Cloud OAuth
    var queryStringData = {
        response_type: "token",
        client_id: CLIENT_ID,
        redirect_uri: "https://localhost:8443"
    }

    //Se regirige a la pagina de autorizacion de Genesys, este paso es obligatorio y no podemos evitarlo.
    window.location.replace(`https://login.${ENVIRONMENT}/oauth/authorize?` + jQuery.param(queryStringData));
}

///Solicitamos a GEnesys la informacion del usuario, enviando el token en los headers
var ObtenerUsuario = () => {
    $.ajax({
        url: `https://api.${ENVIRONMENT}/api/v2/users/me`,
        type: "GET",
        beforeSend: function (xhr) { xhr.setRequestHeader('Authorization', 'bearer ' + token); },
        success: function (data) {
            ///Este objeto contiene la informacion del usuario en Genesys
            usuario = data;
            ///Obtenemos las colas a las que pertenece el usuario
            ObtenerColas(usuario.id);
        }
    });
}

///Metodo para obtener las colas a las que pertenece el usuario
var ObtenerColas = (userId) => {
    var settings = {
        "url": `https://api.${ENVIRONMENT}/api/v2/users/${userId}/queues?pageSize=100&pageNumber=1&joined=true`,
        "method": "GET",
        "timeout": 0,
        "headers": {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "authorization": "Bearer " + token
        }
    };

    $.ajax(settings).done(function (response) {
        ///Actualizamos la variable usuario agregando el objeto que obtuvimos.
        usuario.colas = response.entities;
    });
}

///Metodo que crea una suscripcion a las notificaciones de Genesys
///El canal al que nos suscribimos es users.conversations, con esto obtendremos todos los eventos de una conversacion asignada al usuario (INBOUND, OUTBOUND o DIALER)
var Notifications = () => {
    ///Obtenemos la informacion del agente logueado
    ObtenerUsuario();

    ///Se abre el canal de notificaciones
    $.ajax({
        headers: {
            'Authorization': 'bearer ' + token,
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
                    "authorization": "Bearer " + token
                },
                "data": JSON.stringify([
                    {
                        ///Enviamos el userId de agente dinamicamente
                        "id": "v2.users." + usuario.id + ".conversations"
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
                    console.log("onmessage");
                    ///Obtenemos solamente el eventBody.
                    var topic = JSON.parse(e.data).eventBody;
                    var participantId = "";

                    console.log(topic);

                    ///Detectamos que no sean evento heartbeat
                    if (topic.message != "WebSocket Heartbeat") {
                        topic.participants.forEach((val, index) => {
                            ///En la conversacion buscamos al participante que sea "customer" para obtener su participantId
                            if (val.purpose == "agent") {
                                participantId = val.id;
                                agent = val;
                            }

                            if(val.purpose == "customer") {
                                customer = val;
                            }
                        })

                        console.log(topic);

                        ///Se detecta en los eventos conversaciones nuevas, que aun no tengan fecha de fin
                        if (customer && !topic.participants[0].endTime) {
                            /*
                             Redirigimos a la pagina con la informacion de la interaccion enviando lo siguiente
                             userId: id del agente en Genesys
                             participanId: id del agente participante en la conversacion
                             contactListId: id de la lista de contacto que se uso para la marcacion
                             contactId: id del contacto en la lista de marcacion que nos servira para obtener la informacion del lead
                             conversationId: id de la conversacion en Genesys
                             */
                            console.log("transfiriendo");

                            ///Se redirige a la pagina de informacion de la interaccion
                            window.location.replace(`/interaccion.html?queueId=${customer.queueId}&userId=${usuario.id}&participantId=${participantId}&contactListId=${topic.participants[0].attributes.dialerContactListId}&contactId=${topic.participants[0].attributes.dialerContactId}&conversationId=${topic.id}`);
                        }
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

///Se llama al metodo notificaciones.
Notifications();