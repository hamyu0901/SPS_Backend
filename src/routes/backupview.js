/* eslint-disable import/prefer-default-export */
/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const backupview = express.Router();
export { backupview };
const bodyParser = require('body-parser');
const fs = require('fs');
const zip = require('zip-folder');
const rimraf = require('rimraf');

const commonModule = require('./app');

backupview.use(bodyParser.urlencoded({ extended: true }));
backupview.use(bodyParser.json());

backupview.get('/', (req, res) => {
  res.status(200).send('backupview');
});

backupview.post('/grid', (req, res) => {
  let query = `SELECT to_char ( time_stamp, 'YYYY-MM-DD HH24:MI:SS:MS' ) AS time_stamp,\
    def_booth_config.booth_name,\
    def_zone_config.zone_name,\
    def_robot_config.robot_name \
    FROM his_backup_list \
    LEFT OUTER JOIN def_robot_config \
    ON def_robot_config.factory_id = his_backup_list.factory_id \
    AND def_robot_config.booth_id = his_backup_list.booth_id \
    AND def_robot_config.zone_id = his_backup_list.zone_id \
    AND def_robot_config.robot_id = his_backup_list.robot_id \
    LEFT OUTER JOIN def_booth_config \
    ON his_backup_list.factory_id = def_booth_config.factory_id \
    AND his_backup_list.booth_id = def_booth_config.booth_id \
    LEFT OUTER JOIN def_zone_config \
    ON his_backup_list.factory_id = def_zone_config.factory_id \
    AND his_backup_list.booth_id = def_zone_config.booth_id \
    AND his_backup_list.zone_id = def_zone_config.zone_id \
    WHERE his_backup_list.factory_id = ${
  req.body.factoryid
}AND to_timestamp_imu('${
  req.body.prevtime
}','YYYY-MM-DD') <= his_backup_list.time_stamp \
    AND ((to_timestamp_imu('${
  req.body.currtime
}','YYYY-MM-DD')) + interval '1 day') > his_backup_list.time_stamp`;
  if (req.body.boothid != null) {
    query += ` AND his_backup_list.booth_id=${req.body.boothid}`;
  }
  if (req.body.zoneid != null) {
    query += ` AND his_backup_list.zone_id=${req.body.zoneid}`;
  }
  if (req.body.robotid != null) {
    query += ` AND his_backup_list.robot_id=${req.body.robotid}`;
  }
  query
    += ' GROUP BY time_stamp, def_booth_config.booth_name, def_zone_config.zone_name, def_robot_config.robot_name ORDER BY his_backup_list.time_stamp ASC';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

backupview.get('/grid/detail', (req, res) => {
  const query = {
    text: `SELECT file_name, time_stamp, file_content FROM his_backup_list WHERE his_backup_list.time_stamp = to_timestamp_imu($1,'YYYY-MM-DD HH24:MI:SS') AND factory_id = $2 AND booth_id = $3 AND zone_id = $4 \
    ${(req.query.robotid === undefined) ? ``: `AND robot_id = ${String(req.query.robotid)}`} ORDER BY file_name ASC;`,
    values: [
      req.query.selecttime,
      req.query.factoryid,
      req.query.boothid,
      req.query.zoneid,
    ]
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

backupview.get('/download/detail/time/:time/factory/:factoryid/booth/:boothid/zone/:zoneid/robot/:robotid', (req, res) => {
  const query = `SELECT file_name, file_content \
    FROM his_backup_list \
    WHERE his_backup_list.time_stamp = to_timestamp_imu('${
  req.params.time
}','YYYY-MM-DD HH24:MI:SS') \
    AND factory_id = ${
  req.params.factoryid
}AND booth_id = ${
  req.params.boothid
}AND zone_id = ${
  req.params.zoneid
}AND robot_id = ${
  req.params.robotid
}ORDER BY file_name ASC`;
  commonModule.mainDB.execute(query, req.session.spsid, (file) => {
    let fileName;
    let data;
    try {
      if (!fs.existsSync('./temp')) {
        fs.mkdirSync('./temp');
      }
      if (fs.existsSync('./download')) {
        rimraf.sync('./download');
      }
      for (let i = 0; i < file.length; i++) {
        fileName = `./temp/${file[i][0]}`;
        data = commonModule.common.base64decode(JSON.stringify(file[i][1]));
        fs.writeFileSync(fileName, data, 'ascii');
        if (i === file.length - 1) {
          fs.mkdirSync('./download');
          const timeInfo = new Date();
          const makeTime = `${timeInfo.getFullYear()}-${timeInfo.getMonth()}-${timeInfo.getDate()
          }-${timeInfo.getHours()}${timeInfo.getMinutes()}${timeInfo.getSeconds()}`;
          const downFileName = `./download/Backup_archive-${makeTime}.zip`;
          zip('./temp/', downFileName, (err) => {
            if (err) {
              res.status(404).send('failed');
            } else {
              res.download(downFileName);
              rimraf.sync('./temp');
            }
          });
        }
      }
    } catch (e) {

    }
  });
});
