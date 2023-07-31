/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueTemperature = express.Router();
export { torqueTemperature };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueTemperature.use(bodyParser.urlencoded({ extended: true }));
torqueTemperature.use(bodyParser.json());

torqueTemperature.get('/', (req, res) => {
  res.status(200).send('Torque Temperature');
});


torqueTemperature.get('/data/trend/hour', (req, res) => {
  const {robotId, startDate, endDate, axis} = req.query;
  const query = `SELECT date_part('hour', update_time), round(avg(motor_max_encoder[${axis}])):: integer  as max \
    FROM (\
        SELECT update_time::timestamp, motor_max_encoder \
          FROM \
            main.his_report_rawdata_robot,\
            jsonb_to_recordset(main.his_report_rawdata_robot.raw_data_temperature)\
          AS x(update_time timestamp, motor_max_encoder smallint[]) where date between '${startDate}'::date and '${endDate}'::date and robot_id = ${robotId} \
    )T GROUP BY date_part('hour', update_time) ORDER BY date_part asc`
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTemperature.get('/data/trend/day', (req, res) => {
  const {robotId, startDate, endDate, axis} = req.query;
  const query = `SELECT to_char(update_time, 'YYYY-MM-DD') as date, round(avg(motor_max_encoder[${axis}])):: integer as max \
    FROM (\
        SELECT update_time::timestamp, motor_max_encoder \
          FROM \
            main.his_report_rawdata_robot,\
            jsonb_to_recordset(main.his_report_rawdata_robot.raw_data_temperature)\
          AS x(update_time timestamp, motor_max_encoder smallint[]) where date between '${startDate}'::date and '${endDate}'::date and robot_id = ${robotId} \
    )T GROUP BY date ORDER BY date`
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTemperature.get('/data/trend/month', (req, res) => {
  const {robotId, startDate, endDate, axis} = req.query;
  const query = `SELECT date_part('year', update_time), date_part('month', update_time), round(avg(motor_max_encoder[${axis}])):: integer  as max \
    FROM (\
        SELECT update_time::timestamp, motor_max_encoder \
          FROM \
            main.his_report_rawdata_robot,\
            jsonb_to_recordset(main.his_report_rawdata_robot.raw_data_temperature)\
          AS x(update_time timestamp, motor_max_encoder smallint[]) where date between '${startDate}'::date and '${endDate}'::date and robot_id = ${robotId} \
    )T GROUP BY date_part('year', update_time), date_part('month', update_time) ORDER BY date_part('year', update_time), date_part('month', update_time) asc`
  commonModule.mainDB.execute(query, req.session.spsid, res);
});


// renew 모터 온도 조회(존 별)
torqueTemperature.post('/renew/data/trend', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    text: `SELECT robot_id, start_time, end_time, temperature_max, temperature_max_spec, axis_count, is_cart, (cart+axis_count) as robot_axis FROM \
    (SELECT robot_data.robot_id, robot_data.start_time, robot_data.end_time, robot_data.temperature_max, robot_config.temperature_max_spec, \
    robot_model.axis_count, robot_config.is_cart, CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart FROM main.robot_config robot_config INNER JOIN main.his_robot_data robot_data ON robot_config.robot_id = robot_data.robot_id \
    INNER JOIN main.def_robot_model robot_model on robot_model.robot_model_id = robot_config.robot_model_id \
    WHERE robot_data.robot_id IN (${req.body.robotid}) and start_time BETWEEN $1 AND $2 ORDER BY robot_data.robot_id)T`,
    values: [
      start_time,
      end_time
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// renew 모터 온도 조회(로봇 별, 축별)
torqueTemperature.post('/renew/data/trend/robot/axis', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    text: `SELECT temperature_max[$4] as data, robot_data.robot_id, to_char(start_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')as date, robot_config.temperature_max_spec[$4] as spec from  main.his_robot_data robot_data
    INNER JOIN main.robot_config robot_config ON robot_config.robot_id = robot_data.robot_id
    WHERE robot_data.robot_id = $3 and start_time between $1 and $2 order by start_time`,
    values: [
      start_time,
      end_time,
      req.body.robotid,
      req.body.axis
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
});
// renew 모터 온도 평균 조회(로봇 별, 축별)
torqueTemperature.post('/renew/avg/trend/robot/axis', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    text : `SELECT ROUND(AVG(temperature_max[$4])) as data_avg from main.his_robot_data where robot_id = $3 and start_time between $1 and $2`,
    values: [
      start_time,
      end_time,
      req.body.robotid,
      req.body.axis
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
});
// Insert global motor encoder temperature standard data.
torqueTemperature.post('/data/limit', (req, res) => {
  const query = {
    text: 'INSERT INTO his_temperaturelimit_config2 values($1, $2, $3, $4, $5, $6, $7)',
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      req.body.axis,
      req.body.updatetime,
      req.body.templimit,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
//renew 모터 온도 설정값 저장
torqueTemperature.put(`/renew/data/temp/limit`, (req, res) => {
  let query = {
    text: `UPDATE main.robot_config SET temperature_max_spec[$1]= $2 where robot_id = $3`,
    values: [
      req.body.axis,
      req.body.config,
      req.body.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})
//renew 모터 온도 설정값 조회
torqueTemperature.post(`/renew/data/temp/limit`, (req, res) => {
  let query = {
    text: `SELECT temperature_max_spec[$1] from main.robot_config where robot_id = $2`,
    values: [
      req.body.axis,
      req.body.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

// Update global motor encoder temperature standard data.
torqueTemperature.post('/data/limit/renew', (req, res) => {
  const query = {
    text: 'UPDATE his_temperaturelimit_config2 SET temperature_limit = $1 WHERE factory_id = $2 and booth_id = $3 and zone_id = $4 and robot_id = $5 and axis = $6 and update_time = $7',
    values: [
      req.body.templimit,
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      req.body.axis,
      req.body.updatetime,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// Get current global motor encoder temperature data.
torqueTemperature.get('/data/limit/', (req, res) => {
  const query = {
    text: 'SELECT temperature_limit AS limit, update_time FROM def_temperaturelimit_config where factory_id = $1 and booth_id = $2 and zone_id = $3 \
    and robot_id = $4 and axis = $5',
    values: [
      req.query.factoryid,
      req.query.boothid,
      req.query.zoneid,
      req.query.robotid,
      req.query.axis,
    ]
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// renew 온도 설정값 조회.
torqueTemperature.post('/renew/data/config', (req, res) => {
  const query = {
    text: `select robot_id, robot_name, temperature_max_spec[$2] from main.robot_config WHERE robot_id = $1`,
    values: [
      req.body.robotid,
      req.body.axis
    ]
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
})