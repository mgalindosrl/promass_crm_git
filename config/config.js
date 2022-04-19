const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
    NODE_ENV: process.env.NODE_ENV,
    HTTP_PORT: process.env.HTTP_PORT,
    PURECLOUD_CLIENTID: process.env.PURECLOUD_CLIENTID,
    PURECLOUD_CLIENTSECRET: process.env.PURECLOUD_CLIENTSECRET,
    PURECLOUD_FRONT_CLIENTID: process.env.PURECLOUD_FRONT_CLIENTID,
    ORGANIZATION_ID: process.env.ORGANIZATION_ID
}