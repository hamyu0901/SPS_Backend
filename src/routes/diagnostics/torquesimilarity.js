/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueSimilarity = express.Router();
export { torqueSimilarity };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueSimilarity.use(bodyParser.urlencoded({ extended: true }));
torqueSimilarity.use(bodyParser.json());

torqueSimilarity.get('/', (req, res) => {
  res.status(200).send('Torque Similarity');
});

// 로봇 컨트롤러 정보 요청
torqueSimilarity.post('/data/robot/info', (req, res) => {
  const query = {
    text: 'SELECT model_name AS modelname FROM def_robot_config INNER JOIN def_model_config ON def_robot_config.rc_model_id = def_model_config.model_id WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4',
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 잡 리스트 요청
torqueSimilarity.post('/data/joblist', (req, res) => {
  const query = {
    text: 'SELECT extract(month FROM update_timestamp - CURRENT_TIMESTAMP ) AS gap, job_list FROM cur_job_list WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4',
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueSimilarity.post('/data/gridtable/dx/search/1', (req, res) => {
  const startTime = `${String(req.body.selectdate)} ${String(req.body.selecthour)}:00`;
  const endTime = `${String(req.body.selectdate)} ${String(Number(req.body.selecthour) + 1)}:00`;
  const query = {
    text: "WITH tmp AS (SELECT time_stamp s_time, e_time FROM (SELECT *, ( CASE robot_mode_run WHEN 1 THEN LEAD ( time_stamp ) OVER ( ORDER BY time_stamp ASC ) END ) e_time FROM (SELECT time_stamp, robot_mode_run, LAG ( robot_mode_run ) OVER ( ORDER BY time_stamp ASC ) tt FROM his_plc_data WHERE factory_id = $1 and booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) ORDER BY time_stamp ASC) tmp WHERE ( robot_mode_run = 1 AND tt = 0 )  OR ( robot_mode_run = 0 AND tt = 1 )) A WHERE e_time IS NOT NULL) SELECT DISTINCT tmp.s_time AS starttime, tmp.e_time AS endtime, rt.job_name AS jobname, round( EXTRACT ( epoch FROM ( tmp.e_time - tmp.s_time ) ) :: NUMERIC ) AS cycle  FROM tmp INNER JOIN his_robot_torque rt ON ( rt.time_stamp BETWEEN tmp.s_time AND tmp.e_time ) WHERE rt.factory_id = $1 AND rt.booth_id = $2 AND rt.zone_id = $3 AND rt.robot_id = $4 AND rt.time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) AND job_name NOT IN ( 'HOME', 'MASTER' ) AND job_name = $7 ORDER BY starttime DESC;",
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      startTime,
      endTime,
      commonModule.common.checkJobName(req.body.jobname),
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueSimilarity.post('/data/gridtable/dx/search/2', (req, res) => {
  const startTime = `${String(req.body.selectdate)} ${String(req.body.selecthour)}:00`;
  const endTime = `${String(req.body.selectdate)} ${String(Number(req.body.selecthour) + 1)}:00`;
  const query = {
    text: "WITH tmp AS (SELECT time_stamp s_time, e_time FROM (SELECT *, ( CASE robot_mode_run WHEN 1 THEN LEAD ( time_stamp ) OVER ( ORDER BY time_stamp ASC ) END ) e_time FROM (SELECT time_stamp, robot_mode_run, LAG ( robot_mode_run ) OVER ( ORDER BY time_stamp ASC ) tt FROM his_plc_data WHERE factory_id = $1 and booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) ORDER BY time_stamp ASC) tmp WHERE ( robot_mode_run = 1 AND tt = 0 )  OR ( robot_mode_run = 0 AND tt = 1 )) A WHERE e_time IS NOT NULL) SELECT DISTINCT tmp.s_time AS starttime, tmp.e_time AS endtime, rt.job_name AS jobname, round( EXTRACT ( epoch FROM ( tmp.e_time - tmp.s_time ) ) :: NUMERIC ) AS cycle  FROM tmp INNER JOIN his_robot_torque rt ON ( rt.time_stamp BETWEEN tmp.s_time AND tmp.e_time ) WHERE rt.factory_id = $1 AND rt.booth_id = $2 AND rt.zone_id = $3 AND rt.robot_id = $4 AND rt.time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) AND job_name NOT IN ( 'HOME', 'MASTER' ) AND job_name = $7 ORDER BY starttime DESC;",
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      startTime,
      endTime,
      commonModule.common.checkJobName(req.body.jobname),
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueSimilarity.post('/data/gridtable/dx/search', (req, res) => {
  const startTime = `${String(req.body.selectdate)} 00:00:00`;
  const endTime = `${String(req.body.selectdate)} 23:59:59`;
  const query = {
    text: "WITH tmp AS (SELECT time_stamp s_time, e_time FROM (SELECT *, ( CASE robot_mode_run WHEN 1 THEN LEAD ( time_stamp ) OVER ( ORDER BY time_stamp ASC ) END ) e_time FROM (SELECT time_stamp, robot_mode_run, LAG ( robot_mode_run ) OVER ( ORDER BY time_stamp ASC ) tt FROM his_plc_data WHERE factory_id = $1 and booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) ORDER BY time_stamp ASC) tmp WHERE ( robot_mode_run = 1 AND tt = 0 )  OR ( robot_mode_run = 0 AND tt = 1 )) A WHERE e_time IS NOT NULL) SELECT DISTINCT tmp.s_time AS starttime, tmp.e_time AS endtime, rt.job_name AS jobname, round( EXTRACT ( epoch FROM ( tmp.e_time - tmp.s_time ) ) :: NUMERIC ) AS cycle  FROM tmp INNER JOIN his_robot_torque rt ON ( rt.time_stamp BETWEEN tmp.s_time AND tmp.e_time ) WHERE rt.factory_id = $1 AND rt.booth_id = $2 AND rt.zone_id = $3 AND rt.robot_id = $4 AND rt.time_stamp BETWEEN to_timestamp_imu ($5) AND to_timestamp_imu ($6) AND job_name NOT IN ( 'HOME', 'MASTER' ) AND job_name = $7 ORDER BY starttime DESC;",
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      startTime,
      endTime,
      commonModule.common.checkJobName(req.body.jobname),
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueSimilarity.post('/data/nx/trend', (req, res) => {
  const startTime = `${String(req.body.starttime)} 00:00:00`;
  const endTime = `${String(req.body.starttime)} 23:59:59`;
  const query = {
    text: 'SELECT step_no, round(avg(t.motor_torque [$1]), 0) AS Torque FROM his_robot_torque AS t WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND robot_id = $5 AND time_stamp BETWEEN $6 AND $7 AND (motor_torque [1] = 0 AND motor_torque [2] = 0 AND motor_torque [3] = 0 AND motor_torque [4] = 0 AND motor_torque [5] = 0 AND motor_torque [6] = 0 AND motor_torque [7] = 0) != TRUE AND job_name = $8 GROUP BY step_no ORDER BY step_no ASC',
    values: [
      req.body.axis,
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      startTime,
      endTime,
      commonModule.common.checkJobName(req.body.jobname),
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
torqueSimilarity.get('/data/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/date/:date', (req, res) => {
  const query = {
    text: "SELECT step_no as stepno, avg_val as avg FROM his_torque_stepdata \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND axis = $5 AND job_name = $6 AND time_stamp = $7",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.axis,
      req.params.jobname,
      req.params.date
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueSimilarity.get('/data/detail/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/startime/:starttime/endtime/:endtime', (req, res) => {
  const query = {
    text: "SELECT round( EXTRACT( epoch FROM time_stamp - to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS')):: NUMERIC, 1) AS sec, step_no AS stepno, T.motor_torque[$5] AS torque \
    FROM his_robot_torque AS T \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND job_name = $6 AND\
    time_stamp BETWEEN to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS') AND to_timestamp_imu($8, 'YYYY-MM-DD HH24:MI:SS.MS') \
    ORDER BY time_stamp ASC, sec ASC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.axis,
      req.params.jobname,
      req.params.starttime,
      req.params.endtime
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueSimilarity.get('/data/detail/time/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/startime/:starttime/endtime/:endtime', (req, res) => {
  const query = {
    text: "SELECT round( EXTRACT( epoch FROM time_stamp - to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS')):: NUMERIC, 1) AS sec, motor_torque[$5] AS torque \
    FROM his_robot_torque WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND job_name = $6 AND \
    time_stamp BETWEEN to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS') AND to_timestamp_imu($8, 'YYYY-MM-DD HH24:MI:SS.MS') \
    ORDER BY time_stamp ASC, sec ASC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.axis,
      req.params.jobname,
      req.params.starttime,
      req.params.endtime
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueSimilarity.get('/data/detail/stepno/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/startime/:starttime/endtime/:endtime', (req, res) => {
  const query = {
    text: "SELECT step_no AS stepno, round(avg(motor_torque[$5]), 0) AS torque FROM his_robot_torque \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND job_name = $6 AND \
    time_stamp BETWEEN to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS') AND to_timestamp_imu($8, 'YYYY-MM-DD HH24:MI:SS.MS') \
    GROUP BY stepno ORDER BY stepno ASC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.axis,
      req.params.jobname,
      req.params.starttime,
      req.params.endtime
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueSimilarity.post('/data/dx/trend', (req, res) => {
  let startTime = null;
  let endTime = null;
  let query = null;
  if (String(req.body.starttime).length > 10) {
    startTime = req.body.starttime;
    endTime = req.body.endtime;
    query = {
      text: "SELECT EXTRACT (epoch FROM time_stamp - to_timestamp_imu($6, 'YYYY-MM-DD HH24:MI:SS.MS')) * 1000 AS ms, step_no, T.motor_torque [$1] AS Torque FROM his_robot_torque AS T WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND robot_id = $5 AND time_stamp BETWEEN to_timestamp_imu($6, 'YYYY-MM-DD HH24:MI:SS.MS') AND to_timestamp_imu($7, 'YYYY-MM-DD HH24:MI:SS.MS') AND job_name = $8 ORDER BY ms ASC",
      values: [
        req.body.axis,
        req.body.factoryid,
        req.body.boothid,
        req.body.zoneid,
        req.body.robotid,
        startTime,
        endTime,
        commonModule.common.checkJobName(req.body.jobname),
      ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, (data) => {
      res.status(200).json(data);
    });
  } else {
    startTime = `${String(req.body.starttime)} 00:00:00`;
    endTime = `${String(req.body.starttime)} 23:59:59`;
    query = {
      text: 'SELECT step_no, round(avg(t.motor_torque [$1]), 0) AS Torque FROM his_robot_torque AS t WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND robot_id = $5 AND time_stamp BETWEEN $6 AND $7 AND (motor_torque [1] = 0 AND motor_torque [2] = 0 AND motor_torque [3] = 0 AND motor_torque [4] = 0 AND motor_torque [5] = 0 AND motor_torque [6] = 0 AND motor_torque [7] = 0) != TRUE AND job_name = $8 GROUP BY step_no ORDER BY step_no ASC',
      values: [
        req.body.axis,
        req.body.factoryid,
        req.body.boothid,
        req.body.zoneid,
        req.body.robotid,
        startTime,
        endTime,
        commonModule.common.checkJobName(req.body.jobname),
      ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
  }
});
