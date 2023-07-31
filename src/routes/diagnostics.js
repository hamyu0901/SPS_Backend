/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');
const commonModule = require('./app');
const diagnostics = express.Router();
export { diagnostics };
const bodyParser = require('body-parser');

const torqueData = require('./diagnostics/torquedata');
const alarmStatistics = require('./diagnostics/alarmstatistics');
const torqueRange = require('./diagnostics/torquerange');
const torqueSimilarity = require('./diagnostics/torquesimilarity');
const torqueLoadFactor = require('./diagnostics/torqueloadfactor');
const atomizerData = require('./diagnostics/atomizerdata');
const torqueTemperature = require('./diagnostics/torquetemperature');
const torqueTrend = require('./diagnostics/torquetrend');
const report = require('./diagnostics/report');
const dataReport = require('./diagnostics/datareport');
const predict = require('./diagnostics/predict');
const statistics = require('./diagnostics/statistics');
diagnostics.use('/torquedata', torqueData.torqueData);
diagnostics.use('/atomizerdata', atomizerData.atomizerData);
diagnostics.use('/alarmstatistics', alarmStatistics.alarmStatistics);
diagnostics.use('/statistics', statistics.statistics);
diagnostics.use('/torquerange', torqueRange.torqueRange);
diagnostics.use('/torquesimilarity', torqueSimilarity.torqueSimilarity);
diagnostics.use('/torqueloadfactor', torqueLoadFactor.torqueLoadFactor);
diagnostics.use('/torquetemperature', torqueTemperature.torqueTemperature);
diagnostics.use('/torquetrend', torqueTrend.torqueTrend);
diagnostics.use('/report', report.report);
diagnostics.use('/predict', predict.predict);

diagnostics.use('/datareport', dataReport.dataReport)
diagnostics.use(bodyParser.urlencoded({ extended: true }));
diagnostics.use(bodyParser.json());

const getDiagnosticsItems = (query) => {
  return new Promise((resolve, reject) => {
      try {
          commonModule.mainDB.dbClient.query(query, (err, res) => {
            res === undefined ? reject(new Error(err)) : resolve(res.rows);
          })
      }catch(error) {
          reject(new Error(error))
      }

  })
}

diagnostics.get('/', (req, res) => {
  res.status(200).send('Diagnostics');
});

