const {
    PURECLOUD_FRONT_CLIENTID,
    HTTP_PORT
} = require('./config/config');

const fs = require('fs');
const https = require('https');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const logger = require('./services/logger');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

var server = https.createServer({
    key: fs.readFileSync('./certs/private.key'),
    cert: fs.readFileSync('./certs/crm.crt')
}, app);

var html = fs.readFileSync(__dirname + '/public/index.html');

///Se inicia el webserver
server.listen(HTTP_PORT, () => {
    console.log('Escuchando en el puerto ' + HTTP_PORT);
});

app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.status(200);
});

app.post('/api/cloud/get/clientid', (req, res) => {
    res.status(200).json({ 'clientId': PURECLOUD_FRONT_CLIENTID });
});

logger.Info('OK');
