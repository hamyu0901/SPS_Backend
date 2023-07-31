/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const atomizerData = express.Router();
export { atomizerData };
const bodyParser = require('body-parser');
const commonModule = require('../app');

atomizerData.use(bodyParser.urlencoded({ extended: true }));
atomizerData.use(bodyParser.json());

atomizerData.get('/', (req, res) => {
  res.status(200).send('Atomizer Data');
});

// 어플리케이터 헤더 데이터 조회
atomizerData.get('/data/gridtable/headers/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid', (req, res) => {
  let query = {
    text: "SELECT booth_id, zone_id, zone_type, applicatordata_header FROM def_zone_config WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 어플리케이터 헤더 데이터 저장
atomizerData.put('/data/gridtable/headers', (req, res) => {
  let query = {
    text: "UPDATE def_zone_config SET applicatordata_header = $3 WHERE booth_id = $1 AND zone_id = $2;",
    values: [
      req.body.boothid,
      req.body.zoneid,
      req.body.applicatordataheader
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 도장기 데이터 테이블
atomizerData.post('/data/gridtable', (req, res) => {
  let query = null;
  if (!commonModule.common.isHMMR(req.body.factoryid)) {
    const startTime = `${req.body.prevtime} 00:00:00`;
    const endTime = `${req.body.prevtime} 23:59:59`;
    query = {
      text: "SELECT factory_id, time_stamp, model, color, flow, gunon, hvolt, robotmovingtime, spraycycle, conveyorofftime FROM his_product_record WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp between to_timestamp_imu($5) - interval '1 hour'  AND to_timestamp_imu($6) + interval '25 hour' AND model <> '' AND color <> '' ORDER BY time_stamp desc",
      values: [req.body.factoryid,
        req.body.boothid,
        req.body.zoneid,
        req.body.robotid,
        startTime,
        endTime],
    };
  } else {
    query = `WITH tmp AS ( \
            SELECT time_stamp s_time, e_time \
            FROM ( SELECT *, (CASE robot_mode_run WHEN 1 THEN LEAD(time_stamp) OVER ( ORDER BY time_stamp asc ) END ) e_time \
            FROM (SELECT time_stamp, robot_mode_run, lag( robot_mode_run ) OVER ( ORDER BY time_stamp asc ) tt \
            FROM his_plc_data \
            WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id =${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND (( robot_mode_run = 0 AND job_end = 1 ) OR ( robot_mode_run = 1 AND job_end = 0 )) \
            AND time_stamp BETWEEN to_timestamp_imu('${
  req.body.prevtime
} 00:00') - INTERVAL '1 hour' AND to_timestamp_imu('${
  req.body.prevtime
} 00:00') + INTERVAL '25 hour' ORDER BY time_stamp asc) tmp \
            WHERE ( robot_mode_run = 1 AND tt = 0 ) OR (robot_mode_run = 0 AND tt = 1 )) a \
            WHERE e_time IS NOT null ) \
            SELECT s_time, e_time, body, color, option FROM ( \
            SELECT s_time, e_time, body, rank() OVER ( PARTITION BY s_time ORDER BY count(body) desc ) body_, \
            color, rank() OVER ( PARTITION BY s_time ORDER BY count(color) desc) color_, \
            option, rank() OVER ( PARTITION BY s_time ORDER BY count(option) desc) option_ \
            FROM tmp, his_working_data rt \
            WHERE rt.factory_id = ${
  req.body.factoryid
} AND rt.booth_id = ${
  req.body.boothid
} AND rt.zone_id = ${
  req.body.zoneid
} AND rt.robot_id = ${
  req.body.robotid
} AND rt.time_stamp BETWEEN tmp.s_time AND tmp.e_time \
            AND rt.time_stamp BETWEEN to_timestamp_imu('${
  req.body.prevtime
} 00:00') - INTERVAL '1 hour' AND to_timestamp_imu('${
  req.body.prevtime
} 00:00') + INTERVAL '25 hour' \
            GROUP BY s_time, e_time, body, color, option \
            ORDER BY s_time asc ) a WHERE body_ = 1 AND color_ = 1 AND option_ = 1`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 도장기 데이터 트렌드
atomizerData.post('/data/trend', (req, res) => {
  const query = `SELECT round(EXTRACT(epoch FROM time_stamp - (to_timestamp_imu('${
    req.body.selecttime
  }','yyyy-mm-dd HH24:mi:ss.ms') - interval'${
    req.body.interval
  } ms'))::numeric, 1) AS ms, \
    time_stamp, null, null, null, null, paint_path, paint_path, flow_cmd, hv_cmd, turbine_speed_cmd, sa_s_cmd,sa_v_cmd, \
    flow_feedback, hv_feedback, turbine_speed_feedback, sa_s_feedback, sa_v_feedback FROM his_plc_data \
    WHERE booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp between to_timestamp_imu('${
  req.body.selecttime
}') - interval'${
  req.body.interval
} ms' AND '${
  req.body.selecttime
}'ORDER BY time_stamp ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 실러 트랜드 데이터
atomizerData.get(`/data/sealer/trend/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/timestamp/:timestamp/interval/:interval`, (req, res) => {
  let query = {
    text: `SELECT flow_cmd, flow_feedback, swirl_cmd, swirl_feedback, masking_unit_speed_cmd, pressure_feedback, \
           ROUND(EXTRACT(EPOCH FROM time_stamp - (to_timestamp_imu($4, 'yyyy-mm-dd HH24:mi:ss.ms') - INTERVAL '${req.params.interval} ms'))::numeric, 1) AS ms \
           FROM	his_sealer_data WHERE	booth_id = $1 AND zone_id = $2 AND robot_id = $3 AND time_stamp BETWEEN to_timestamp_imu($4) - INTERVAL '${req.params.interval} ms' AND to_timestamp_imu($4)\
           ORDER BY ms ASC;`,
    values: [
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.timestamp
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 로봇 모니터링 도장기 실러 데이터 트렌드
atomizerData.get('/sealer/trend', (req, res) => {
  const query = {
    text: `
    select
      round(extract(epoch from time_stamp - (to_timestamp_imu($4, 'yyyy-mm-dd HH24:mi:ss.ms') - interval '${req.query.interval} ms'))::numeric, 1) as ms,
      time_stamp,
      flow_cmd,
      flow_feedback,
      swirl_cmd,
      swirl_feedback,
      masking_unit_speed_cmd,
      pressure_feedback
    from
      his_sealer_data
    where
      booth_id = $1
      and zone_id = $2
      and robot_id = $3
      and time_stamp between to_timestamp_imu($4) - interval '${req.query.interval} ms' and to_timestamp_imu($4)
    order by
      time_stamp asc;
    `,
    values: [
      req.query.boothid,
      req.query.zoneid,
      req.query.robotid,
      req.query.selecttime,
    ],
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});