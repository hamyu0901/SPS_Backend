/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueData = express.Router();
export { torqueData };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueData.use(bodyParser.urlencoded({ extended: true }));
torqueData.use(bodyParser.json());

torqueData.get('/', (req, res) => {
  res.status(200).send('Torque Data');
});

// use table : def_robot_config
// join table : def_model_config, def_booth_config, def_zone_config
torqueData.post('/data/table', (req, res) => {
  const query = {
    // eslint-disable-next-line no-multi-str
    text: 'SELECT robot_id, robot_name ,atom_model_id ,rc_model_id, \
        def_model_config.model_name as rc_name, booth_name, zone_name , Ip_addr, \
        c.model_name as atom_model, b.model_name as robot_model, \
        install_date FROM def_robot_config \
        INNER JOIN def_model_config on def_robot_config.rc_model_id = def_model_config.model_id \
        INNER JOIN def_booth_config on def_robot_config.booth_id = def_booth_config.booth_id \
        AND def_robot_config.factory_id = def_booth_config.factory_id \
        INNER JOIN def_zone_config on def_robot_config.booth_id = def_zone_config.booth_id \
        AND def_robot_config.factory_id = def_zone_config.factory_id \
        AND def_robot_config.zone_id = def_zone_config.zone_id \
        INNER JOIN def_model_config as c on def_robot_config.atom_model_id = c.model_id \
        INNER JOIN def_model_config as b on def_robot_config.robot_model_id = b.model_id \
        WHERE def_robot_config.factory_id = $1 and def_robot_config.booth_id = $2 and def_robot_config.zone_id = $3 \
        and def_robot_config.robot_id = $4',
    values: [req.body.factoryid, req.body.boothid, req.body.zoneid, req.body.robotid],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// use table : his_robot_torque
torqueData.get('/data/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/starttime/:starttime/endtime/:endtime/jobfile/:jobfile', (req, res) => {
  const query = {
    text: "SELECT round( EXTRACT( epoch FROM time_stamp - to_timestamp_imu($6, 'YYYY-MM-DD HH24:MI:SS.MS')):: NUMERIC, 1) AS sec, step_no, T.motor_torque[$5] AS torque \
    FROM his_robot_torque AS T \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND \
    time_stamp BETWEEN to_timestamp_imu($6, 'YYYY-MM-DD HH24:MI:SS.MS') AND to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS') AND job_name = $8 \
    ORDER BY time_stamp ASC, sec ASC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.axis,
      req.params.starttime,
      req.params.endtime,
      req.params.jobfile
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueData.get('/robot-info/table', (req, res) => {
  const { robotId } = req.query;
  const query = `SELECT robot_id, robot_name, main.robot_config.rc_model_id, rc_model_name AS rc_name, main.robot_config.robot_model_id, robot_model_name AS robot_model, robot_ip AS ip_addr FROM main.robot_config INNER JOIN main.def_rc_model ON main.robot_config.rc_model_id = main.def_rc_model.rc_model_id \
  INNER JOIN main.def_robot_model ON main.robot_config.robot_model_id = main.def_robot_model.robot_model_id WHERE robot_id = ${robotId}`;

  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueData.get('/list', (req, res) => {
  const { robotId, date } = req.query;
  const startTime = `'${date} 00:00:00'`;
  const endTime = `'${date} 23:59:59'`;
  const query = `SELECT robot_id, job_name, TO_CHAR(start_time, 'yyyy-mm-dd HH24:mi:ss.ms') AS start_time, TO_CHAR(end_time, 'yyyy-mm-dd HH24:mi:ss:ms') AS end_time, cycle_time, step_no, torque_avg AS torque FROM main.his_robot_job_stepdata \
  WHERE robot_id = ${robotId} AND start_time >= ${startTime} AND end_time <= ${endTime} GROUP BY robot_id, job_name, start_time, end_time ORDER BY start_time DESC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})