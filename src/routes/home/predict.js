/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const predict = express.Router();
export { predict };
const bodyParser = require('body-parser');
const commonModule = require('../app');

predict.use(bodyParser.urlencoded({ extended: true }));
predict.use(bodyParser.json());

predict.get('/', (req, res) => {
  res.status(200).send('Predict');
});

// ip:port/home/predict/{API}

predict.get('/diagnostics', (req, res) => {
  const query = 'SELECT booth_id, zone_id, robot_id, count(robot_id), min(check_date) FROM his_robotpredict_point WHERE check_date = CURRENT_DATE AND predict_type in ( 1, 2, 3 ) GROUP BY booth_id, zone_id, robot_id;';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

predict.get('/list', (req, res) => {
  const query = {
    text: `SELECT 
    (SELECT booth_name FROM def_booth_config b WHERE b.factory_id = c.factory_id AND b.booth_id = c.booth_id), 
    (SELECT zone_name FROM def_zone_config z WHERE z.factory_id = c.factory_id AND z.zone_id = c.zone_id ), 
    (SELECT robot_name FROM def_robot_config r WHERE r.factory_id = c.factory_id AND r.robot_id = c.robot_id ), 
    booth_id,
    zone_id,
    robot_id,
    predict_occur[1] AS P001, 
    predict_occur[2] AS P002,  
    predict_occur[5] AS P005, 
    (SELECT COALESCE(SUM(s),0) as sum FROM UNNEST(predict_occur) s) FROM cur_predict_data c ORDER BY sum DESC;`,
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

predict.get('/list/boothid/:boothid/zoneid/:zoneid/robotid/:robotid', (req, res) => {
    const query = {
      text: `SELECT predict_occur[1] AS P001, predict_occur[2] AS P002, predict_occur[5] AS P005
      FROM cur_predict_data
      WHERE booth_id = ${req.params.boothid} AND zone_id = ${req.params.zoneid} AND robot_id = ${req.params.robotid};
      `
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

predict.post('/list/detail', (req, res) => {
  const query = ` SELECT * FROM \
    (\
    SELECT \
    DISTINCT 'P005' AS code, (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P005') AS content, time_stamp, end_time, job_name, axis \
    FROM \
    his_violationjob_accum \
    WHERE \
    time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() \
    AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} UNION ALL \
    SELECT \
    'P001' AS code, (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, time_stamp, end_time, job_name, axis \
    FROM \
    his_robot_torque_violationjob \
    WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() \
    AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
}   UNION ALL \
    SELECT 'P002' as code, (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, update_time, update_time, job_name, axis \
    FROM his_violation_temperature WHERE update_time BETWEEN now_timestamp() - interval '1 week' and now_timestamp() and booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
}) a order by a.time_stamp desc LIMIT 20;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

predict.get('/list/detail/basic/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid', (req, res) => {
  const query = {
    text: `SELECT a.code, a.content, a.time_stamp, a.end_time, a.job_name, a.axis FROM ( \
      ( \
        SELECT 	'P001' AS code, \
                ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, time_stamp, end_time, job_name, axis \
        FROM 	his_robot_torque_violationjob \
        WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() AND factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 \
        ORDER BY time_stamp DESC LIMIT 20 \
      ) UNION ALL \
      (
        SELECT  'P002' as code, \
                ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, update_time as time_stamp, update_time as end_time, job_name, axis \
        FROM 	his_violation_temperature \
        WHERE update_time BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() AND factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 \
        ORDER BY update_time DESC LIMIT 20 \
      )
    ) a \
    ORDER BY a.time_stamp DESC LIMIT 20;`,
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

predict.get(`/list/detail/premium/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid`, (req, res) => {
  const query = {
    text: `SELECT a.code, a.content, a.time_stamp, a.end_time, a.job_name, a.axis FROM ( \
      ( \
        SELECT 	'P001' AS code, \
                ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, time_stamp, end_time, job_name, axis \
        FROM 	his_robot_torque_violationjob \
        WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() AND factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 \
        ORDER BY time_stamp DESC LIMIT 20 \
      ) UNION ALL \
      ( \
        SELECT  'P002' as code, \
                ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, update_time as time_stamp, update_time as end_time, job_name, axis \
        FROM 	his_violation_temperature \
        WHERE update_time BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() AND factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 \
        ORDER BY update_time DESC LIMIT 20 \
      ) UNION ALL \
      ( \
        SELECT 	'P005' AS code, \
                ( SELECT  alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P005' ) AS content, time_stamp, end_time, job_name, axis \
        FROM his_violationjob_accum \
        WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() AND factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 \
        ORDER BY time_stamp DESC LIMIT 20 \
      )
    ) a \
    ORDER BY a.time_stamp DESC LIMIT 20;`,
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})
predict.get(`/chart/pcode/:pcode/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/jobname/:jobname/axis/:axis/starttime/:starttime/endtime/:endtime`, (req, res) => {
  let query = {
    text: "",
    values: [
      req.params.pcode,
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      req.params.jobname,
      req.params.axis,
      req.params.starttime,
      req.params.endtime
    ]
  }
  if(req.params.pcode === 'P001') {
    query.text = `SELECT ( SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = $1 ) AS content, \
    time_stamp, end_time, job_name, axis, motor_torque, step_no, violation_step, config_torquemax, config_torquemin, config_stepno \
    FROM his_robot_torque_violationjob WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND robot_id = $5 and job_name = $6 AND axis = $7 AND \
    time_stamp >= $8 AND end_time <= $9;`
  } 
  else if(req.params.pcode === 'P002') {
    query.text = `SELECT ( SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = $1 ) AS content, \
    time_stamp, motor_encoder[$7], ( SELECT check_value FROM his_violation_temperature WHERE update_time = $8 AND factory_id = $2 AND booth_id = $3 AND \
    zone_id = $4 AND robot_id = $5 AND job_name = $6 AND axis = $7 LIMIT 1) FROM his_robot_temperature WHERE factory_id = $2 AND booth_id = $3 AND \
    zone_id = $4 AND robot_id = $5 AND time_stamp between to_timestamp_imu($8) - interval '10 min' AND to_timestamp_imu($9) + interval '1 sec' \
    ORDER BY time_stamp asc;`
  }
  else if(req.params.pcode === 'P005') {
    query.text = `SELECT ( SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = $1 ) AS content, \ 
    time_stamp, end_time, ( SELECT type_name_${commonModule.task.getGlobalLanguage()} FROM def_accumtype_list c WHERE c.accum_type = a.accum_type ) AS type_name, \
    job_name, axis, violation_value, config_value, accum_type FROM his_violationjob_accum a \
    WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND robot_id = $5 AND job_name = $6 AND axis = $7 AND time_stamp >= $8 AND end_time <= $9;`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

predict.post('/chart', (req, res) => {
  let query;
  if (req.body.pcode === 'P001') {
    query = `SELECT (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, time_stamp, end_time, job_name, axis, \
        motor_torque, step_no, violation_step, config_torquemax, config_torquemin, config_stepno \
        FROM \
        his_robot_torque_violationjob \
        WHERE \
        time_stamp >= '${
  req.body.prevtime
}' AND end_time <= '${
  req.body.currtime
}' AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid}`;
  } else if (req.body.pcode === 'P003') {
    query = `SELECT time_stamp, end_time, job_name, axis, predict_type, motor_torque_min \
        FROM \
        his_robotpredict_point \
        WHERE \
        time_stamp >= '${
  req.body.prevtime
}' AND end_time <= '${
  req.body.currtime
}' AND job_name = '${
  commonModule.common.checkJobName(req.body.jobname)
}' AND axis = ${
  req.body.axis
} AND factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND predict_type in (1,2,3);`;
  } else if (req.body.pcode === 'P005') {
    query = `SELECT (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P005') AS content, time_stamp, end_time, \
        (SELECT type_name_${commonModule.task.getGlobalLanguage()} FROM def_accumtype_list c WHERE c.accum_type = a.accum_type) AS type_name, \
        job_name, axis, violation_value, config_value, accum_type \
        FROM \
        his_violationjob_accum a \
        WHERE \
        time_stamp >= '${
  req.body.prevtime
}' AND end_time <= '${
  req.body.currtime
}' AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND job_name = '${
  commonModule.common.checkJobName(req.body.jobname)
}' AND axis = ${
  req.body.axis}`;
  } else if (req.body.pcode === 'P002') {
    query = `SELECT (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, time_stamp, \
        motor_encoder[${req.body.axis}], (SELECT check_value FROM his_violation_temperature WHERE update_time = '${
  req.body.prevtime
}' AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND job_name = '${
  commonModule.common.checkJobName(req.body.jobname)
}' AND axis = ${
  req.body.axis}limit 1) \
        FROM \
        his_robot_temperature a \
        WHERE \
        time_stamp between to_timestamp_imu('${
  req.body.currtime
}') - interval '10 min' AND to_timestamp_imu('${
  req.body.currtime
}') + interval '1 sec' AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid} ORDER BY time_stamp asc;`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

predict.get('/trend', (req, res) => {
  // eslint-disable-next-line no-multi-str
  const query = "SELECT coalesce(code,'total') as code, time_stamp::date, sum(count) FROM \
    (\
    SELECT 'P002' AS code, update_time::date as time_stamp ,count(*) \
    FROM \
    his_violation_temperature \
    WHERE update_time BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() GROUP by update_time::date \
    UNION ALL \
    SELECT 'P005' AS code, time_stamp::date,count(*) \
    FROM \
    his_violationjob_accum \
    WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() GROUP by time_stamp::date \
    UNION ALL \
    SELECT 'P001' AS code, time_stamp::date,count(*) \
    FROM \
    his_robot_torque_violationjob \
    WHERE time_stamp BETWEEN now_timestamp() - interval '1 week' AND now_timestamp() GROUP by time_stamp::date \
    )\
    a GROUP by time_stamp::date, ROLLUP(code) ORDER BY a.time_stamp::date,code ASC;";
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 예지보전 해제
predict.post('/data/disable', (req, res) => {
  const query = `UPDATE cur_predict_data SET predict_occur[${
    req.body.predicttype
  }] = 0, time_stamp = now_timestamp() \
    WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 홈 화면 예지보전 컬럼 헤더
predict.post('/data/header/column', (req, res) => {
  const query = `SELECT alarm_comment_${commonModule.task.getGlobalLanguage()
  } FROM public.def_predictalarm_list \
    WHERE alarm_code = '${
  req.body.alarmcode}'`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
