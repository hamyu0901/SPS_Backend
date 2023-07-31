/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueRange = express.Router();
export { torqueRange };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueRange.use(bodyParser.urlencoded({ extended: true }));
torqueRange.use(bodyParser.json());

torqueRange.get('/', (req, res) => {
  res.status(200).send('Torque Range');
});

// 정보 테이블
torqueRange.post('/data/info', (req, res) => {
  const query = `SELECT robot_name AS robotname, atom_model_id AS atommodel, rc_model_id AS rcmodelid, model_name AS modelname, booth_name AS boothname, zone_name AS zonename \
    FROM def_robot_config \
    inner join def_model_config on def_robot_config.robot_model_id = def_model_config.model_id \
    inner join def_booth_config on def_robot_config.booth_id = def_booth_config.booth_id \
    AND def_robot_config.factory_id = def_booth_config.factory_id \
    inner join def_zone_config on def_robot_config.booth_id = def_zone_config.booth_id \
    AND def_robot_config.factory_id = def_zone_config.factory_id \
    AND def_robot_config.zone_id = def_zone_config.zone_id \
    WHERE def_robot_config.factory_id = '${
  req.body.factoryid
}' AND def_robot_config.booth_id = ${
  req.body.boothid
} AND def_robot_config.zone_id = ${
  req.body.zoneid
} AND def_robot_config.robot_id = ${
  req.body.robotid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// Job file - start / end / cycle
torqueRange.post('/data/table/jobfile', (req, res) => {
  const query = `with tmp as (SELECT time_stamp starttime, endtime FROM (\
        select *,(CASE robot_mode_run WHEN 1 THEN LEAD(time_stamp) OVER ( order by time_stamp asc ) END ) endtime \
    from (SELECT time_stamp, robot_mode_run, lag( robot_mode_run ) over ( order by time_stamp asc ) tt \
    FROM his_plc_data WHERE factory_id =${
  req.body.factoryid
}and booth_id = ${
  req.body.boothid
} and zone_id = ${
  req.body.zoneid
} and robot_id = ${
  req.body.robotid
} and time_stamp between to_timestamp_imu('${
  req.body.prevtime
} 00:00') - interval '1 hour' AND to_timestamp_imu('${
  req.body.prevtime
} 00:00') + interval '25 hour' ORDER BY time_stamp asc)tmp \
    WHERE (robot_mode_run = 1 and tt = 0) or (robot_mode_run = 0 and tt = 1 )    ) a WHERE endtime is not null) \
    SELECT distinct tmp.starttime, tmp.endtime,rt.job_name AS jobname, round( EXTRACT ( epoch FROM (tmp.endtime - tmp.starttime) ) :: NUMERIC ) AS cycletime \
    FROM tmp inner join his_robot_torque rt ON ( rt.time_stamp BETWEEN tmp.starttime and tmp.endtime ) \
    WHERE rt.factory_id = ${
  req.body.factoryid
} and rt.booth_id = ${
  req.body.boothid
} and rt.zone_id = ${
  req.body.zoneid
} and rt.robot_id = ${
  req.body.robotid
} and rt.time_stamp between to_timestamp_imu('${
  req.body.prevtime
} 00:00') - interval '1 hour' AND to_timestamp_imu('${
  req.body.prevtime
} 00:00') + interval '25 hour' \
    and job_name = '${
  req.body.jobname
}' order by starttime desc;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// torque min max in job file
torqueRange.post('/data/table/torque', (req, res) => {
  const query = `SELECT step_no as stepno, min(t.motor_torque[1]) AS min1, max(t.motor_torque[1]) AS max1, \
    min(t.motor_torque[2]) AS min2, max(t.motor_torque[2]) AS max2, \
    min(t.motor_torque[3]) AS min3, max(t.motor_torque[3]) AS max3, \
    min(t.motor_torque[4]) AS min4, max(t.motor_torque[4]) AS max4, \
    min(t.motor_torque[5]) AS min5, max(t.motor_torque[5]) AS max5, \
    min(t.motor_torque[6]) AS min6, max(t.motor_torque[6]) AS max6, \
    min(t.motor_torque[7]) AS min7, max(t.motor_torque[7]) AS max7 \
    FROM his_robot_torque  AS t \
    WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id =${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN to_timestamp_imu('${
  req.body.prevtime
} 00','YYYY-MM-DD HH24') AND (to_timestamp_imu('${
  req.body.currtime
} 00','YYYY-MM-DD HH24')+interval'1 days') AND (motor_torque[1]=0 AND motor_torque[2] = 0 \
    AND motor_torque[3] = 0 AND motor_torque[4] = 0 AND motor_torque[5] = 0 AND motor_torque[6]= 0 \
    AND motor_torque[7] = 0) != TRUE AND job_name ='${
  req.body.jobname
}' GROUP BY step_no ORDER BY step_no ASC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 경고값 초기화
torqueRange.post('/data/table/init', (req, res) => {
  const time = new Date();
  const today = `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()}`;
  const query = `WITH t AS (SELECT time_stamp - (SELECT robotmovingtime * '1 ms'::interval) AS min, time_stamp AS max \
    FROM his_product_record WHERE factory_id = 0 AND booth_id = 0 AND zone_id = 0 AND robot_id = 0 AND time_stamp between '${
  today
} 00:00:00' AND '${
  today
} 23:59:59' ORDER BY time_stamp asc), \
    tt AS (WITH subt AS (SELECT time_stamp, job_name, \
    CASE WHEN (job_name = LAG(job_name) OVER(ORDER BY time_stamp asc)) THEN 0 ELSE 1 END AS flag2, \
    CASE WHEN (job_name = LEAD(job_name) OVER(ORDER BY time_stamp asc)) THEN 0 ELSE 1 END AS flag1 \
    FROM his_robot_torque WHERE factory_id = 0 AND booth_id = 0 AND zone_id = 0 AND robot_id = 0 AND time_stamp BETWEEN '${
  today
} 00:00:00' AND '${
  today
} 23:59:59' ORDER BY time_stamp asc) \
    SELECT time_stamp, job_name FROM subt WHERE (flag2 = 1 or flag1 = 1) aND job_name = '') \
    SELECT distinct tt.job_name, t.*, round(extract( epoch FROM t.max- t.min)) AS gap \
    FROM t inner join tt on (tt.time_stamp between t.min and t.max ) ORDER BY min desc;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 토크값 가져오기(업데이트)
torqueRange.post('/data/table/update', (req, res) => {
  const query = `SELECT step_no, \
    min(t.motor_torque[${
  req.body.axis
}]) AS min${
  req.body.axis
}, \
    max(t.motor_torque[${
  req.body.axis
}]) AS max${
  req.body.axis
} FROM his_robot_torque AS t \
    WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN to_timestamp_imu('${
  req.body.prevtime
} 00','YYYY-MM-DD HH24') AND (to_timestamp_imu('${
  req.body.currtime
} 00','YYYY-MM-DD HH24')+interval'1 days') AND (\
    motor_torque[${
  req.body.axis
}] = 0\
    ) != TRUE AND job_name ='${
  req.body.jobname
}' GROUP BY step_no ORDER by step_no asc`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 경고값 저장
torqueRange.post('/data/table/warning/to', (req, res) => {
  const query = `INSERT INTO his_torquelimit_config (factory_id, booth_id, zone_id, robot_id, axis, modify_timestamp, \
    job_name, step_no, min_val, max_val) \
    values (${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, ${
  req.body.axis
}, now_timestamp(), '${
  commonModule.common.checkJobName(req.body.jobname)
}', ${
  req.body.stepnoarr
}, ${
  req.body.minvalarr
}, ${
  req.body.maxvalarr
})`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 범위 경고 값 저장
torqueRange.post('/data/set/warning', (req, res) => {
  const query = {
    text: `INSERT INTO his_torquelimit_config(factory_id, booth_id, zone_id, robot_id, axis, modify_timestamp, job_name, step_no, min_val, max_val) \
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);`,
    vaules: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      req.body.axis,
      new Date(),
      req.body.jobname,
      req.body.stepno,
      req.body.min,
      req.body.max
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 경고값 가져오기
torqueRange.post('/data/table/warning/from', (req, res) => {
  const query = `SELECT step_no AS stepno, min_val AS min, max_val AS max FROM def_torquelimit_config WHERE factory_id = ${
    req.body.factoryid
  } AND booth_id = ${
    req.body.boothid
  } AND zone_id = ${
    req.body.zoneid
  } AND robot_id = ${
    req.body.robotid
  } AND axis = ${
    req.body.axis
  } AND job_name = '${
    commonModule.common.checkJobName(req.body.jobname)
  }' ORDER BY update_timestamp DESC limit 1`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 경고값이 있는 축만 가져오기
torqueRange.post('/data/table/warning/axis/from', (req, res) => {
  const query = `SELECT axis FROM def_torquelimit_config WHERE factory_id = ${
    req.body.factoryid
  } AND booth_id = ${
    req.body.boothid
  } AND zone_id = ${
    req.body.zoneid
  } AND robot_id = ${
    req.body.robotid
  } AND job_name = '${
    commonModule.common.checkJobName(req.body.jobname)
  }'`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 토크 범위 1일 샘플링
torqueRange.post('/data/trend', (req, res) => {
  const query = {
    text: `
    select
      step_no as stepno,
      min(t.motor_torque[$1]) as min,
      max(t.motor_torque[$1]) as max
    from
      his_robot_torque as t
    where
      factory_id = $2
      and booth_id = $3
      and zone_id = $4
      and robot_id = $5
      and time_stamp between to_timestamp_imu('${req.body.prevtime} 00',
      'YYYY-MM-DD HH24') - interval '1 hour' and (to_timestamp_imu('${req.body.prevtime} 00',
      'YYYY-MM-DD HH24') + interval '25 hour')
      and (motor_torque[1]= 0
      and motor_torque[2] = 0
      and motor_torque[3] = 0
      and motor_torque[4] = 0
      and motor_torque[5] = 0
      and motor_torque[6]= 0
      and motor_torque[7] = 0) != true
      and job_name = $6
    group by
      step_no
    order by
      step_no asc
    `,
    values: [
      req.body.axis,
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      commonModule.common.checkJobName(req.body.jobname),
    ],
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// get torque range data
torqueRange.get(`/data/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/date/:date`, (req, res) => {
  const query = {
    text: `SELECT step_no AS stepno, min_val AS min, max_val AS max 
    FROM his_torque_stepdata 
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND axis = $5 AND job_name = $6 AND time_stamp = $7`,
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

// get week torque range data
torqueRange.get(`/data/week/trend/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/axis/:axis/jobname/:jobname/date/:date`, (req, response) => {
  const query = {
    text: "SELECT step_no AS stepno, min_val AS min, max_val AS max \
    FROM his_torque_stepdata \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND axis = $5 AND job_name = $6 AND time_stamp BETWEEN to_timestamp_imu($7) - interval '1 week' AND to_timestamp_imu($7) ",
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
  commonModule.mainDB.getInstance().query(query, (err, res) => {
    if (err) {
      commonModule.logMsg.error(err.message);
      response.status(404).send('error');
    }
    else if (res.rows.length == 0) {
      response.status(204).send('no data');
    }
    else {
      let torqueRangeData = [];
      torqueRangeData.push(res.rows[0]);
      for(let i = 1; i < res.rows.length-1; i++) {
        for(let j = 0; j < res.rows[i].stepno.length; j++) {
          if(torqueRangeData[0].min[j] > res.rows[i].min[j]) {
            torqueRangeData[0].min[j] = res.rows[i].min[j];
          }
          if(torqueRangeData[0].max[j] < res.rows[i].max[j]) {
            torqueRangeData[0].max[j] = res.rows[i].max[j];
          }
        }
      }
      response.status(200).json(torqueRangeData);
    }
  })
});

function getHistoryRangeDatas(rangeRes) {
  return new Promise((resolve, reject) => {
    try {
      let historyRangeDatas = [];
      let checkFlag = false;
      rangeRes.forEach(rangeData => {
        if(historyRangeDatas.length === 0) {
          let historyRangeData = {};
          historyRangeData['factory_id'] = rangeData.factory_id;
          historyRangeData['booth_id'] = rangeData.booth_id;
          historyRangeData['booth_name'] = rangeData.booth_name;
          historyRangeData['zone_id'] = rangeData.zone_id;
          historyRangeData['zone_name'] = rangeData.zone_name;
          historyRangeData['robot_id'] = rangeData.robot_id;
          historyRangeData['robot_name'] = rangeData.robot_name;
          historyRangeData['axis'] = rangeData.axis;
          historyRangeData['job_name'] = rangeData.job_name;
          historyRangeData['maxStepNo'] = rangeData.stepno[rangeData.stepno.length-1];
          historyRangeData['stepno'] =  Array.from({length: historyRangeData.maxStepNo}, (v, k) =>{ return k+1});
          historyRangeData['max'] = Array.from({length: historyRangeData.stepno.length}, () => null);
          historyRangeData['min'] = Array.from({length: historyRangeData.stepno.length}, () => null);
          historyRangeData['maxwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
          historyRangeData['minwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
          historyRangeDatas.push(historyRangeData);
        }
        else {
          historyRangeDatas.forEach(historyRangeData => {
            if(historyRangeData.booth_id === rangeData.booth_id && historyRangeData.zone_id === rangeData.zone_id && historyRangeData.robot_id === rangeData.robot_id && 
              historyRangeData.axis === rangeData.axis && historyRangeData.job_name === rangeData.job_name
            ) {
              checkFlag = true;
              if(historyRangeData.maxStepNo < rangeData.stepno[rangeData.stepno.length-1]) {
                historyRangeData.maxStepNo = rangeData.stepno[rangeData.stepno.length-1];
                historyRangeData['stepno'] =  Array.from({length: historyRangeData.maxStepNo}, (v, k) =>{ return k+1});
                historyRangeData['max'] = Array.from({length: historyRangeData.stepno.length}, () => null);
                historyRangeData['min'] = Array.from({length: historyRangeData.stepno.length}, () => null);
                historyRangeData['maxwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
                historyRangeData['minwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
              }
            }
          });
          if(checkFlag === true) {
            checkFlag = false;
          }
          else {
            let historyRangeData = {};
            historyRangeData['factory_id'] = rangeData.factory_id;
            historyRangeData['booth_id'] = rangeData.booth_id;
            historyRangeData['booth_name'] = rangeData.booth_name;
            historyRangeData['zone_id'] = rangeData.zone_id;
            historyRangeData['zone_name'] = rangeData.zone_name;
            historyRangeData['robot_id'] = rangeData.robot_id;
            historyRangeData['robot_name'] = rangeData.robot_name;
            historyRangeData['axis'] = rangeData.axis;
            historyRangeData['job_name'] = rangeData.job_name;
            historyRangeData['maxStepNo'] = rangeData.stepno[rangeData.stepno.length-1];
            historyRangeData['stepno'] =  Array.from({length: historyRangeData.maxStepNo}, (v, k) =>{ return k+1});
            historyRangeData['max'] = Array.from({length: historyRangeData.stepno.length}, () => null);
            historyRangeData['min'] = Array.from({length: historyRangeData.stepno.length}, () => null);
            historyRangeData['maxwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
            historyRangeData['minwarning'] = Array.from({length: historyRangeData.stepno.length}, () => null);
            historyRangeDatas.push(historyRangeData);
          }
        }
      });
      resolve(historyRangeDatas);
    } catch(error) {
      reject(error);
    }
  })
}

function getMaxMinDatas(historyRangeDatas, rangeDatas) {
  return new Promise((resolve, reject) => {
    try {
      historyRangeDatas.forEach(historyRangeData => {
        rangeDatas.forEach(rangeData => {
          if(historyRangeData.booth_id === rangeData.booth_id && historyRangeData.zone_id === rangeData.zone_id && historyRangeData.robot_id === rangeData.robot_id && 
            historyRangeData.axis === rangeData.axis && historyRangeData.job_name === rangeData.job_name
          ) {
              rangeData.stepno.forEach((stepno, index) => {
                if(historyRangeData.max[stepno-1] === null) {
                  historyRangeData.max[stepno-1] = String(rangeData.max[index]);
                } else if(Number(historyRangeData.max[stepno-1]) < Number(rangeData.max[index])) {
                  historyRangeData.max[stepno-1] = String(rangeData.max[index]);
                }
                if(historyRangeData.min[stepno-1] === null) {
                  historyRangeData.min[stepno-1] = String(rangeData.min[index]);
                } else if(Number(historyRangeData.min[stepno-1]) > Number(rangeData.min[index])) {
                  historyRangeData.min[stepno-1] = String(rangeData.min[index]);
                }
              })
          }
        })
      })
      resolve(historyRangeDatas);
    } 
    catch(error) {
      reject(error);
    }
  })
}

function getWarningDatas(historyRangeDatas, warningDatas) {
  return new Promise((resolve, reject) => {
    try {
      historyRangeDatas.forEach(historyRangeData => {
        warningDatas.forEach(warningData => {
          if(historyRangeData.booth_id === warningData.booth_id && historyRangeData.zone_id === warningData.zone_id && historyRangeData.robot_id === warningData.robot_id && 
            historyRangeData.axis === warningData.axis && historyRangeData.job_name === warningData.job_name
          ) {
            warningData.stepno.forEach((stepno, index) => {
              historyRangeData.maxwarning[stepno-1] = String(warningData.maxwarning[index]);
              historyRangeData.minwarning[stepno-1] = String(warningData.minwarning[index]);
            })       
          }
        })
      })
      resolve(historyRangeDatas);
    }
    catch(error) {
      reject(error);
    }
  })
}

// 범위 경고 값 조회
torqueRange.get(`/data/history/range/startdate/:startdate/enddate/:enddate`, (req, response) => {
  const rangeQuery = {
    text: "SELECT factory_id, booth_id, (SELECT booth_name FROM def_booth_config WHERE booth_id = histable.booth_id), \
    zone_id, (SELECT zone_name FROM def_zone_config WHERE zone_id = histable.zone_id), \
    robot_id, (SELECT robot_name FROM def_robot_config WHERE robot_id = histable.robot_id), \
    axis, job_name, step_no AS stepno, min_val AS min, max_val AS max FROM his_torque_stepdata AS histable \
    WHERE time_stamp BETWEEN $1 AND $2 ORDER BY booth_id, zone_id, robot_id, job_name, axis;",
    values: [
      `${String(req.params.startdate)} 00:00:00`,
      `${String(req.params.enddate)} 23:59:59`
    ]
  }

  const warningQuery = {
    text: "SELECT factory_id, booth_id, zone_id, robot_id, axis, job_name, step_no AS stepno, min_val AS minwarning, max_val AS maxwarning \
    FROM def_torquelimit_config WHERE update_timestamp IN (SELECT MAX(update_timestamp) FROM def_torquelimit_config GROUP BY factory_id, booth_id, zone_id, robot_id, axis, job_name);"
  }

  commonModule.mainDB.getInstance().query(rangeQuery, (rangeErr, rangeRes) => {
    if (rangeErr) {
      commonModule.logMsg.error(rangeErr.message);
      response.status(404).send('error');
    }
    else if (rangeRes.rows.length == 0) {
      response.status(204).send('no data');
    }
    else {
      commonModule.mainDB.getInstance().query(warningQuery, (warningErr, warningRes) => {
        if (warningErr) {
          commonModule.logMsg.error(warningErr.message);
          response.status(404).send('error');
        }
        else if (warningRes.rows.length == 0) {
          response.status(204).send('no data');
        }
        else {
          getHistoryRangeDatas(rangeRes.rows)
          .then((tempHistoryRangeDatas) => getMaxMinDatas(tempHistoryRangeDatas, rangeRes.rows))
          .then((tempHistoryRangeDatas) => getWarningDatas(tempHistoryRangeDatas, warningRes.rows))
          .then((tempHistoryRangeDatas) => {
            response.status(200).json(tempHistoryRangeDatas);
          });
        }
      })
    }
  })
})



let preProcess = (factoryid, boothid, zoneid, robotid, date, dayIdx, jobname, sort)=> new Promise((resolve)=> {
  let arr = [];
  let _preDate = `${date} 00`;
  let _lastDate = `${date} 23`;
  for (let idx = dayIdx; idx > -1; --idx) {
    const query = {
      text: `
    select
      time_stamp,
      step_no
    from
      his_robot_torque as t
    where
      factory_id = $1
      and booth_id = $2
      and zone_id = $3
      and robot_id = $4
      and time_stamp between to_timestamp_imu($5,
      'YYYY-MM-DD HH24') - interval '${idx} day' and to_timestamp_imu($6,
      'YYYY-MM-DD HH24')
      and ( motor_torque[1] = 0
      and motor_torque[2] = 0
      and motor_torque[3] = 0
      and motor_torque[4] = 0
      and motor_torque[5] = 0
      and motor_torque[6] = 0
      and motor_torque[7] = 0 ) != true
      and job_name = $7
    order by
      step_no ${sort}
    limit 1;
    `,
      values: [
        factoryid,
        boothid,
        zoneid,
        robotid,
        _preDate,
        _lastDate,
        jobname,
      ],
    }
    commonModule.mainDB.getInstance().query(query, (err, res) => {
      if (err) {
        
      }
      else if (res.rows.length !== 0) {
        arr.push({
          timestamp: res.rows[0].time_stamp,
          stepno: res.rows[0].step_no,
        });
        if (idx === 0) {
          resolve(arr);
        }
      }
    });
  }  
});

// 토크 범위 1주일 샘플링
// 7일치 각 일 마다 step no 기준 최초 step no 검출
// 유저 선택 날짜의 최초 step no 가 7일 중에 다른 날 있을 경우 유저 선택 날짜 기준 가장 가까운 일자 검출
// 7일치 각 일 마다 step np 기준 마지막 step no 검출
// 유저 선택 날짜의 마지막 step no 가 7일 중에 다른 날 있을 경우 유저 선택 날짜 기준 가장 가까운 일자 검출
// 최초 일자와 마지막 일자 불일 치 시 비교하여 가장 최근 변경 된 _prevTime 도출
// _prevTime and 유저 지정 날짜 샘플링 리턴
torqueRange.get('/data/trend', (req, res) => {
  let _isPass = true;
  let _preDate = null;
  let _lastDate = null;
  preProcess(
    req.query.factoryid, 
    req.query.boothid, 
    req.query.zoneid, 
    req.query.robotid, 
    req.query.date, 
    7, 
    commonModule.common.checkJobName(req.query.jobname),
    'asc'
    ).then((data) => {
      var tempArr = [];
      for (var i = 0; i < data.length; i++) {
        if (tempArr.length == 0) {
          tempArr.push(data[i].stepno);
        } else {
          var duplicatesFlag = true;
          for (var j = 0; j < tempArr.length; j++) {
            if (tempArr[j] == data[i].stepno) {
              duplicatesFlag = false;
              break;
            }
          }
          if (duplicatesFlag) {
            tempArr.push(data[i].stepno);
          }
        }
      }
      if (tempArr.length !== 1) {
        let tempStep = [];
        for (let idx = 0; idx < data.length; ++idx) {
          tempStep[idx] = data[idx].stepno;
        }
        _preDate = String((data[tempStep.indexOf(data[7].stepno)].timestamp).toISOString().slice(0,10));
        _isPass = false;
      } else {
        _preDate = String((data[0].timestamp).toISOString().slice(0,10));
      }
      return preProcess(
        req.query.factoryid, 
        req.query.boothid, 
        req.query.zoneid, 
        req.query.robotid, 
        req.query.date, 
        7, 
        commonModule.common.checkJobName(req.query.jobname),
        'desc'
        );
    }).then((data) => {
      var tempArr = [];
      for (var i = 0; i < data.length; i++) {
        if (tempArr.length == 0) {
          tempArr.push(data[i].stepno);
        } else {
          var duplicatesFlag = true;
          for (var j = 0; j < tempArr.length; j++) {
            if (tempArr[j] == data[i].stepno) {
              duplicatesFlag = false;
              break;
            }
          }
          if (duplicatesFlag) {
            tempArr.push(data[i].stepno);
          }
        }
      }
      if (tempArr.length !== 1) {
        let tempStep = [];
        for (let idx = 0; idx < data.length; ++idx) {
          tempStep[idx] = data[idx].stepno;
        }
        _lastDate = String((data[tempStep.indexOf(data[7].stepno)].timestamp).toISOString().slice(0,10));
        _isPass = false;
      }
      else {
        _lastDate = String((data[7].timestamp).toISOString().slice(0,10));
      }
    }).then(() => {
      if (Number(String(_preDate).replace(/-/g,"")) >= Number(String(_lastDate).replace(/-/g,""))) {
        _lastDate = req.query.date;
      } 
    }).then(() => {
        const query = {
          text: `
          SELECT 
            step_no as stepno, 
            min(t.motor_torque[$1]) as min,
            max(t.motor_torque[$1]) as max
          FROM
            his_robot_torque as t
          WHERE
            factory_id = $2 AND
            booth_id = $3 AND
            zone_id = $4 AND
            robot_id = $5 AND
            time_stamp BETWEEN 
            to_timestamp_imu($6, 'YYYY-MM-DD HH24') AND to_timestamp_imu($7, 'YYYY-MM-DD HH24') AND
            job_name = $8 
            GROUP BY step_no ORDER BY step_no ASC;
        `,
          values: [
            req.query.axis,
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
            `${_preDate} 00`,
            `${_lastDate} 23`,
            commonModule.common.checkJobName(req.query.jobname),
          ],
        };
        commonModule.mainDB.execute(query, req.session.spsid, res);
    });
});

torqueRange.get('/day/job/count', (req, res) => {
  if (!commonModule.sess.requestAuth(req.session.spsid)) {
    res.status(404).send('not login');
  }
  commonModule.mapper.his_robot_torque.findOne(
    {
        attributes: [[commonModule.mapper.seq.fn('min', commonModule.mapper.seq.col('step_no')), 'min']],
        where: { 
            factory_id: req.query.factoryid,
            booth_id: req.query.boothid,
            zone_id: req.query.zoneid,
            robot_id: req.query.robotid,
            job_name: req.query.jobname,
            time_stamp: {
                [commonModule.mapper.seq.Op.between]: [`${req.query.date} 00:00:00`, `${req.query.date} 23:59:59`],
            }
        },
  })
  .then((result) => {
    commonModule.mapper.his_robot_torque.findOne(
      {
          attributes: [[commonModule.mapper.seq.fn('count', commonModule.mapper.seq.col('job_name')), 'count']],
          where: { 
              factory_id: req.query.factoryid,
              booth_id: req.query.boothid,
              zone_id: req.query.zoneid,
              robot_id: req.query.robotid,
              job_name: req.query.jobname,
              step_no: result.dataValues.min,
              time_stamp: {
                  [commonModule.mapper.seq.Op.between]: [`${req.query.date} 00:00:00`, `${req.query.date} 23:59:59`],
              }
          },
    })
    .then((result) => {
      res.status(200).send(result);
    });
  });
});

torqueRange.get('/several/job/count', (req, res) => {
  let _isPass = true;
  let _preDate = null;
  let _lastDate = null;
  preProcess(
    req.query.factoryid, 
    req.query.boothid, 
    req.query.zoneid, 
    req.query.robotid, 
    req.query.date, 
    7, 
    commonModule.common.checkJobName(req.query.jobname),
    'asc'
    ).then((data) => {
      var tempArr = [];
      for (var i = 0; i < data.length; i++) {
        if (tempArr.length == 0) {
          tempArr.push(data[i].stepno);
        } else {
          var duplicatesFlag = true;
          for (var j = 0; j < tempArr.length; j++) {
            if (tempArr[j] == data[i].stepno) {
              duplicatesFlag = false;
              break;
            }
          }
          if (duplicatesFlag) {
            tempArr.push(data[i].stepno);
          }
        }
      }
      if (tempArr.length !== 1) {
        let tempStep = [];
        for (let idx = 0; idx < data.length; ++idx) {
          tempStep[idx] = data[idx].stepno;
        }
        _preDate = String((data[tempStep.indexOf(data[7].stepno)].timestamp).toISOString().slice(0,10));
        _isPass = false;
      } else {
        _preDate = String((data[0].timestamp).toISOString().slice(0,10));
      }
      return preProcess(
        req.query.factoryid, 
        req.query.boothid, 
        req.query.zoneid, 
        req.query.robotid, 
        req.query.date, 
        7, 
        commonModule.common.checkJobName(req.query.jobname),
        'desc'
        );
    }).then((data) => {
      var tempArr = [];
      for (var i = 0; i < data.length; i++) {
        if (tempArr.length == 0) {
          tempArr.push(data[i].stepno);
        } else {
          var duplicatesFlag = true;
          for (var j = 0; j < tempArr.length; j++) {
            if (tempArr[j] == data[i].stepno) {
              duplicatesFlag = false;
              break;
            }
          }
          if (duplicatesFlag) {
            tempArr.push(data[i].stepno);
          }
        }
      }
      if (tempArr.length !== 1) {
        let tempStep = [];
        for (let idx = 0; idx < data.length; ++idx) {
          tempStep[idx] = data[idx].stepno;
        }
        _lastDate = String((data[tempStep.indexOf(data[7].stepno)].timestamp).toISOString().slice(0,10));
        _isPass = false;
      }
      else {
        _lastDate = String((data[7].timestamp).toISOString().slice(0,10));
      }
    }).then(() => {
      if (Number(String(_preDate).replace(/-/g,"")) >= Number(String(_lastDate).replace(/-/g,""))) {
        _lastDate = req.query.date;
      } 
    }).then(() => {
      commonModule.mapper.his_robot_torque.findOne(
        {
            attributes: [[commonModule.mapper.seq.fn('min', commonModule.mapper.seq.col('step_no')), 'min']],
            where: { 
                factory_id: req.query.factoryid,
                booth_id: req.query.boothid,
                zone_id: req.query.zoneid,
                robot_id: req.query.robotid,
                job_name: req.query.jobname,
                time_stamp: {
                    [commonModule.mapper.seq.Op.between]: [`${_preDate} 00:00:00`, `${_lastDate} 23:59:59`],
                }
            },
      })
      .then((result) => {
        commonModule.mapper.his_robot_torque.findOne(
          {
              attributes: [[commonModule.mapper.seq.fn('count', commonModule.mapper.seq.col('job_name')), 'count']],
              where: { 
                  factory_id: req.query.factoryid,
                  booth_id: req.query.boothid,
                  zone_id: req.query.zoneid,
                  robot_id: req.query.robotid,
                  job_name: req.query.jobname,
                  step_no: result.dataValues.min,
                  time_stamp: {
                      [commonModule.mapper.seq.Op.between]: [`${_preDate} 00:00:00`, `${_lastDate} 23:59:59`],
                  }
              },
        })
        .then((result) => {
          res.status(200).send(result);
        });
      });
    });
});