// Job Update
diagnostics.post('/job', (req, res) => {
  const query = {
    text: `
    WITH T AS (
      SELECT
       job_name, COUNT (job_name) AS COUNT, MAX ( step_no ) AS max_step
      FROM
       his_robot_torque
      WHERE
       factory_id = $1 AND
       booth_id = $2 AND
       zone_id = $3 AND
       robot_id = $4 AND time_stamp BETWEEN to_timestamp_imu($5) AND to_timestamp_imu($6) AND (
        motor_torque [ 1 ] = 0 AND
        motor_torque [ 2 ] = 0 AND
        motor_torque [ 3 ] = 0 AND
        motor_torque [ 4 ] = 0 AND
        motor_torque [ 5 ] = 0 AND
        motor_torque [ 6 ] = 0 AND
        motor_torque [ 7 ] = 0 ) != TRUE GROUP BY job_name ORDER BY COUNT DESC)
      INSERT INTO
        cur_job_list(factory_id,booth_id,zone_id,robot_id,update_timestamp,job_list)
        VALUES($1,$2,$3,$4, now_timestamp(),(SELECT array_agg(job_name) FROM T WHERE max_step > 10))
        ON CONFLICT (factory_id,booth_id,zone_id,robot_id) DO UPDATE SET update_timestamp = excluded.update_timestamp, job_list = excluded.job_list;`,
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      `${String(req.body.date)} 00:00:00`,
      `${String(req.body.date)} 23:59:59`,
    ],
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

//get job list
diagnostics.get(`/joblist/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/date/:date`, (req, res) => {
  const start_time = `${String(req.params.date)} 00:00:00`;
  const end_time = `${String(req.params.date)} 23:59:59`;
  const query = {
    text: "SELECT DISTINCT job_name FROM his_torqueaccum_data \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 가장 많이 돈 job 조회
diagnostics.get('/joblist/mostjob/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/startdate/:startdate/enddate/:enddate', async (req, res) => {
  const start_time = `${String(req.params.startdate)} 00:00:00`;
  const end_time = `${String(req.params.enddate)} 23:59:59`;
  const query = {
    text:
    "SELECT job_name \
    FROM (SELECT job_name, count(*) as mycount \
    FROM his_torqueaccum_data \
    WHERE job_name not like '%MASTER%' \
 	  AND job_name not like '%MAINT%' \
 	  AND job_name not like '%PURGE%' \
 	  AND job_name not like '%WORK-ID%' \
 	  AND job_name not like '%HOME%' \
	  AND job_name not like '%VISION%' \
	  AND job_name not like '%DATA%' \
 	  AND job_name not like '%PASS%' \
 	  AND job_name not like '%MAKE-UF%' \
 	  AND job_name not like '%INIT%' \
 	  AND job_name not like '%RESET%' \
    AND factory_id = $1 \
    AND booth_id = $2 \
 	  AND zone_id = $3 \
 	  AND robot_id = $4 \
 	  and time_stamp BETWEEN $5 and $6 \
 	  GROUP BY job_name, robot_id \
    )A WHERE mycount = (SELECT MAX(mycount) FROM (\
      SELECT job_name, count(*) as mycount \
      FROM his_torqueaccum_data \
      WHERE job_name not like '%MASTER%' \
 	    AND job_name not like '%MAINT%' \
 	    AND job_name not like '%PURGE%' \
 	    AND job_name not like '%WORK-ID%' \
 	    AND job_name not like '%HOME%' \
	    AND job_name not like '%VISION%' \
	    AND job_name not like '%DATA%' \
 	    AND job_name not like '%PASS%' \
 	    AND job_name not like '%MAKE-UF%' \
 	    AND job_name not like '%INIT%' \
 	    AND job_name not like '%RESET%' \
      AND factory_id = $1 \
      AND booth_id = $2 \
 	    AND zone_id = $3 \
 	    AND robot_id = $4 \
 	    and time_stamp BETWEEN $5 and $6 \
 	    GROUP BY job_name, robot_id )T);",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time
    ]
  }
  let resData = await commonModule.mainDB.execute(query);
    let tempJopName = '';
    if(resData !== undefined){
      for(let i = 0; i < resData.length; i++) {
        let tempdata = "'" + resData[i] + "'"
        if(i == resData.length - 1) {
          tempJopName += tempdata;
        }
        else {
          tempJopName += (tempdata + ',');
        }
      }
    }
    else{
      tempJopName = "''"
    }
    const queryString = {
      text: `SELECT robot_id, job_name, axissum \
      FROM (SELECT robot_id, job_name, sum(axissum) AS axissum \
      FROM (SELECT robot_id, job_name,(sum[1]+sum[2]+sum[3]+sum[4]+sum[5]+sum[6]+sum[7]) AS axissum \
      FROM his_torqueaccum_data WHERE time_stamp BETWEEN $1 AND $2 AND robot_id = $3 ORDER BY robot_id
      )A \
      WHERE \
      UPPER(job_name) NOT LIKE '%MASTER%' \
      AND UPPER(job_name) NOT LIKE '%MAINTE%' \
      AND UPPER(job_name) not like '%WORK-ID%' \
      AND UPPER(job_name) not like '%HOME%' \
      AND UPPER(job_name) not like '%VISION%' \
      AND UPPER(job_name) not like '%DATA%' \
      AND UPPER(job_name) not like '%PASS%' \
      AND UPPER(job_name) not like '%MAKE-UF%' \
      AND UPPER(job_name) not like '%INIT%' \
      AND UPPER(job_name) not like '%RESET%' \
      GROUP BY robot_id, job_name)T \
      WHERE job_name IN (${tempJopName});`,
      values: [
        start_time,
        end_time,
        req.params.robotid,
      ]
    }
     commonModule.mainDB.execute(queryString, req.session.spsid, res);
});

//renew 가장 많이 돈 job 조회
diagnostics.post('/renew/joblist/mostjob',(req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    // text: `SELECT job_name \
    //   FROM (SELECT job_name, count(*) as mycount FROM main.his_robot_data \
    //   WHERE robot_id = $1 and start_time between $2 and $3 \
 	  //   GROUP BY job_name )A WHERE mycount = (SELECT MAX(mycount) FROM ( \
    //   SELECT job_name, count(*) as mycount FROM main.his_robot_data \
    //   WHERE robot_id = $1 and start_time between $2 and $3 \
 	  //   GROUP BY job_name )T)`,
     text: `SELECT job_name, count(*) FROM  main.his_robot_data  WHERE  robot_id = $1 and start_time between $2 and  $3  \
     GROUP BY job_name order by count desc`,
      values: [
        req.body.robotid,
        start_time,
        end_time
      ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 로봇별 설정 잡 조회
diagnostics.get(`/joblist/settingjob/robotid/:robotid/startdate/:startdate/enddate/:enddate`, (req, res) => {
  const start_time = `${String(req.params.startdate)} 00:00:00`;
  const end_time = `${String(req.params.enddate)} 23:59:59`;
  const query = {
    text: "SELECT robot_name, robot_id, job_name FROM \
    (SELECT predictaccum_config.robot_id, \
    (SELECT robot_name FROM def_robot_config WHERE robot_id = predictaccum_config.robot_id), predictaccum_config.job_name, torqueaccum_data.time_stamp \
    FROM def_predictaccum_config predictaccum_config \
    INNER JOIN his_torqueaccum_data torqueaccum_data ON \
	  predictaccum_config.robot_id = torqueaccum_data.robot_id \
    WHERE torqueaccum_data.time_stamp BETWEEN $1 AND $2 ) T \
    WHERE robot_id = $3 \
    GROUP BY robot_name, robot_id, job_name",
    values: [
      start_time,
      end_time,
      req.params.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 선택한 로봇에 job 리스트 조회
diagnostics.get(`/joblist/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/startdate/:startdate/enddate/:enddate`, (req, res) => {
  const start_time = `${String(req.params.startdate)} 00:00:00`;
  const end_time = `${String(req.params.enddate)} 23:59:59`;
  const query = {
    text: "SELECT DISTINCT job_name FROM his_torqueaccum_data \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// renew 선택한 로봇 job list 조회
diagnostics.post(`/renew/joblist`, (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    text: `SELECT DISTINCT job_name FROM main.his_robot_data WHERE robot_id = $1 and start_time BETWEEN $2 AND $3`,
    values:[
      req.body.robotid,
      start_time,
      end_time
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 축 별 적산 평균 조회
diagnostics.get(`/accum/axis/:axis/job/:jobname/avg/zoneid/:zoneid/robotid/:robotid/startdate/:startdate/enddate/:enddate`, async (req, res) => {
  const start_time = `${String(req.params.startdate)} 00:00:00`;
  const end_time = `${String(req.params.enddate)} 23:59:59`;
  const query = {
    text: `SELECT sum(axissum) FROM \
    (SELECT robot_id, job_name, sum[${req.params.axis}] as axissum from his_torqueaccum_data \
    WHERE zone_id = $1 AND robot_id = $2 AND job_name = $3 AND time_stamp BETWEEN $4 AND $5 ) T \
    GROUP BY robot_id, job_name`,
    values: [
      req.params.zoneid,
      req.params.robotid,
      req.params.jobname,
      start_time,
      end_time
    ]
  }
  let axisSum = await commonModule.mainDB.execute(query);
  const queryString = {
    text: `SELECT count(*) FROM \
    (SELECT robot_id, job_name, sum[${req.params.axis}] as axissum from his_torqueaccum_data \
    WHERE zone_id = $1 AND robot_id = $2 AND job_name = $3 AND time_stamp BETWEEN $4 AND $5) T `,
    values: [
      req.params.zoneid,
      req.params.robotid,
      req.params.jobname,
      start_time,
      end_time
    ]
  }
  let rowCount = await commonModule.mainDB.execute(queryString);
  let axisAvg = Math.round((axisSum[0] / rowCount[0]))
  res.status(200).send(`${axisAvg}`);
})
// get robot controller type
diagnostics.get('/robottype/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid', (req, res) => {
  const query = {
    text: "SELECT model_name AS modelname \
    FROM def_robot_config \
    INNER JOIN def_model_config ON def_robot_config.rc_model_id = def_model_config.model_id \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

diagnostics.get(`/worklist/count/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/date/:date`, (req, res) => {
  let startTime = `${String(req.params.date)} 00:00:00`;
  let endTime = `${String(req.params.date)} 23:59:59`;
  const query = {
    text: "SELECT COUNT(*) FROM his_torqueaccum_data WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      startTime,
      endTime
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// get work list(job 제외)
diagnostics.get('/worklist/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/date/:date', (req, res) => {
  const start_time = `${String(req.params.date)} 00:00:00`;
  const end_time = `${String(req.params.date)} 23:59:59`;
  const query = {
    text: "SELECT job_name, time_stamp AS s_time, e_time, round( EXTRACT ( epoch FROM (e_time - time_stamp )) :: NUMERIC ) AS cycle_time \
    FROM his_torqueaccum_data \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6 AND job_name = job_name\
    ORDER BY time_stamp DESC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

diagnostics.get('/worklist/paging/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/date/:date/page/:page', (req, res) => {
  const start_time = `${String(req.params.date)} 00:00:00`;
  const end_time = `${String(req.params.date)} 23:59:59`;
  const offsetNum = String((req.params.page-1)*5);
  const query = {
    text: "SELECT job_name, time_stamp AS s_time, e_time, round( EXTRACT ( epoch FROM (e_time - time_stamp )) :: NUMERIC ) AS cycle_time \
    FROM his_torqueaccum_data \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6 AND job_name = job_name\
    ORDER BY time_stamp DESC LIMIT 5 OFFSET $7;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time,
      offsetNum
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})
// get work list(job 기준)
diagnostics.get('/worklist/factoryid/:factoryid/boothid/:boothid/zoneid/:zoneid/robotid/:robotid/date/:date/jobfile/:jobfile', (req, res) => {
  const start_time = `${String(req.params.date)} 00:00:00`;
  const end_time = `${String(req.params.date)} 23:59:59`;
  const query = {
    text: "SELECT job_name, time_stamp AS s_time, e_time, round( EXTRACT ( epoch FROM (e_time - time_stamp )) :: NUMERIC ) AS cycle_time \
    FROM his_torqueaccum_data \
    WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND time_stamp BETWEEN $5 AND $6 AND job_name = $7 \
    ORDER BY time_stamp DESC;",
    values: [
      req.params.factoryid,
      req.params.boothid,
      req.params.zoneid,
      req.params.robotid,
      start_time,
      end_time,
      req.params.jobfile
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 적산 경고 값 설정 화면

// 적산 경고 값 조회

diagnostics.get(`/accum/startdate/:startdate/enddate/:enddate`, (req, res) => {
  const query = {
    text: `SELECT * FROM (SELECT predictaccum_config.factory_id, \
    predictaccum_config.booth_id, \
    (SELECT booth_name FROM def_booth_config WHERE factory_id = predictaccum_config.factory_id AND booth_id = predictaccum_config.booth_id), \
    predictaccum_config.zone_id, \
    (SELECT zone_name FROM def_zone_config WHERE factory_id = predictaccum_config.factory_id AND booth_id = predictaccum_config.booth_id AND zone_id = predictaccum_config.zone_id), \
    predictaccum_config.robot_id, \
    (SELECT robot_name FROM def_robot_config WHERE factory_id = predictaccum_config.factory_id AND booth_id = predictaccum_config.booth_id AND zone_id = predictaccum_config.zone_id AND robot_id = predictaccum_config.robot_id), \
    torqueaccum_data.job_name, \
    torqueaccum_data.time_stamp, torqueaccum_data.e_time , torqueaccum_data.sum[predictaccum_config.axis], predictaccum_config.axis, \
    TRUNC(EXTRACT(epoch FROM (torqueaccum_data.e_time - torqueaccum_data.time_stamp))::numeric) AS cycle, \
    predictaccum_config.workingtime, \
    CAST((predictaccum_config.config_data->'maxsum')::json#>>'{}' AS INTEGER) AS maxsum, predictaccum_config.config_data->'minsum' AS minsum \
    FROM 	def_predictaccum_config predictaccum_config \
    INNER JOIN his_torqueaccum_data torqueaccum_data \
    ON 	predictaccum_config.factory_id = torqueaccum_data.factory_id AND \
    predictaccum_config.booth_id = torqueaccum_data.booth_id AND \
    predictaccum_config.zone_id = torqueaccum_data.zone_id AND \
    predictaccum_config.robot_id = torqueaccum_data.robot_id AND \
    predictaccum_config.job_name = torqueaccum_data.job_name \
    WHERE torqueaccum_data.time_stamp BETWEEN $1 AND $2 \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MAINTE%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MASTER%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%WORK-ID%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%HOME%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%VISION%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%DATA%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%PASS%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MAKE-UF%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%INIT%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%RESET%' \
    ORDER BY torqueaccum_data.time_stamp) T WHERE sum > maxsum`,
    values: [
      req.params.startdate,
      req.params.enddate
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})
// renew 적산 경고 값 조회(존 별)
diagnostics.post(`/renew/accum`, (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
      text: `with tt as (select robot_model.robot_model_id, robot_config.is_cart, robot_id, \
        CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart, robot_model.axis_count\
        FROM main.robot_config robot_config INNER JOIN main.def_robot_model robot_model ON robot_config.robot_model_id = robot_model.robot_model_id) \
        select robot_data.robot_id, robot_accum.job_name, to_char(start_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')as start_time, end_time, robot_data.torque_accum, torque_accum_spec, \
        tt.axis_count, tt.is_cart, (tt.cart + tt.axis_count) as robot_axis, robot_accum.cycle_time as config , robot_data.cycle_time \
        from main.his_robot_data robot_data INNER JOIN main.robot_accum_config robot_accum ON robot_data.robot_id = robot_accum.robot_id \
        INNER JOIN tt ON tt.robot_id  = robot_data.robot_id \
        where robot_data.robot_id in (${req.body.robotid}) and start_time between $1 and $2 and \
        CASE WHEN robot_accum.job_name IS null THEN tt.robot_id = robot_data.robot_id \
        ELSE robot_data.job_name = robot_accum.job_name END and \
        CASE WHEN robot_accum.cycle_time IS null THEN tt.robot_id  = robot_data.robot_id \
        ELSE robot_data.cycle_time >=(robot_accum.cycle_time - robot_accum.cycle_time * 0.1) and robot_data.cycle_time <= (robot_accum.cycle_time + robot_accum.cycle_time * 0.1) END`,
      values: [
        start_time,
        end_time,
      ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

diagnostics.post(`/renew/accum/daily/avg`, (req, res) => {
  const start_time = `${String(req.body.startDate)} 00:00:00`;
  const end_time = `${String(req.body.endDate)} 23:59:59`;
  const query = {
    text: `SELECT robot_id, value, torque_accum_avg_spec, rc_model_id, tool_id  FROM (\
      SELECT rawdata.robot_id, accum_config.job_name, jsonb_array_elements(raw_data_torque_accum_avg)as value, accum_config.torque_accum_avg_spec ,\
      rc_model_id, tool_id FROM main.his_report_rawdata_robot rawdata \
      INNER JOIN main.robot_accum_config accum_config on accum_config.robot_id  = rawdata.robot_id \
      INNER JOIN main.robot_config robot_config on robot_config.robot_id = rawdata.robot_id \
      where rawdata.robot_id IN (${req.body.robotId}) and date between $1 and $2)A WHERE job_name = value ->> 'job_name' and torque_accum_avg_spec is not null`,
      values: [
        start_time,
        end_time,
      ]
  }
  getDiagnosticsItems(query).then(result => {
    if(result.length > 0) {
        let accumDailyAvgItems = [];
        result.forEach(item => {
          const accumDailyAvg = {
            sum : item.value.torque_accum_avg,
            robot_id : item.robot_id,
            rc_model_id : item.rc_model_id,
            tool_id : item.tool_id,
            torque_accum_avg_spec : item.torque_accum_avg_spec.map(str => {return Number(str)}),
            cycle: Math.round(item.value.cycle_time_avg),
            job_name: item.value.job_name
          }
          accumDailyAvgItems.push(accumDailyAvg)
        })
        accumDailyAvgItems && res.status(200).send(accumDailyAvgItems);
    } else {
        res.status(204).send('no data');
    }
  }).catch(error => {
    res.status(404).send(error);
  })

  // commonModule.mainDB.execute(query, req.session.spsid, res)
})
// renew 적산 경고 값 조회(로봇 별, 축 별)
diagnostics.post(`/renew/accum/robot/axis`, (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
      text: `SELECT torque_accum[$4] as data, robot_data.cycle_time, robot_data.robot_id, to_char(start_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')as date, \
      robot_accum_config.torque_accum_spec[$4] as spec, robot_accum_config.cycle_time as cycle_config from  main.his_robot_data robot_data
      INNER JOIN main.robot_accum_config robot_accum_config ON robot_accum_config.robot_id = robot_data.robot_id
      WHERE robot_data.robot_id = $3 and start_time between $1 and $2 and \
      CASE WHEN robot_accum_config.cycle_time IS null THEN robot_data.job_name = robot_accum_config.job_name \
      ELSE robot_data.cycle_time >= (robot_accum_config.cycle_time - robot_accum_config.cycle_time * 0.1) and \
      robot_data.cycle_time <= (robot_accum_config.cycle_time + robot_accum_config.cycle_time * 0.1) END and \
      robot_data.job_name = robot_accum_config.job_name order by start_time`,
      values: [
        start_time,
        end_time,
        req.body.robotid,
        req.body.axis
      ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

// renew 적산 경고 평균 값 조회 (로봇 별, 축 별)
diagnostics.post(`/renew/accum/avg/robot/axis`, (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
      // text: `with t as (SELECT robot_id, cycle_time as config FROM main.robot_accum_config WHERE robot_id = $3)\
      // SELECT ROUND(AVG(torque_accum[$4])) as data_avg FROM main.his_robot_data robot_data INNER JOIN t ON t.robot_id = robot_data.robot_id \
      // WHERE CASE WHEN config IS null THEN t.robot_id = robot_data.robot_id \
      // ELSE cycle_time >= (config - config * 0.1) and cycle_time <= (config + config * 0.1) END\
      // and robot_data.robot_id = $3 and job_name = $5 and start_time between $1 and $2`,
      text: `SELECT ROUND(AVG(torque_accum[$4])) as data_avg FROM main.his_robot_data \
      WHERE robot_id = $3 and job_name = $5 and start_time between $1 and $2`,
      values: [
        start_time,
        end_time,
        req.body.robotid,
        req.body.axis,
        req.body.jobname
      ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

// 적산 경고 값 설정 잡 조회
diagnostics.get('/accum/masterjob/startdate/:startdate/enddate/:enddate', (req, res) => {
  const query = {
    text: `SELECT robot_id, job_name \
    FROM (SELECT torqueaccum_data.robot_id, torqueaccum_data.job_name, torqueaccum_data.time_stamp \
    FROM his_torqueaccum_data torqueaccum_data INNER JOIN def_predictaccum_config predictaccum_config ON \
    torqueaccum_data.robot_id = predictaccum_config.robot_id AND torqueaccum_data.job_name = predictaccum_config.job_name  \
    WHERE torqueaccum_data.time_stamp BETWEEN $1 AND $2 \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MAINTE%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MASTER%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%WORK-ID%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%HOME%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%VISION%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%DATA%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%PASS%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%MAKE-UF%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%INIT%' \
    AND UPPER(torqueaccum_data.job_name) NOT LIKE '%RESET%' \
    ORDER BY torqueaccum_data.robot_id \
    ) T GROUP BY robot_id, job_name ` ,
    values: [
      req.params.startdate,
      req.params.enddate
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

// renew 적산 경고 설정 잡 개수 조회
diagnostics.post('/renew/accum/masterjob/count', async(req, res) => {
  const query = {
    text: `WITH A AS (SELECT robot_id, job_name from main.robot_accum_config where robot_id IN (${req.body.robotid}))\
    SELECT count(robot_data.job_name), A.job_name, A.robot_id FROM main.his_robot_data robot_data INNER JOIN A ON A.robot_id = robot_data.robot_id\
    WHERE robot_data.start_time BETWEEN $1 AND $2 \
    GROUP BY A.job_name, A.robot_id` ,
    values: [
      req.body.startdate,
      req.body.enddate
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)

})

// renew 적산 경고 설정 잡 조회(설정 잡은 있는데, data가 없을 시, 설정잡도 조회가 안되기 때문에 설정잡 조회하는 api를 따로 선언함)
diagnostics.post('/renew/accum/masterjob', (req, res) => {
  const query = `SELECT * FROM main.robot_accum_config where robot_id IN (${req.body.robotid})`
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

// 적산 경고 값 축별 평균 값 조회
diagnostics.post('/accum/test/avg/startdate/:startdate/enddate/:enddate', async (req, res) => {
  let temp = [];
    for await(let item of req.body.data){
      let robot_id = item.robot_id
      let job_name = item.job_name
      const query = {
        text: `SELECT robot_id, count(*) \
        FROM (SELECT robot_id, job_name from his_torqueaccum_data WHERE robot_id = $3 and job_name = $4 \
        and time_stamp between $1 and $2)t GROUP BY robot_id`,
        values: [
          req.params.startdate,
          req.params.enddate,
          robot_id,
          job_name
        ]
      }
      let lengthData = await commonModule.mainDB.execute(query);
      // temp.push({
      //   robot_id : lengthData[0][0],
      //   length: lengthData[0][1]
      // })
      const queryString = {
        text: `SELECT robot_id, sum(axis1) as axis1, \
        sum(axis2) as axis2, sum(axis3) as axis3, sum(axis4) as axis4, \
        sum(axis5) as axis5, sum(axis6) as axis6, sum(axis7) as axis7 \
        FROM \
        (SELECT robot_id, job_name, sum[1] as axis1, \
          sum[2] as axis2, sum[3] as axis3, sum[4] as axis4, \
          sum[5] as axis5, sum[6] as axis6, sum[7] as axis7 \
          FROM his_torqueaccum_data WHERE robot_id = $3 and job_name = $4 and time_stamp between $1 and $2)A GROUP BY robot_id`,
         values: [
          req.params.startdate,
          req.params.enddate,
          robot_id,
          job_name
        ]
      }
      let sumData = await commonModule.mainDB.execute(queryString);
      temp.push({
        robot_id : sumData[0][0],
        axis1: Math.round(sumData[0][1] / lengthData[0][1]),
        axis2: Math.round(sumData[0][2] / lengthData[0][1]),
        axis3: Math.round(sumData[0][3] / lengthData[0][1]),
        axis4: Math.round(sumData[0][4] / lengthData[0][1]),
        axis5: Math.round(sumData[0][5] / lengthData[0][1]),
        axis6: Math.round(sumData[0][6] / lengthData[0][1]),
        axis7: Math.round(sumData[0][7] / lengthData[0][1]),
      })
    }
    res.status(200).send(temp);
  // }
  // commonModule.mainDB.execute(query, req.session.spsid, res)
})

// renew 적산 경고 값 축별 평균 조회
diagnostics.post('/renew/avg/robot/axis', (req, res) => {
  const start_time = `${String(req.body.startDate)} 00:00:00`;
  const end_time = `${String(req.body.endDate)} 23:59:59`;
  let torqueAccumAvgconditionStr = ''
  let conditionStr = `robot_data.robot_id = $3 and robot_data.job_name = accum_config.job_name and start_time between $1 and $2 and \
  robot_data.cycle_time >= (accum_config.cycle_time * 0.9) and robot_data.cycle_time <= (accum_config.cycle_time * 1.1)`
  let arrayStr = ''
  for (let i = 0; i < req.body.robotAxis; i++){
    let tempStr = `CAST(sum(torque_accum[${i+1}]) AS numeric) as axis${i+1}`
    torqueAccumAvgconditionStr += i === req.body.robotAxis-1 ? tempStr : tempStr + ','
    let tempArrayStr = `ROUND(axis${i+1} / count)`
    arrayStr += i === req.body.robotAxis-1 ? tempArrayStr : tempArrayStr + ','
  }
  const query = {
    text: `with t1 as (\
      SELECT robot_id, count(*) FROM (\
        select robot_data.robot_id, robot_data.job_name \
        from main.his_robot_data robot_data INNER JOIN main.robot_accum_config  accum_config ON accum_config.robot_id = robot_data.robot_id \
        WHERE ${conditionStr}) T GROUP BY robot_id), \
        t2 as (\
          SELECT robot_data.robot_id, robot_data.job_name, ${torqueAccumAvgconditionStr} FROM main.his_robot_data robot_data \
          INNER JOIN main.robot_accum_config accum_config ON accum_config.robot_id = robot_data.robot_id \
          WHERE ${conditionStr} GROUP BY robot_data.robot_id, robot_data.job_name\
        )\
      SELECT t2.robot_id, ARRAY [${arrayStr}] FROM t1 inner join t2 on t1.robot_id = t2.robot_id` ,
    values: [
      start_time,
      end_time,
      req.body.robotId
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})
// renew 토크 평균 값 존 별 조회
diagnostics.post('/renew/torque/avg/pmtorque', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    // text : `SELECT * FROM main.his_robot_pmtorque
    // WHERE robot_id in (${req.body.robotid}) and update_time_server between $1 and $2`,
    text : `SELECT * FROM main.his_robot_pmtorque
    WHERE robot_id in (${req.body.robotid}) and date between $1 and $2`,
    values: [
      start_time,
      end_time
    ]
  }
    commonModule.mainDB.execute(query, req.session.spsid, res)
})

// renew 토크 평균 값 (로봇 별, 축 별)
diagnostics.post('/renew/torque/avg/pmtorque/robot/axis', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  const query = {
    // text: `SELECT robot_id, axis, judge, torque_avg_latest as latest, torque_avg_elapsed as elapsed, to_char(update_time_server::timestamp, 'YYYY-MM-DD HH24:MI:SS')as date \
    // FROM main.his_robot_pmtorque where robot_id = $1 and update_time_server between $2 and $3 and axis = $4`,
    text: `SELECT robot_id, axis, judge, torque_avg_latest as latest, torque_avg_elapsed as elapsed, to_char(date::timestamp, 'YYYY-MM-DD HH24:MI:SS')as date \
    FROM main.his_robot_pmtorque where robot_id = $1 and date between $2 and $3 and axis = $4 and judge in ('0','1') order by date`,
    values: [
      req.body.robotid,
      start_time,
      end_time,
      req.body.axis
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})
