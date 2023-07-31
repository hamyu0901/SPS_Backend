const seq = require('sequelize');
const fs = require('fs');
let dbObject = {
    ip: null,
    port: null,
    name: null,
    pw: null
}
let data = fs.readFileSync('dbConfig.json', 'utf8');
const json = JSON.parse(data);
dbObject.ip = String(json.ip);
dbObject.port = String(json.port);
dbObject.name = String(json.name);
dbObject.pw = String(json.pw);

const toTime = new Date();
const hour = toTime.getTimezoneOffset() / 60;
export const sequelize = new seq(dbObject.name, 'dy_selector', dbObject.pw, {
    host: dbObject.ip,
    dialect: 'postgres',
    timezone: String(hour),
    port: dbObject.port,
    logging: false,
});