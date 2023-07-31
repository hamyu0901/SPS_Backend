/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueLoadFactor = express.Router();
export { torqueLoadFactor };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueLoadFactor.use(bodyParser.urlencoded({ extended: true }));
torqueLoadFactor.use(bodyParser.json());

torqueLoadFactor.get('/', (req, res) => {
  res.status(200).send('Torque Load Factor');
});

const getRobotJobItems = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
        res === undefined ? reject(new Error(err)) : resolve(res.rows);
    })
  })
}

// 잡리스트
torqueLoadFactor.post('/data/joblist', (req, res) => {
  const query = `SELECT extract(month FROM update_timestamp - CURRENT_TIMESTAMP ) AS gap, job_list \
    FROM cur_job_list WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 그리드 테이블
torqueLoadFactor.post('/data/gridtable', (req, res) => {
  let query;
  if (req.body.excpt === 'true') {
    query = `SELECT * FROM (SELECT time_stamp AS timestamp, avg[${
      req.body.axis
    }], sum[${
      req.body.axis
    }] AS acml, EXTRACT(EPOCH FROM e_time - time_stamp) AS cycle \
        FROM his_torqueaccum_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND job_name= '${
  req.body.jobname
}' AND robot_id = ${
  req.body.robotid
} AND time_stamp between '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59' ORDER BY time_stamp desc) a \
        WHERE abs(a.cycle - COALESCE((SELECT EXTRACT(EPOCH FROM workingtime) workingtime FROM def_predictaccum_config \
        WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND job_name= '${
  req.body.jobname
}' AND robot_id = ${
  req.body.robotid
} AND axis = ${
  req.body.axis
}), a.cycle)) < 3 ;`;
  } else {
    query = `SELECT time_stamp AS timestamp, avg[${
      req.body.axis
    }], sum[${
      req.body.axis
    }] AS acml, EXTRACT(EPOCH FROM e_time - time_stamp) AS cycle FROM his_torqueaccum_data \
        WHERE factory_id =${
  req.body.factoryid
} AND booth_id =${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND job_name= '${
  req.body.jobname
}' AND robot_id =${
  req.body.robotid
} AND time_stamp between '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59' ORDER BY time_stamp desc`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

/*
설정 평균 최대값업데이트시
maxavg , maxavg_updatetime
설정 평균 최소값 업데이트
minavg, minavg_updatetime
설정 누적 최대값 업데이트
maxsum, maxsum_updatetime
설정 누적 최소값 업데이트
minsum, minsum_updatetime
*/
// 예제 configdata {"maxavg": "18", "maxavg_updatetime":"2019-04-23 10:21"}
torqueLoadFactor.post('/data/abnormalref/update', (req, res) => {
  const query = `INSERT INTO def_predictaccum_config (\
        factory_id, \
        booth_id, \
        zone_id, \
        robot_id, \
        job_name, \
        axis, \
        workingtime, \
        config_data) \
        VALUES (${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, '${
  req.body.jobname
}', ${
  req.body.axis
}, ${
  req.body.worktime
}, '${
  req.body.configdata
}') ON CONFLICT on constraint def_predictaccum_config_pk DO UPDATE SET config_data = EXCLUDED.config_data || '${
  req.body.configdata
}';`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 토크 부하율 적산 트렌드
// output : timestamp / sum / cycle
// torqueLoadFactor.post('/data', (req, res) => {
//   const startTime = `${String(req.body.prevtime)} 00:00:00`;
//   const endTime = `${String(req.body.prevtime)} 23:59:59`;
//   const query = {
//     text: "SELECT to_char(time_stamp, 'HH24:MI:SS') AS timestamp, sum[$1], ROUND( EXTRACT(EPOCH FROM e_time - time_stamp)) AS cycle FROM his_torqueaccum_data WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND job_name = $5 AND robot_id = $6 AND time_stamp BETWEEN $7 AND $8 ORDER BY time_stamp asc;",
//     values: [
//       req.body.axis,
//       req.body.factoryid,
//       req.body.boothid,
//       req.body.zoneid,
//       commonModule.common.checkJobName(req.body.jobname),
//       req.body.robotid,
//       startTime,
//       endTime,
//     ],
//   };
//   commonModule.mainDB.execute(query, req.session.spsid, res);
// });
torqueLoadFactor.post('/data', (req, res) => {
  const startTime = `${String(req.body.startDate)} 00:00:00`;
  const endTime = `${String(req.body.endDate)} 23:59:59`;
  const query = {
    text: "SELECT to_char(time_stamp, 'MM-DD HH24:MI') AS timestamp, sum[$1], ROUND( EXTRACT(EPOCH FROM e_time - time_stamp)) AS cycle FROM his_torqueaccum_data WHERE factory_id = $2 AND booth_id = $3 AND zone_id = $4 AND job_name = $5 AND robot_id = $6 AND time_stamp BETWEEN $7 AND $8 ORDER BY time_stamp asc;",
    values: [
      req.body.axis,
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      commonModule.common.checkJobName(req.body.jobname),
      req.body.robotid,
      startTime,
      endTime,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

//renew 토크 부하율 적산 트렌드
torqueLoadFactor.post('/renew/data', (req, res) => {
  const startTime = `${String(req.body.startDate)} 00:00:00`;
  const endTime = `${String(req.body.endDate)} 23:59:59`;
  const query = {
    text: "SELECT to_char(start_time::timestamp, 'YYYY-MM-DD HH24:MI:SS') AS timestamp, torque_accum[$1] as sum , ROUND(robot_data.cycle_time) AS cycle FROM main.his_robot_data robot_data \
    INNER JOIN main.robot_accum_config accum_config on accum_config.robot_id = robot_data.robot_id \
    WHERE robot_data.robot_id = $2 and robot_data.job_name = $3 and start_time between $4 and $5 \
    AND CASE WHEN accum_config.cycle_time IS null THEN accum_config.robot_id = robot_data.robot_id \
    ELSE robot_data.cycle_time >= (accum_config.cycle_time * 0.9) and robot_data.cycle_time <= (accum_config.cycle_time * 1.1) END order by start_time",
    values: [
      req.body.axis,
      req.body.robotid,
      req.body.jobname,
      startTime,
      endTime,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 이상 기준 설정 값 (트렌드 가이드 반영)
// output : workingtime / maxsum / maxsum_updatetime / minsum / minsum_updatetime
torqueLoadFactor.post('/data/abn/list', (req, res) => {
  const query = {
    text: `SELECT
    workingtime,
    config_data->'maxsum' maxsum,
    config_data->'maxsum_updatetime' maxsum_updatetime,
    config_data->'minsum' minsum,
    config_data->'minsum_updatetime' minsum_updatetime
    FROM def_predictaccum_config WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3 AND robot_id = $4 AND job_name = $5 AND axis = $6`,
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      commonModule.common.checkJobName(req.body.jobname),
      req.body.axis],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
// renew 이상 기준 설정 값 조회
torqueLoadFactor.post('/renew/data/abn/list', (req, res) => {
  const query = {
    text: `select main.robot_accum_config.robot_id, robot_name, torque_accum_spec[$2], torque_accum_avg_spec[$2], job_name , cycle_time from main.robot_accum_config \
    INNER JOIN main.robot_config ON main.robot_config.robot_id = main.robot_accum_config.robot_id WHERE main.robot_accum_config.robot_id = $1`,
    values: [
      req.body.robotid,
      req.body.axis
    ]
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 이상 기준 설정 저장
torqueLoadFactor.post('/data/abn', (req, res) => {
  const query = {
    text: `INSERT INTO def_predictaccum_config ( factory_id, booth_id, zone_id, robot_id, job_name, axis, workingtime, config_data)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT on constraint def_predictaccum_config_pk DO UPDATE SET workingtime = $7,
    config_data = EXCLUDED.config_data || $8`,
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      req.body.jobname,
      req.body.axis,
      req.body.worktime,
      req.body.configdata,
    ],
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

//renew 이상 기준 설정 저장
torqueLoadFactor.post('/renew/data/abn', async (req, res) => {
  let torqueaccum = Array(req.body.robotaxis).fill(0)
  let query
  const queryString = `SELECT robot_id, job_name from main.robot_accum_config WHERE robot_id = ${req.body.robotid}`
  let robot_config_info = await commonModule.mainDB.execute(queryString);
  if(robot_config_info !== undefined){ // update set 로봇 id가 기존에 있다면
    if(robot_config_info[0][1] === req.body.jobname){  // 기존 잡과 바꿀 잡이 같다면 해당 축만 변경
      query = {
        text: `UPDATE main.robot_accum_config set torque_accum_spec[${req.body.axis}] = $1 , job_name = $2, cycle_time = $3 where robot_id = $4`,
        values: [
          req.body.maxconfig,
          req.body.jobname,
          req.body.worktime,
          req.body.robotid,
        ]
      }
    }else{  // 잡이 다르다면, 해당 축 외에 나머지 축 초기화
      torqueaccum[req.body.axis-1] = req.body.maxconfig
      query = {
        text: `UPDATE main.robot_accum_config set torque_accum_spec = $1 , job_name = $2, cycle_time = $3 where robot_id = $4`,
        values: [
          torqueaccum,
          req.body.jobname,
          req.body.worktime,
          req.body.robotid
        ]
      }
    }
  }else{  // insert into
    torqueaccum[req.body.axis-1] = req.body.maxconfig
    query = {
      text : `INSERT INTO main.robot_accum_config (robot_id, job_name, torque_accum_spec, cycle_time) values($1,$2,$3,$4)`,
      values: [
        req.body.robotid,
        req.body.jobname,
        torqueaccum,
        req.body.worktime
      ]
    }
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})
torqueLoadFactor.post('/renew/data/avg/abn', async (req, res) => {
  let torqueaccum = Array(req.body.robotaxis).fill(0)
  let query
  const queryString = `SELECT robot_id, job_name from main.robot_accum_config WHERE robot_id = ${req.body.robotid}`
  let robot_config_info = await commonModule.mainDB.execute(queryString);
  if(robot_config_info !== undefined){ // update set 로봇 id가 기존에 있다면
    if(robot_config_info[0][1] === req.body.jobname){  // 기존 잡과 바꿀 잡이 같다면 해당 축만 변경
      query = {
        text: `UPDATE main.robot_accum_config set torque_accum_avg_spec[${req.body.axis}] = $1 , job_name = $2, cycle_time = $3 where robot_id = $4`,
        values: [
          req.body.maxconfig,
          req.body.jobname,
          req.body.worktime,
          req.body.robotid,
        ]
      }
    }else{  // 잡이 다르다면, 해당 축 외에 나머지 축 초기화
      torqueaccum[req.body.axis-1] = req.body.maxconfig
      query = {
        text: `UPDATE main.robot_accum_config set torque_accum_avg_spec = $1 , job_name = $2, cycle_time = $3 where robot_id = $4`,
        values: [
          torqueaccum,
          req.body.jobname,
          req.body.worktime,
          req.body.robotid
        ]
      }
    }
  }else{  // insert into
    torqueaccum[req.body.axis-1] = req.body.maxconfig
    query = {
      text : `INSERT INTO main.robot_accum_config (robot_id, job_name, torque_accum_avg_spec, cycle_time) values($1,$2,$3,$4)`,
      values: [
        req.body.robotid,
        req.body.jobname,
        torqueaccum,
        req.body.worktime
      ]
    }
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})



// 이상 기준 로봇별 설정값 삭제
torqueLoadFactor.post('/robotid/:robotid/job/:jobfile', (req, res) => {
  const query = {
    text: `DELETE FROM def_predictaccum_config WHERE robot_id = ${req.params.robotid} AND job_name NOT LIKE '%${req.params.jobfile}%'`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

torqueLoadFactor.get('/data/sum/list', (req, res) => {
  const query = {
    text: `select
    booth_id, (select booth_name from def_booth_config as deftable where deftable.booth_id = histable.booth_id),
    zone_id, (select zone_name from def_zone_config as deftable where deftable.zone_id = histable.zone_id),
    robot_id, (select robot_name from def_robot_config as deftable where deftable.robot_id = histable.robot_id),
    job_name, count(job_name), round(extract(epoch from avg(e_time - time_stamp))) avgcycle
    , max(sum[1]) maxsum_t1
    , (select config_data->'maxsum' maxsum1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1)
    , (select config_data->'minsum' minsum1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1)
    , (select workingtime AS cycle1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1)
    , max(sum[2]) maxsum_t2
    , (select config_data->'maxsum' maxsum2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2)
    , (select config_data->'minsum' minsum2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2)
    , (select workingtime AS cycle2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2)
    , max(sum[3]) maxsum_t3
    , (select config_data->'maxsum' maxsum3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3)
    , (select config_data->'minsum' minsum3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3)
    , (select workingtime AS cycle3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3)
    , max(sum[4]) maxsum_t4
    , (select config_data->'maxsum' maxsum4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4)
    , (select config_data->'minsum' minsum4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4)
    , (select workingtime AS cycle4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4)
    , max(sum[5]) maxsum_t5
    , (select config_data->'maxsum' maxsum5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5)
    , (select config_data->'minsum' minsum5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5)
    , (select workingtime AS cycle5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5)
    , max(sum[6]) maxsum_t6
    , (select config_data->'maxsum' maxsum6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6)
    , (select config_data->'minsum' minsum6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6)
    , (select workingtime AS cycle6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6)
    , max(sum[7]) maxsum_t7
    , (select config_data->'maxsum' maxsum7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7)
    , (select config_data->'minsum' minsum7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7)
    , (select workingtime AS cycle7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7)
    , min(sum[1]) minsum_t1, min(sum[2]) minsum_t2, min(sum[3]) minsum_t3, min(sum[4]) minsum_t4
    , min(sum[5]) minsum_t5, min(sum[6]) minsum_t6, min(sum[7]) minsum_t7
    , avg(sum[1]) avgsum_t1, avg(sum[2]) avgsum_t2, avg(sum[3]) avgsum_t3, avg(sum[4]) avgsum_t4
    , avg(sum[5]) avgsum_t5, avg(sum[6]) avgsum_t6, avg(sum[7]) avgsum_t7
    from his_torqueaccum_data as histable where factory_id = $1
    ${(req.query.boothid === undefined) ? ``: `and booth_id = ${String(req.query.boothid)}`}
    ${(req.query.zoneid === undefined) ? ``: `and zone_id = ${String(req.query.zoneid)}`}
    ${(req.query.robotid === undefined) ? ``: `and robot_id = ${String(req.query.robotid)}`}
    and time_stamp BETWEEN $2 and $3
    GROUP BY booth_id, zone_id, robot_id, job_name order by robot_id, job_name;`,
    values: [
      req.query.factoryid,
      `${String(req.query.startDate)} 00:00:00`,
      `${String(req.query.endDate)} 23:59:59`,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 적산 경고 값 조회
torqueLoadFactor.get('/data/history/accum/startdate/:startdate/enddate/:enddate', (req, res) => {
  const query = {
    text: `SELECT
    factory_id,
    booth_id,
    (select booth_name from def_booth_config as deftable where deftable.booth_id = histable.booth_id),
    zone_id,
    (select zone_name from def_zone_config as deftable where deftable.zone_id = histable.zone_id),
    robot_id,
    (select robot_name from def_robot_config as deftable where deftable.robot_id = histable.robot_id),
    job_name,
    count(job_name),
    round(extract(epoch from avg(e_time - time_stamp))) avg_cycle,
    max(sum[1]) max_sum_1,
    min(sum[1]) min_sum_1,
    round(avg(sum[1])) avg_sum_1,
    (select config_data->'maxsum' max_warning_1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1),
    (select config_data->'minsum' min_warning_1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1),
    (select workingtime AS cycle_warning_1 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 1),
    max(sum[2]) max_sum_2,
    min(sum[2]) min_sum_2,
    round(avg(sum[2])) avg_sum_2,
    (select config_data->'maxsum' max_warning_2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2),
    (select config_data->'minsum' min_warning_2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2),
    (select workingtime AS cycle_warning_2 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 2),
    max(sum[3]) max_sum_3,
    min(sum[3]) min_sum_3,
    round(avg(sum[3])) avg_sum_3,
    (select config_data->'maxsum' max_warning_3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3),
    (select config_data->'minsum' min_warning_3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3),
    (select workingtime AS cycle_warning_3 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 3),
    max(sum[4]) max_sum_4,
    min(sum[4]) min_sum_4,
    round(avg(sum[4])) avg_sum_4,
    (select config_data->'maxsum' max_warning_4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4),
    (select config_data->'minsum' min_warning_4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4),
    (select workingtime AS cycle_warning_4 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 4),
    max(sum[5]) max_sum_5,
    min(sum[5]) min_sum_5,
    round(avg(sum[5])) avg_sum_5,
    (select config_data->'maxsum' max_warning_5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5),
    (select config_data->'minsum' min_warning_5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5),
    (select workingtime AS cycle_warning_5 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 5),
    max(sum[6]) max_sum_6,
    min(sum[6]) min_sum_6,
    round(avg(sum[6])) avg_sum_6,
    (select config_data->'maxsum' max_warning_6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6),
    (select config_data->'minsum' min_warning_6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6),
    (select workingtime AS cycle_warning_6 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 6),
    max(sum[7]) max_sum_7,
    min(sum[7]) min_sum_7,
    round(avg(sum[7])) avg_sum_7,
    (select config_data->'maxsum' max_warning_7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7),
    (select config_data->'minsum' min_warning_7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7),
    (select workingtime AS cycle_warning_7 FROM def_predictaccum_config as deftable WHERE deftable.booth_id = histable.booth_id and deftable.zone_id = histable.zone_id and deftable.robot_id = histable.robot_id and deftable.job_name = histable.job_name AND deftable.axis = 7)
    FROM his_torqueaccum_data AS histable
    WHERE time_stamp BETWEEN $1 and $2
    GROUP BY factory_id, booth_id, zone_id, robot_id, job_name order by robot_id, job_name;`,
    values: [
      `${String(req.params.startdate)} 00:00:00`,
      `${String(req.params.enddate)} 23:59:59`,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueLoadFactor.post('/allmodify', (req, res) => {
  if (!commonModule.sess.requestAuth(req.session.spsid)) {
    res.send(404).send('not login');
    return;
  }
  let data = req.body.data;
  let query = '';
  for (let i = 0; i < data.length; ++i) {
    query += `INSERT INTO def_predictaccum_config
    (factory_id, booth_id, zone_id, robot_id, job_name, axis, workingtime, config_data)
    VALUES (
      ${data[i].factoryid},
      ${data[i].boothid},
      ${data[i].zoneid},
      ${data[i].robotid},
      ${data[i].jobname},
      ${data[i].axis},
      ${data[i].worktime},
      ${data[i].configdata}
      ) ON CONFLICT on constraint def_predictaccum_config_pk DO UPDATE SET workingtime =
      ${data[i].worktime}
      , config_data = EXCLUDED.config_data ||
      ${data[i].configdata}; `;
  }
  commonModule.mainDB.getInstance().query(query, (err, response) => {
    if (err) {
      res.send(404).send('error');
    }
    else {
      res.send(200).send(response.rows);
    }
  });
});

// 적산 경고 값 저장
torqueLoadFactor.post('/data/set/warning', (req, res) => {
  const query = {
    text: `INSERT INTO def_predictaccum_config(factory_id, booth_id, zone_id, robot_id, job_name, axis, workingtime, config_data)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT ON CONSTRAINT def_predictaccum_config_pk DO UPDATE SET workingtime = $7, config_data = EXCLUDED.config_data || $8;`,
    values: [
      req.body.factoryid,
      req.body.boothid,
      req.body.zoneid,
      req.body.robotid,
      req.body.jobname,
      req.body.axis,
      req.body.workingtime,
      req.body.configdata
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})


const getTorqueLoadFactorItems = (query) => {
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
torqueLoadFactor.post('/renew/accum/daily/avg', (req, res) => {
  const startTime = `${String(req.body.startDate)} 00:00:00`;
  const endTime = `${String(req.body.endDate)} 23:59:59`;
  const query = {
    text: `SELECT * FROM ( \
      SELECT rawdata.robot_id, to_char(date::timestamp, 'YYYY-MM-DD') AS date, JSONB_ARRAY_ELEMENTS(raw_data_torque_accum_avg) as torqueAvgItem , accum_config.torque_accum_avg_spec \
      FROM main.his_report_rawdata_robot rawdata INNER JOIN main.robot_accum_config accum_config on accum_config.robot_id = rawdata.robot_id \
      where rawdata.robot_id = $3 and date between $1  and $2 order by date )T WHERE torqueAvgItem ->> 'job_name' = $4`,
    values: [
      startTime,
      endTime,
      req.body.robotid,
      req.body.jobname,
    ]
  };

  getTorqueLoadFactorItems(query).then(result => {
    if(result.length > 0) {
        let accumAxisDailyAvgItems = [];
        result.forEach(item => {
          const accumAxisDailyAvg = {
            sum : item.torqueavgitem.torque_accum_avg[req.body.axis-1],
            robot_id : item.robot_id,
            timestamp : item.date,
            cycle: Math.round(item.torqueavgitem.cycle_time_avg),
            // spec : item.torque_accum_avg_spec[req.body.axis-1]
          }
          accumAxisDailyAvgItems.push(accumAxisDailyAvg)
        })
        accumAxisDailyAvgItems && res.status(200).send(accumAxisDailyAvgItems);
    } else {
        res.status(204).send('no data');
    }
  }).catch(error => {
    res.status(404).send(error);
  })
})

torqueLoadFactor.get('/robot/job/list', (req, res) => {
  const { robotId, startDate, endDate} = req.query
  const query = `SELECT job_list FROM main.his_daily_report WHERE date BETWEEN '${startDate}'::date AND '${endDate}'::date AND robot_id = ${robotId} AND job_list IS NOT NULL `;
  commonModule.sess.requestAuth(req.session.spsid) ?
    getRobotJobItems(query).then(robotJobItemResult => {
      const robotJobItems = robotJobItemResult.length > 0 ? robotJobItemResult : []
      const fileterdRobotJobItems = robotJobItems.length > 0 &&
        Object.values(robotJobItems.reduce((acc, cur) => {
          let jobList = cur.job_list;
          for(let jobNumber in jobList) {
            let jobAmount = jobList[jobNumber];
            /* 누적 객체에 현재 job 이름이 있다면, 더해줌 */ 
            if (acc.hasOwnProperty(jobNumber)) { 
              acc[jobNumber].count += jobAmount;
            }
            /** 누적 객체에 현재 job 이름이 없다면, 추가함 */ 
            else {
              acc[jobNumber] = {
                count: jobAmount,
                id: jobNumber
              };
            }
          }
          return acc;
        }, {}));
        fileterdRobotJobItems ? res.status(200).send(fileterdRobotJobItems) : res.status(204).send('no data')
    })
    .catch(error => {
        res.status(404).send(error);
    })
  : res.status(404).send('not login');
})