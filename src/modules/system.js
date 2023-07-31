const appHandle = require('../routes/app');
const fs = require('fs');
const jsonfile = require('jsonfile');
const winston = require('winston');
const winstonDaily = require('winston-daily-rotate-file');
const moment = require('moment');

function timeStampFormat() {
  return moment().format('YYYY-MM-DD HH:mm:ss.SSS ZZ');
}

export class Factory {
    constructor() {

    }
    logMsg = winston.createLogger({
        transports: [
          new (winstonDaily)({
            name: 'info-file',
            filename: './log/realtime_%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            colorize: false,
            maxsize: 50000000,
            maxFiles: 1000,
            level: 'info',
            showLevel: false,
            json: true,
            format: winston.format.json(),
            timestamp: timeStampFormat,
          }),
          new (winston.transports.Console)({
            name: 'debug-console',
            colorize: true,
            level: 'debug',
            showLevel: false,
            json: true,
            format: winston.format.json(),
            timestamp: timeStampFormat,
          }),
        ],
      });
    _layoutFile = './data/layout.json';
    _logFile = './log/';
    initialize() {
        let self = this;
        let targetDir = './data';
        fs.stat(targetDir, function(err) {
            if (!err) {
                
            }
            else if (err.code === 'ENOENT') {
                fs.mkdirSync(targetDir, { recursive: true });
                self.createfactoryInfo();
            }
        });
    }
    createfactoryInfo() {
        const query = {
            text: `
            SELECT
                json_build_object('boothid', booth_id , 'zoneid', zone_id, 'robotid', robot_id) as robot
            FROM
                def_robot_config
            ORDER BY booth_id, zone_id, robot_id 
            `,
        }
        appHandle.mainDB.getInstance().query(query, (err, res) => {
            if (err) {

            } else {
                let temp = [];
                for (let idx = 0; idx < res.rows.length; ++idx) {
                    temp[idx] = {
                        boothid: res.rows[idx].robot.boothid,
                        zoneid: res.rows[idx].robot.zoneid,
                        robotid: res.rows[idx].robot.robotid,
                        axis: [],
                    }                    
                }
                for (let idx = 0; idx < res.rows.length; ++idx) {
                    for (let iidx = 0; iidx < 7; ++iidx) {
                        temp[idx].axis[iidx] = {
                            forwardViolation: `300`,
                            reverseViolation: `-300`,
                            forwardWarning: `300`,
                            reverseWarning: `-300`,
                        }
                    }
                }
                jsonfile.writeFileSync(this._layoutFile, JSON.parse(JSON.stringify(temp)));
            }
        });
    }
    set realtimeTorqueLoadFactorWarningValue(robot) {
        let obj = jsonfile.readFileSync(this._layoutFile);
        for (let idx = 0; idx < obj.length; ++idx) {
            if (obj[idx].robotid === Number(robot.robotid)) {
                obj[idx].axis[(robot.axis-1)].forwardViolation = Number(robot.forwardviolation);
                obj[idx].axis[(robot.axis-1)].reverseViolation = Number(robot.reverseviolation);
                obj[idx].axis[(robot.axis-1)].forwardWarning = Number(robot.forwardwarning);
                obj[idx].axis[(robot.axis-1)].reverseWarning = Number(robot.reversewarning);
            }
        }
        jsonfile.writeFileSync(this._layoutFile, obj);
    }
    getRealtimeTorqueLoadFactorWarningValue(robot) {
        let obj = jsonfile.readFileSync(this._layoutFile);
        for (let idx = 0; idx < obj.length; ++idx) {
            if (obj[idx].robotid === Number(robot.robotid)) {
                return obj[idx].axis[(robot.axis-1)];
            }
        }
    }
    set realtimeTorqueLoadFactorLogMessage(message) {
        this.logMsg.info(message);
    }
    getRealtimeTorqueLoadFactorLogMessage(date) {
        return JSON.parse(JSON.stringify(fs.readFileSync(`./log/realtime_${String(date).replace(/'/g, "")}.log`, 'utf8')));
    }
};