/* eslint-disable no-console */
/* eslint-disable no-plusplus */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable import/order */
/* eslint-disable linebreak-style */
/* eslint-disable new-cap */
/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable linebreak-style */
/* eslint linebreak-style: ["error", "windows"] */

import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import ip from 'ip';
import bodyParser from 'body-parser';
import fs from 'fs';
import helmet from 'helmet';

const app = express();
const http = require('http').Server(app);
const rerender = require('./rerender');
const home = require('./home');
const monitoring = require('./monitoring');
const torquemonitoring = require('./torquemonitoring');
const robotdetails = require('./robotdetails');
const backupview = require('./backupview');
const diagnostics = require('./diagnostics');
const extra = require('./extra');
const reportview = require('./reportview');
const maintenance = require('./maintenance');
const alarmview = require('./alarmview');
const posthistory = require('./posthistory');
const sparepart = require('./sparepart');
const info = require('./info');
const auth = require('./auth');
const excel = require('./excel');
const realtimeview = require('./realtimeview');
const alarm = require('./alarm');
const cmModule = require('../modules/cmmodule');
const system = require('../modules/system');

/** 암복호화 관련 */
const common = new cmModule.common();
/** 버전, 리비전, copyright 관련 */
const setCfg = new cmModule.settingConfig();
const siModule = require('../modules/simodule');

/** size 정보 */
const infoManager = new siModule.siteInfo();
const pgModule = require('../modules/pgmodule');
const taskModule = require('../modules/taskmodule');

const ioModule = require('../modules/ioModule');

/** 언어 관련 */
const task = new taskModule.taskManager();
/** 세션 관련 */
const sess = new taskModule.sessionManager();
/** 소켓 관련 */
const ioManager = new ioModule.ioModule(http);

// eslint-disable-next-line prefer-const
let dbObject = {
  ip: null,
  port: null,
  name: null,
};
const data = fs.readFileSync('dbConfig.json', 'utf8');
const json = JSON.parse(data);
dbObject.ip = String(json.ip);
dbObject.port = String(json.port);
dbObject.name = String(json.name);

const mainDB = new pgModule.pgTask(dbObject.ip, dbObject.port, dbObject.name);

/** db connect */
mainDB.initialize();
ioManager.notifyRun();
const factory = new system.Factory();
factory.initialize();
const mapper = require('../modules/dbMapper/public');

let session = require('express-session');
let LokiStore = require('connect-loki')(session);

const allowIP = [
  `http://${ip.address()}:3500`,
  `https://${ip.address()}:3500`,
  `http://localhost:3500`,
  `https://localhost:3500`,
  `https://${ip.address()}:5000`,
  `http://localhost:9080`,
  `http://192.168.200.1:3500`,
  `https://192.168.200.1:3500`,
];

const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');
const moment = require('moment');

function timeStampFormat() {
  return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}

const logMsg = winston.createLogger({
  transports: [
    new (winstonDaily)({
      name: 'info-file',
      filename: './log/app_%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      colorize: false,
      maxsize: 50000000,
      maxFiles: 1000,
      level: 'info',
      showLevel: true,
      json: false,
      timestamp: timeStampFormat,
    }),
    new (winston.transports.Console)({
      name: 'debug-console',
      colorize: true,
      level: 'debug',
      showLevel: true,
      json: false,
      timestamp: timeStampFormat,
    }),
  ],
  exceptionHandlers: [
    new (winstonDaily)({
      name: 'exception-file',
      filename: './log/exception_%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      colorize: false,
      maxsize: 50000000,
      maxFiles: 1000,
      level: 'error',
      showLevel: true,
      json: false,
      timestamp: timeStampFormat,
    }),
    new (winston.transports.Console)({
      name: 'exception-console',
      colorize: true,
      level: 'debug',
      showLevel: true,
      json: false,
      timestamp: timeStampFormat,
    }),
  ],
});


app.use(helmet()); // 기본적인 보안(X-Powered-By 등)만 설정
app.use(helmet.noSniff()); //X-Content-Type-Options 설정하여, 선언된 콘텐츠 유형으로부터 벗어난 응답에 대한 브라우저의 MIME 가로채기를 방지.
app.use(express.static('./public')); // 정적 파일(폴더 위치)
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(
    session({
      secret: 'DYService',
      resave: false,
      saveUninitialized: false,
      name: 'spsid',
      store: new LokiStore()
    })
);
app.use(logger('common', { stream: fs.createWriteStream('./sps_comm_http.log', { flags: 'a' }) }));
app.use(logger('dev'));
app.use(cors({
  origin: [allowIP[0], allowIP[1], allowIP[2], allowIP[3], allowIP[4], allowIP[5], allowIP[6], allowIP[7]],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));
app.disable('x-powered-by'); // defence of middleware

app.use('/', rerender.rerender);
app.use('/home', home.home);
app.use('/monitoring', monitoring.monitoring);
app.use('/torquemonitoring', torquemonitoring.torqueMonitoring);
app.use('/robotdetails', robotdetails.robotdetails);
app.use('/backupview', backupview.backupview);
app.use('/diagnostics', diagnostics.diagnostics);
app.use('/extra', extra.extra);
app.use('/reportview', reportview.reportview);
app.use('/maintenance', maintenance.maintenance);
app.use('/alarmview', alarmview.alarmView);
app.use('/posthistory', posthistory.postHistory);
app.use('/sparepart', sparepart.sparepart);
app.use('/info', info.info);
app.use('/auth', auth.auth);
app.use('/sps', auth.refresh);
app.use('/excel', excel.excel);
app.use('/realtimeview', realtimeview.realtimeview);
app.use('/alarm', alarm.alarm);
app.use(setTimeOut);

if (app.get('env') === 'development') {
  console.log(app.get('env'));
  sess.setDebugMode();
  task.setGlobalLanguage('kr');
} else {
  console.log(app.get('env'));
}

function setTimeOut(req, res, next) {
  if (!req.timedout) next();
}

const server = http.listen(8000, '0.0.0.0', () => {
  console.warn('HTTP Start Server : Listen...');
});
server.timeout = 600000;

process.on('uncaughtException', (err) => {
  logMsg.error(err);
  mainDB.end();
  mainDB.notifyEnd();
  process.exit(1);
});

export { ioManager };
export { infoManager };
export { mainDB };
export { common };
export { task };
export { sess };
export { setCfg };
export { logMsg };
export { factory };
export { mapper };
