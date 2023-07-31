/* eslint-disable no-param-reassign */
/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
/* eslint-disable max-len */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const alarmStatistics = express.Router();
export { alarmStatistics };
const bodyParser = require('body-parser');
const commonModule = require('../app');

alarmStatistics.use(bodyParser.urlencoded({ extended: true }));
alarmStatistics.use(bodyParser.json());


const statistics = require('./statistics/statistics');

alarmStatistics.use('/data/gridtable/statistics', statistics.statistics);

alarmStatistics.get('/', (req, res) => {
  res.status(200).send('Alarm Statistics');
});

// 알람 조건 (알람종류, 알람코드)
function alarmCondition(req, str, returnData) {
  let query = str;
  if (typeof returnData === 'function') {
    // if(req.body.alarmtype != 0){
    //   if(req.body.alarmlevelzones != '' && req.body.alarmlevelzones != undefined){
    //     query += `AND zone_id IN (${req.body.alarmlevelzones})`
    //   }
    //   if(req.body.alarmlevelcodes != '' && req.body.alarmlevelcodes != undefined){
    //      query +=  `AND alarm_code IN (${req.body.alarmlevelcodes})`
    //   }
    // }
    if (!commonModule.common.isEmpty(req.body.boothid)) {
      if (!commonModule.common.isEmpty(req.body.alarmtype) && !commonModule.common.isEmpty(req.body.alarmcode)) {
        query += ` AND alarm_code NOT IN(${req.body.alarmcode}) AND alarm_type = ${req.body.alarmtype})`;
      }
      else if (!commonModule.common.isEmpty(req.body.alarmcode)){
        query += ` AND alarm_code NOT IN(${req.body.alarmcode})`;
      }
      else if (!commonModule.common.isEmpty(req.body.alarmtype)) {
        query += ` AND alarm_type = ${req.body.alarmtype}`;}
      if (!commonModule.common.isEmpty(req.body.boothid) && !commonModule.common.isEmpty(req.body.zoneid)) {
        query += ` AND booth_id = ${req.body.boothid} AND zone_id = ${req.body.zoneid}`;
        if(!commonModule.common.isEmpty(req.body.robotid)){
          query += ` AND robot_id = ${req.body.robotid}`;
        }
      }
      else {
        query += ` AND booth_id = ${req.body.boothid}`;
      }
    }
    else if (!commonModule.common.isEmpty(req.body.alarmtype) && !commonModule.common.isEmpty(req.body.alarmcode)) {
      query += ` AND alarm_code NOT IN(${ req.body.alarmcode}) AND alarm_type = ${req.body.alarmtype})`;
    }
    else if (!commonModule.common.isEmpty(req.body.alarmcode)){
      query += ` AND alarm_code NOT IN(${req.body.alarmcode})`;
    }
    else if (!commonModule.common.isEmpty(req.body.alarmtype)) {
      query += ` AND alarm_type = ${req.body.alarmtype}`;
    }
    returnData(query);
  }
}

// 데드타임 조건 (카운트, 데드타임)
// - sum -> max 변경
function deadTimeCondition(req, str, returnData) {
  let query = str;
  if (typeof returnData === 'function') {
    if (!commonModule.common.isEmpty(req.body.count)) {
      if (!commonModule.common.isEmpty(req.body.deadtime)) {
        if (req.body.cntstd === 'over') {
          query += ` AND count(alarm_code) >= ${req.body.count}`;
        } else if (req.body.cntstd === 'below') {
          query += ` AND count(alarm_code) <= ${req.body.count}`;
        }
        if (req.body.dtstd === 'over') {
          query += ` AND max(DT) >= ${req.body.deadtime}`;
        } else if (req.body.dtstd === 'below') {
          query += ` AND max(DT) <= ${req.body.deadtime}`;
        }
      } else if (req.body.cntstd === 'over') {
        query += ` AND count(alarm_code) >= ${req.body.count}`;
      } else if (req.body.cntstd === 'below') {
        query += ` AND count(alarm_code) <= ${req.body.count}`;
      }
    } else if (!commonModule.common.isEmpty(req.body.deadtime)) {
      if (req.body.dtstd === 'over') {
        query += ` AND max(DT) >= ${req.body.deadtime}`;
      } else if (req.body.dtstd === 'below') {
        query += ` AND max(DT) <= ${req.body.deadtime}`;
      }
    }
    returnData(query);
  }
}

// 데드타임 조건 stopday, stopalarm 전용
function deadTimeConditionForStopDayAndAlarm(req, str, returnData) {
  let query = str;
  if (typeof returnData === 'function') {
    if (!commonModule.common.isEmpty(req.body.count)) {
      query += 'HAVING ';
      if (!commonModule.common.isEmpty(req.body.deadtime)) {
        if (req.body.cntstd === 'over') {
          query += ` count(alarm_code) >= ${req.body.count}`;
        } else if (req.body.cntstd === 'below') {
          query += ` count(alarm_code) <= ${req.body.count}`;
        }
        if (req.body.dtstd === 'over') {
          query += ` AND max(DT) >= ${req.body.deadtime}`;
        } else if (req.body.dtstd === 'below') {
          query += ` AND max(DT) <= ${req.body.deadtime}`;
        }
      } else if (req.body.cntstd === 'over') {
        query += ` count(alarm_code) >= ${req.body.count}`;
      } else if (req.body.cntstd === 'below') {
        query += ` count(alarm_code) <= ${req.body.count}`;
      }
    } else if (!commonModule.common.isEmpty(req.body.deadtime)) {
      query += 'HAVING ';
      if (req.body.dtstd === 'over') {
        query += ` max(DT) >= ${req.body.deadtime}`;
      } else if (req.body.dtstd === 'below') {
        query += ` max(DT) <= ${req.body.deadtime}`;
      }
    }
    returnData(query);
  }
}

// 데드타임 조건 (정지알람 월간 용)
function deadTimeConditionForStopAlarmMonth(req, str, returnData) {
  let query = str;
  if (typeof returnData === 'function') {
    if (!commonModule.common.isEmpty(req.body.count)) {
      query += 'HAVING alarm_code IS NOT NULL AND ';
      if (!commonModule.common.isEmpty(req.body.deadtime)) {
        if (req.body.cntstd === 'over') {
          query += ` count(alarm_code) >= ${req.body.count}`;
        } else if (req.body.cntstd === 'below') {
          query += ` count(alarm_code) <= ${req.body.count}`;
        }
        if (req.body.dtstd === 'over') {
          query += ` AND max(DT) >= ${req.body.deadtime}`;
        } else if (req.body.dtstd === 'below') {
          query += ` AND max(DT) <= ${req.body.deadtime}`;
        }
      } else if (req.body.cntstd === 'over') {
        query += ` count(alarm_code) >= ${req.body.count}`;
      } else if (req.body.cntstd === 'below') {
        query += ` count(alarm_code) <= ${req.body.count}`;
      }
    } else if (!commonModule.common.isEmpty(req.body.deadtime)) {
      query += 'HAVING alarm_code IS NOT NULL AND ';
      if (req.body.dtstd === 'over') {
        query += ` max(DT) >= ${req.body.deadtime}`;
      } else if (req.body.dtstd === 'below') {
        query += ` max(DT) <= ${req.body.deadtime}`;
      }
    }
    returnData(query);
  }
}

// The column that alarm case using now.
function alarmCase() {
  if (commonModule.task.getGlobalLanguage() === 'kr') {
    return 'type_name_kr';
  }
  if (commonModule.task.getGlobalLanguage() === 'en') {
    return 'type_name_en';
  }
  if (commonModule.task.getGlobalLanguage() === 'cn') {
    return 'type_name_cn';
  }
}

// alarm type
alarmStatistics.get('/data/alarm/type', (req, res) => {
  const query = `SELECT type_no AS id, type_name_${commonModule.task.getGlobalLanguage()} AS name FROM def_alarm_type`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// renew alarm_type
alarmStatistics.get('/renew/data/alarm/type/:language', (req, res) => {
  const query = `SELECT type_id AS id, type_name_${req.params.language} AS name FROM main.def_alarm_type`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// alarm code
alarmStatistics.post('/data/alarm/code', (req, res) => {
  const query = `SELECT alarm_code AS code FROM his_alarm_list WHERE factory_id = ${
    req.body.factoryid
  } AND time_stamp BETWEEN '${
    req.body.prevtime
  } 00:00:00' AND '${
    req.body.currtime
  } 23:59:59' AND alarm_type <> 1 AND alarm_type <> 2 GROUP by alarm_code ORDER BY alarm_code asc`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

function chartOption(req) {
  let str = ''
  if(req.body.boothid !== undefined){
    str += `and booth_id = ${req.body.boothid}`
  }
  if(req.body.zoneid !== undefined){
    str += `and zone_alarm.zone_id = ${req.body.zoneid}`
  }
  if(req.body.alarmtype !== undefined){
    str += `and type_id = ${req.body.alarmtype}`
  }
  return str
}
// renew chart Day
alarmStatistics.post('/renew/data/chart', (req, res) => {
  const start_time = `${String(req.body.prevtime)} 00:00:00`;
  const end_time = `${String(req.body.currtime)} 23:59:59`;
  let level = "''"
  if(req.body.alarmlevel !== ''){
    level = req.body.alarmlevel
  }
  let query = {
    text: ``,
    values:[
      start_time,
      end_time
    ]
  }
  query.text = `WITH A as (SELECT zone_id, booth_config.booth_id, disp_booth_id FROM main.zone_config INNER JOIN main.booth_config ON booth_config.booth_id = main.zone_config.disp_booth_id) \
  SELECT to_char(update_time, 'YYYY-MM-DD') AS date, count(update_time) FROM main.his_zone_alarm zone_alarm \
  INNER JOIN A ON A.zone_id = zone_alarm.zone_id\
  WHERE update_time between $1 and $2 and warning = false and status = 1 and level in (${level})${chartOption(req)}\
  GROUP BY date`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// chart Day
// select문에 process, alarm_type 제거, avg -> max 변경
alarmStatistics.post('/data/chart/day', (req, res) => {
  const query = `WITH tt AS(\
            WITH t AS (\
                SELECT \
                to_char(time_stamp, 'YYYY-MM-DD') AS date,\
                alarm_code, \
                ROUND(COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0)) AS DT \
                FROM \
                his_alarm_list \
                WHERE \
                alarm_type <> 1 \
                AND alarm_status = 1 \
                AND alarm_type <> 2 \
                AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
            += ') SELECT date, alarm_code, count(alarm_code), max(DT) AS DT FROM t GROUP BY date, alarm_code HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
                += `) SELECT tmp.date, COALESCE(SUM(tt.COUNT)) AS count, COALESCE(MAX(tt.dt)) AS dt FROM tt \
                FULL OUTER JOIN (SELECT to_char('${
  req.body.prevtime
}'::date + gs.id, 'YYYY-MM-DD') AS date, 0 count, 0 dt from generate_series(0,${
  req.body.daycount
}) gs(id)) AS tmp ON tmp.date = tt.date GROUP BY tmp.DATE ORDER BY DATE ASC`;
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// chart weekend
alarmStatistics.post('/data/chart/weekend', (req, res) => {
  const query = `WITH tt AS(\
            WITH t AS (\
                SELECT \
                (to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)') AS date, \
                alarm_code, \
                ROUND(COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0)) AS DT \
                FROM \
                his_alarm_list \
                WHERE \
                alarm_type <> 1 \
                AND alarm_status = 1 \
                AND alarm_type <> 2 \
                AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
            += ') SELECT date, alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
                += `) SELECT tmp.date, SUM(tt.COUNT) AS count, max(tt.dt) AS dt FROM tt \
                FULL OUTER JOIN (select (to_char('${
  req.body.prevtime
}'::date  + gs.id,'YYYY-MM') || ' ' || to_char( ('${
  req.body.prevtime
}'::date  + gs.id)::date, 'w' ) || '(w)' ) AS DATE, 0 count, 0 dt from generate_series(0,${
  req.body.daycount
}) gs(id)) as tmp ON tmp.date = tt.date GROUP BY tmp.date ORDER BY tmp.date asc`;
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// chart month
alarmStatistics.post('/data/chart/month', (req, res) => {
  const query = `WITH tt AS(\
            WITH t AS (\
                SELECT \
                (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, \
                alarm_code, \
                ROUND(COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0)) AS DT \
                FROM his_alarm_list \
                WHERE \
                alarm_type <> 1 \
                AND alarm_status = 1 \
                AND alarm_type <> 2 \
                AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
            += ') SELECT date, alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
                += `) SELECT tmp.date, SUM ( tt.COUNT ) AS COUNT, MAX ( tt.dt ) AS dt  \
                FROM \
                tt \
                FULL OUTER JOIN (\
                    select \
                    (to_char('${
  req.body.prevtime
}'::date  + gs.id,'YYYY-MM') || '(m)' ) AS DATE, \
                    0 count,\
                    0 dt \
                    from \
                    generate_series(0,${
  req.body.daycount
}) gs(id)) as tmp ON tmp.date = tt.date GROUP BY tmp.DATE ORDER BY DATE ASC`;
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 최다 알람 발생일 DAY
// process, alarm_type제거
// count(date) -> sum(count)
// sum -> max
alarmStatistics.post('/data/gridtable/statistics/alarmdate/day', (req, res) => {
  const query = `WITH tt AS(WITH t AS (SELECT to_char(time_stamp, 'YYYY-MM-DD') as date, \
     alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) as DT FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status =1 AND alarm_type <> 2 and factory_id = '${
  req.body.factoryid
}' and time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2 += ') SELECT date, sum(count) as count FROM tt GROUP BY date ORDER BY sum(count) desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 최다 알람 발생일 WEEKEND
alarmStatistics.post('/data/gridtable/statistics/alarmdate/weekend', (req, res) => {
  const query = `WITH tt AS(WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)') as date, \
    alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) as DT FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status =1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2 += ') SELECT date, sum(count) as count FROM tt GROUP BY date ORDER BY sum(count) desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 최다 알람 발생일 MONTH
alarmStatistics.post('/data/gridtable/statistics/alarmdate/month', (req, res) => {
  const query = `WITH tt AS(WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') as date, booth_id as process, alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) as DT, alarm_type FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status = 1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2 += ') SELECT date, sum(count) as count FROM tt GROUP BY date ORDER BY sum(count) desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 최다 발생 알람명 DAY
alarmStatistics.post('/data/gridtable/statistics/alarmname/day', (req, res) => {
  const query = `SELECT def_zone_config.zone_id, def_zone_config.zone_name, def_robot_config.robot_id, def_robot_config.robot_name, alarm_code, alarm_type, alarm_name, def_alarm_type.type_name_kr as alarm_type_name, sum \
    FROM (WITH tt AS( \
    WITH t AS (SELECT zone_id, alarm_name, alarm_type, to_char(time_stamp, 'YYYY-MM-DD') as date, alarm_code, robot_id ,\
    COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) as DT FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status = 1 AND alarm_type <> 2 and \
    factory_id = '${
  req.body.factoryid
}' and time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT zone_id, alarm_name, robot_id , date, alarm_type, alarm_code, count(alarm_code), max(DT) as DT FROM t GROUP BY zone_id, robot_id , alarm_name, date, alarm_code, alarm_type HAVING date Is Not NULL ';
    deadTimeCondition(req, result1, (result2) => {
      result2 += ') SELECT zone_id, robot_id , alarm_name, alarm_code, alarm_type, sum(count) AS sum FROM tt GROUP BY zone_id, robot_id , alarm_name, alarm_code, alarm_type ORDER BY sum(count) desc '; // count(date) -> sum(count)
      result2 += ')T left outer JOIN def_robot_config ON T.robot_id = def_robot_config.robot_id INNER JOIN def_zone_config ON T.zone_id = def_zone_config.zone_id INNER JOIN def_alarm_type ON T.alarm_type = def_alarm_type.type_no'
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

//renew 알람 발생명 (존 알람)
alarmStatistics.post('/renew/zone/data/gridtable/statistics/alarmname', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let level = "''"
  if(req.body.alarmlevel !== ''){
    level = req.body.alarmlevel
  }

  let query = {
    text: `SELECT * FROM (\
      SELECT zone_config.booth_id, zone_config.disp_booth_id, his_zone_alarm.zone_id, zone_config.zone_name, status, his_zone_alarm.type_id, \
      alarm_type.type_name_${req.body.language} as alarm_type_name, contents as alarm_name, code as alarm_code, count(code) as sum, level, warning FROM main.his_zone_alarm \
      INNER JOIN main.zone_config zone_config ON zone_config.zone_id = his_zone_alarm.zone_id \
      INNER JOIN main.def_alarm_type alarm_type ON alarm_type.type_id = his_zone_alarm.type_id\
      WHERE update_time BETWEEN $1 and $2\
      GROUP BY booth_id, disp_booth_id, his_zone_alarm.zone_id, zone_config.zone_name, his_zone_alarm.type_id, alarm_type.type_name_${req.body.language}, contents, code, status, warning, level\
    )t WHERE status = 1 and warning = false and level in (${level})`,
    values: [
      start_time,
      end_time,
    ]
  }
  if (req.body.zoneid != undefined) {
    query.text += ` and zone_id = ${req.body.zoneid}`;
  }
  if (req.body.boothid != undefined) {
    query.text += ` and disp_booth_id = ${req.body.boothid}`;
  }
  if(req.body.alarmtype != undefined){
    query.text += `and type_id = ${req.body.alarmtype}`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 최다 발생 알람명 WEEKEND
alarmStatistics.post('/data/gridtable/statistics/alarmname/weekend', (req, res) => {
  const query = `WITH tt AS( WITH t AS (SELECT alarm_type, (to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)') as date, \
    alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) as DT FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status = 1 AND alarm_type <> 2  AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,alarm_code, alarm_type, count(alarm_code), max(DT) as DT FROM t GROUP BY date, alarm_code, alarm_type HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ') SELECT alarm_code, alarm_type, sum(count) AS sum FROM tt GROUP BY alarm_code, alarm_type ORDER BY sum(count) desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 최다 발생 알람명 MONTH
alarmStatistics.post('/data/gridtable/statistics/alarmname/month', (req, res) => {
  const query = `WITH tt AS( WITH t AS (SELECT alarm_type, (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, \
    alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT FROM his_alarm_list \
    WHERE alarm_type <> 1 AND alarm_status =1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date, alarm_code, alarm_type, count(alarm_code), sum(DT) as DT FROM t GROUP BY date, alarm_code, alarm_type HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ') SELECT alarm_code, alarm_type, sum(count) AS sum FROM tt GROUP BY alarm_code, alarm_type ORDER BY sum(count) desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 일간 최장 정지 발생일
alarmStatistics.post('/data/gridtable/statistics/stopday/day', (req, res) => {
  const query = `WITH t AS (\
        SELECT \
        to_char(time_stamp, 'YYYY-MM-DD') AS date, \
        alarm_code, \
        COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT \
        FROM \
        his_alarm_list \
        WHERE \
        alarm_type <> 1 AND alarm_status = 1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date, ROUND(MAX(DT)) AS DT FROM t GROUP BY date HAVING date Is Not NULL ';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ' ORDER BY dt DESC LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 주간 최장 정지 발생일
alarmStatistics.post('/data/gridtable/statistics/stopday/weekend', (req, res) => {
  const query = `WITH t AS (\
        SELECT \
        (to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)') AS date, \
        alarm_code, \
        COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT \
        FROM \
        his_alarm_list \
        WHERE alarm_type <> 1 AND alarm_status =1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date, ROUND(MAX(DT)) AS DT FROM t GROUP BY date HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ' ORDER BY dt DESC LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 월간 최장 정지 발생일
alarmStatistics.post('/data/gridtable/statistics/stopday/month', (req, res) => {
  const query = `WITH t AS (\
        SELECT \
        (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, \
        alarm_code, \
        COALESCE(EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT \
        FROM \
        his_alarm_list \
        WHERE alarm_type <> 1 AND alarm_status = 1 AND alarm_type <> 2 AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date, ROUND(MAX(DT)) AS DT FROM t GROUP BY date HAVING date Is Not NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ' ORDER BY dt desc LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 일간 최장 정지 알람명
alarmStatistics.post('/data/gridtable/statistics/stopalarm/day', (req, res) => {
  const query = `WITH T AS (\
        SELECT \
        alarm_code,\
        alarm_type, \
        COALESCE(EXTRACT(EPOCH FROM(update_time - time_stamp)) /60, 0) AS DT\
        FROM \
        his_alarm_list \
        WHERE \
        alarm_type NOT IN(1, 2) AND alarm_status = 1 \
        AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT alarm_code, alarm_type, ROUND(MAX(DT)) AS DT FROM T GROUP BY alarm_code, alarm_type ';
    deadTimeConditionForStopDayAndAlarm(req, result1, (result2) => {
      result2
                += ' ORDER BY dt DESC LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 주간 최장 정지 알람명
alarmStatistics.post('/data/gridtable/statistics/stopalarm/weekend', (req, res) => {
  const query = `WITH T AS (\
        SELECT \
        alarm_code, \
        alarm_type, \
        ROUND(COALESCE(EXTRACT(EPOCH FROM(update_time - time_stamp)) /60, 0)) AS DT \
        FROM \
        his_alarm_list \
        WHERE \
        alarm_type NOT IN(1, 2) \
        AND alarm_status = 1 \
        AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
            += ') SELECT alarm_code, alarm_type, MAX(DT) AS DT FROM T GROUP BY alarm_code, alarm_type ';
    deadTimeConditionForStopDayAndAlarm(req, result1, (result2) => {
      result2
                += ' ORDER BY MAX(dt) DESC LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 월간 최장 정지 알람명
alarmStatistics.post('/data/gridtable/statistics/stopalarm/month', (req, res) => {
  const query = `WITH T AS (\
        SELECT \
        alarm_code, \
        alarm_type, \
        COALESCE(EXTRACT(EPOCH FROM(update_time - time_stamp)) /60, 0) AS DT \
        FROM \
        his_alarm_list \
        WHERE \
        alarm_type NOT IN(1, 2) \
        AND alarm_status = 1 \
        AND factory_id = ${
  req.body.factoryid
} AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59'`;
  alarmCondition(req, query, (result1) => {
    result1
                += ') SELECT alarm_code, alarm_type, ROUND(MAX(DT)) AS DT FROM T GROUP BY alarm_code, alarm_type ';
    deadTimeConditionForStopAlarmMonth(req, result1, (result2) => {
      result2
                    += ' ORDER BY MAX(dt) DESC LIMIT 5';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 알람 정보 DAY
alarmStatistics.post('/data/gridtable/alarm/day', (req, res) => {
  const query = `WITH tt AS( WITH t AS (SELECT to_char(time_stamp, 'YYYY-MM-DD') AS date,  booth_id AS process  , \
    alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT,alarm_type , \
    case \
    when alarm_type = 0 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 0) \
    when alarm_type = 2 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 2) \
    when alarm_type = 3 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 3) \
    when alarm_type = 4 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 4) \
    end as alarmcase \
    FROM his_alarm_list WHERE alarm_type <> 1 AND alarm_type <> 2 \
    AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59' `;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,process,alarm_code, alarm_type, count(alarm_code), max(DT) as DT ,alarmcase  FROM t GROUP BY date, alarm_code,alarm_type,process ,alarmcase  HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
        += ') SELECT date, alarm_type, alarm_code, sum(count) AS count, max(dt) AS dt ,alarmcase  FROM tt GROUP BY date, alarm_code, alarm_type, alarmcase  ORDER BY date asc, alarm_code';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 알람 정보 WEEKEND
alarmStatistics.post('/data/gridtable/alarm/weekend', (req, res) => {
  const query = `WITH tt AS( WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)') AS date, \
    booth_id AS process  , alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT, alarm_type, \
    case \
    when alarm_type = 0 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 0) \
    when alarm_type = 2 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 2) \
    when alarm_type = 3 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 3) \
    when alarm_type = 4 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 4) \
    end as alarmcase \
    FROM his_alarm_list WHERE alarm_type <> 1 AND alarm_type <> 2 \
    AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime
} 23:59:59' `;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,process,alarm_code, alarm_type, count(alarm_code), max(DT) as DT ,alarmcase  FROM t GROUP BY date, alarm_code,alarm_type,process ,alarmcase  HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
            += ') SELECT date, alarm_type, alarm_code, sum(count) AS count, max(dt) AS dt ,alarmcase  FROM tt GROUP BY date, alarm_code, alarm_type, alarmcase  ORDER BY date asc, alarm_code;';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 알람 정보 MONTH
alarmStatistics.post('/data/gridtable/alarm/month', (req, res) => {
  const query = `WITH tt AS( WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date,  booth_id AS process, \
    alarm_code, COALESCE( EXTRACT(epoch FROM (update_time - time_stamp))/60, 0) AS DT, alarm_type, \
    case \
    when alarm_type = 0 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 0) \
    when alarm_type = 2 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 2) \
    when alarm_type = 3 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 3) \
    when alarm_type = 4 then (select ${
  alarmCase()
} from def_alarm_type where type_no = 4) \
    end as alarmcase \
    FROM his_alarm_list WHERE alarm_type <> 1 AND alarm_type <> 2 \
    AND factory_id = '${
  req.body.factoryid
}' AND time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00'  AND '${
  req.body.currtime
} 23:59:59' `;
  alarmCondition(req, query, (result1) => {
    result1
        += ') SELECT date,process,alarm_code, alarm_type, count(alarm_code), max(DT) as DT ,alarmcase  FROM t GROUP BY date, alarm_code,alarm_type,process ,alarmcase  HAVING date IS NOT NULL';
    deadTimeCondition(req, result1, (result2) => {
      result2
        += ') SELECT date, alarm_type, alarm_code, sum(count) AS count, max(dt) AS dt ,alarmcase  FROM tt GROUP BY date, alarm_code, alarm_type, alarmcase  ORDER BY date asc, alarm_code;';
      commonModule.mainDB.execute(result2, req.session.spsid, res);
    });
  });
});

// 알람 정보 전체 조회
alarmStatistics.post('/data/gridtable', (req, res) => {
  const start_time = `${String(req.body.prevtime)} 00:00:00`;
  const end_time = `${String(req.body.currtime)} 23:59:59`;
  let query = {
    text: `SELECT to_char(time_stamp::timestamp, 'YYYY-MM-DD HH24:MI:SS')AS time_stamp, his_alarm_list.zone_id, def_alarm_type.type_name_kr AS alarm_type_name, \
    his_alarm_list.alarm_code, \
    his_alarm_list.alarm_name, his_alarm_list.alarm_type, \
    def_zone_config.zone_name , his_alarm_list.robot_id, def_robot_config.robot_name FROM his_alarm_list left outer JOIN def_robot_config on \
    def_robot_config.factory_id = his_alarm_list.factory_id and def_robot_config.booth_id = his_alarm_list.booth_id AND \
    def_robot_config.zone_id = his_alarm_list.zone_id AND def_robot_config.robot_id = his_alarm_list.robot_id INNER JOIN \
    def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id AND his_alarm_list.booth_id = def_booth_config.booth_id \
    inner join def_zone_config on his_alarm_list.factory_id = def_zone_config.factory_id AND his_alarm_list.booth_id = \
    def_zone_config.booth_id and his_alarm_list.zone_id = def_zone_config.zone_id INNER JOIN def_alarm_type ON his_alarm_list.alarm_type = def_alarm_type.type_no \
    WHERE his_alarm_list.factory_id = ${req.body.factoryid} AND his_alarm_list.time_stamp BETWEEN $1 AND $2`,
    values: [
      start_time,
      end_time
    ]
  }
  if (req.body.boothid != undefined) {
    query.text
        += ` and his_alarm_list.booth_id = ${
        req.body.boothid}`;
  }
  if (req.body.zoneid != undefined) {
    query.text
        += ` and his_alarm_list.zone_id = ${
        req.body.zoneid}`;
  }
  if (req.body.robotid != undefined) {
    query.text
        += ` and his_alarm_list.robot_id = ${
        req.body.robotid}`;
  }
  if(req.body.alarmtype != undefined) {
    query.text
      += ` and his_alarm_list.alarm_type = ${
      req.body.alarmtype}`;
  }

  if(req.body.alarmcode != undefined){
    query.text
      += ` and his_alarm_list.alarm_code NOT IN(${
      req.body.alarmcode
    })`;
  }
  if(req.body.alarmtype != 0){
    if(req.body.alarmlevelcodes != undefined && req.body.alarmlevelcodes != ''){
      query.text
        += `and his_alarm_list.alarm_code IN(${
          req.body.alarmlevelcodes
        })`
    }
    if(req.body.alarmlevelzones != undefined && req.body.alarmlevelzones != ''){
      query.text
        += `and his_alarm_list.zone_id IN(${
          req.body.alarmlevelzones
        })`
    }
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// renew 존 알람 전체 조회
alarmStatistics.post('/renew/zone/data/gridtable', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let level = "''"
  if(req.body.alarmlevel !== ''){
    level = req.body.alarmlevel
  }
  
  let query = {
    text:
    `SELECT * FROM (\
      SELECT to_char(update_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')as time_stamp, status, zone_config.booth_id, level, zone_config.disp_booth_id,\
      his_zone_alarm.zone_id, his_zone_alarm.alarm_id, zone_config.zone_name, his_zone_alarm.type_id, alarm_type.type_name_${req.body.language} as alarm_type_name, contents as alarm_name, code as alarm_code, his_zone_alarm.warning , job_name, spc_code \
      FROM main.his_zone_alarm INNER JOIN main.zone_config zone_config ON zone_config.zone_id = his_zone_alarm.zone_id \
      INNER JOIN main.def_alarm_type alarm_type ON alarm_type.type_id = his_zone_alarm.type_id ORDER BY update_time)T \
      WHERE status = 1 AND warning = false AND time_stamp BETWEEN $1 AND $2 AND level IN (${level})`,
    values : [
      start_time,
      end_time,
    ]
  }
  if (req.body.zoneid != undefined) {
    query.text += ` AND zone_id = ${req.body.zoneid}`;
  }
  if(req.body.boothid != undefined){
    query.text += ` AND disp_booth_id = ${req.body.boothid}`;
  }
  if(req.body.alarmtype != undefined){
    query.text += `AND type_id = ${req.body.alarmtype}`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

//renew 로봇 알람 전체 조회
alarmStatistics.post('/renew/robot/data/gridtable', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let query = {
    text:
    `SELECT alarm_id, disp_alarm_axis, job_name, axis_info, booth_id, disp_booth_id, zone_name, zone_id, robot_name, robot_id, code as alarm_code, contents as alarm_name, type_id, type_name_${req.body.language} as alarm_type_name , \
    to_char(update_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')as time_stamp, step_no, level \
    FROM (\
      SELECT zone_config.booth_id, zone_config.disp_booth_id, zone_config.zone_name, T.zone_id, alarm_id, disp_alarm_axis, job_name, axis_info, robot_name, robot_id, code, contents, type_id, type_name_${req.body.language}, update_time, step_no, level FROM ( \
        SELECT his_robot_alarm.alarm_id, his_robot_alarm.disp_alarm_axis, job_name, axis_info, robot_config.zone_id, robot_config.robot_name, his_robot_alarm.robot_id, code, name as contents, his_robot_alarm.type_id, \
        alarm_type.type_name_${req.body.language}, update_time, step_no, level FROM main.his_robot_alarm \
        INNER JOIN main.robot_config robot_config ON robot_config.robot_id = his_robot_alarm.robot_id \
        INNER JOIN main.def_alarm_type alarm_type ON alarm_type.type_id = his_robot_alarm.type_id )T \
      INNER JOIN main.zone_config zone_config ON zone_config.zone_id = T.zone_id \
      GROUP BY zone_config.booth_id, zone_config.disp_booth_id, zone_config.zone_name, T.zone_id, alarm_id, disp_alarm_axis, job_name, axis_info, robot_name, robot_id, code, contents, type_id, type_name_${req.body.language}, update_time , step_no, level)TT \
    WHERE update_time BETWEEN $1 AND $2 `,
    values: [
      start_time,
      end_time
    ]
  }
  if (req.body.zoneid != undefined) {
    query.text += ` AND zone_id = ${req.body.zoneid}`;
  }
  if(req.body.boothid != undefined){
    query.text += ` AND disp_booth_id = ${req.body.boothid}`;
  }
  if(req.body.alarmtype != undefined){
    query.text += `AND type_id = ${req.body.alarmtype}`
  }
  if(req.body.robotid != undefined) {
    query.text += `AND robot_id = ${req.body.robotid}`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

//로봇 알람 전체 조회
alarmStatistics.post('/robot/alarm/data/gridtable', (req, res) => {
  const start_time = `${String(req.body.prevtime)} 00:00:00`;
  const end_time = `${String(req.body.currtime)} 23:59:59`;
  let query = {
    text: `SELECT to_char(his_alarm_list.time_stamp, 'YYYY-MM-DD HH24:MM:SS')as time_stamp, his_alarm_list.zone_id, def_alarm_type.type_name_kr AS alarm_type_name, \
    his_alarm_list.alarm_code, \
    his_alarm_list.alarm_name, his_alarm_list.alarm_type, \
    def_zone_config.zone_name , def_robot_config.robot_name, his_alarm_list.robot_id FROM his_alarm_list left outer JOIN def_robot_config on \
    def_robot_config.factory_id = his_alarm_list.factory_id and def_robot_config.booth_id = his_alarm_list.booth_id AND \
    def_robot_config.zone_id = his_alarm_list.zone_id AND def_robot_config.robot_id = his_alarm_list.robot_id INNER JOIN \
    def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id AND his_alarm_list.booth_id = def_booth_config.booth_id \
    inner join def_zone_config on his_alarm_list.factory_id = def_zone_config.factory_id AND his_alarm_list.booth_id = \
    def_zone_config.booth_id and his_alarm_list.zone_id = def_zone_config.zone_id INNER JOIN def_alarm_type ON his_alarm_list.alarm_type = def_alarm_type.type_no \
    WHERE his_alarm_list.time_stamp BETWEEN $1 AND $2 and alarm_type = 0`,
    values: [
      start_time,
      end_time
    ]
  }
  if (req.body.boothid != undefined) {
    query.text
        += ` and his_alarm_list.booth_id = ${
        req.body.boothid}`;
  }
  if (req.body.zoneid != undefined) {
    query.text
        += ` and his_alarm_list.zone_id = ${
        req.body.zoneid}`;
  }
  if (req.body.robotid != undefined) {
    query.text
        += ` and his_alarm_list.robot_id = ${
        req.body.robotid}`;
  }
  if(req.body.alarmtype != undefined) {
    query.text
      += ` and his_alarm_list.alarm_type = ${
      req.body.alarmtype}`;
  }

  if(req.body.alarmcode != undefined){
    query.text
      += ` and his_alarm_list.alarm_code NOT IN(${
      req.body.alarmcode
    })`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

//renew 로봇 알람명 조회 (발생 알람명)
alarmStatistics.post('/renew/robot/data/gridtable/statistics/alarmname', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let query = {
    text:
    `WITH T AS (\
      SELECT zone_config.zone_id, zone_config.zone_name, zone_config.booth_id, zone_config.disp_booth_id FROM main.zone_config \
    )\
    SELECT T.zone_name, T.booth_id, T.disp_booth_id, A.zone_id, A.robot_name, A.robot_id, A.code as alarm_code, A.name as alarm_name, A.type_id, \
    A.type_name_${req.body.language} as alarm_type_name, A.sum FROM (\
      SELECT robot_config.zone_id, robot_config.robot_name, his_robot_alarm.robot_id, code, name,\
        his_robot_alarm.type_id, alarm_type.type_name_${req.body.language}, count(code) as sum FROM main.his_robot_alarm \
        INNER JOIN main.robot_config robot_config ON robot_config.robot_id = his_robot_alarm.robot_id \
        INNER JOIN main.def_alarm_type alarm_type ON alarm_type.type_id = his_robot_alarm.type_id \
        WHERE update_time BETWEEN $1 and $2 \
        GROUP BY robot_config.zone_id, robot_name, his_robot_alarm.robot_id, code, name, his_robot_alarm.type_id, type_name_${req.body.language}\
    )A INNER JOIN T ON T.zone_id = A.zone_id WHERE T.zone_id = A.zone_id`,
    values: [
      start_time,
      end_time,
    ]
  }
  if (req.body.zoneid != undefined) {
    query.text += ` AND A.zone_id = ${req.body.zoneid}`;
  }
  if(req.body.boothid != undefined){
    query.text += ` AND disp_booth_id = ${req.body.boothid}`;
  }
  if(req.body.robotid != undefined){
    query.text += ` AND robot_id = ${req.body.robotid}`
  }
  if(req.body.alarmtype != undefined){
    query.text += ` AND type_id = ${req.body.alarmtype}`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
// 로봇 알람명 조회(발생 알람명)
alarmStatistics.post('/robot/alarm/data', (req, res) => {
  const start_time = `${String(req.body.prevtime)} 00:00:00`;
  const end_time = `${String(req.body.currtime)} 23:59:59`;
  let query = {
    text: `SELECT alarm_code, alarm_name, alarm_type, count(alarm_code) as sum , alarm_type_name , zone_id, zone_name , robot_name from ( \
      SELECT to_char(his_alarm_list.time_stamp, 'YYYY-MM-DD HH24:MM:SS')AS time_stamp, his_alarm_list.zone_id, def_alarm_type.type_name_kr AS alarm_type_name, \
        his_alarm_list.alarm_code, his_alarm_list.alarm_name, his_alarm_list.alarm_type, \
        def_zone_config.zone_name, his_alarm_list.robot_id, def_robot_config.robot_name FROM his_alarm_list left outer JOIN def_robot_config on \
        def_robot_config.factory_id = his_alarm_list.factory_id and def_robot_config.booth_id = his_alarm_list.booth_id AND \
        def_robot_config.zone_id = his_alarm_list.zone_id AND def_robot_config.robot_id = his_alarm_list.robot_id INNER JOIN \
        def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id AND his_alarm_list.booth_id = def_booth_config.booth_id \
        inner join def_zone_config on his_alarm_list.factory_id = def_zone_config.factory_id AND his_alarm_list.booth_id = \
        def_zone_config.booth_id and his_alarm_list.zone_id = def_zone_config.zone_id INNER JOIN def_alarm_type ON his_alarm_list.alarm_type = def_alarm_type.type_no \
       WHERE his_alarm_list.time_stamp BETWEEN $1 AND $2 and his_alarm_list.alarm_type = 0`,
    values: [
      start_time,
      end_time
    ]
  }
  if (req.body.boothid != undefined) {
    query.text
        += ` and his_alarm_list.booth_id = ${
        req.body.boothid}`;
  }
  if (req.body.zoneid != undefined) {
    query.text
        += ` and his_alarm_list.zone_id = ${
        req.body.zoneid}`;
  }
  if (req.body.robotid != undefined) {
    query.text
        += ` and his_alarm_list.robot_id = ${
        req.body.robotid}`;
  }
  if(req.body.alarmtype != undefined) {
    query.text
      += ` and his_alarm_list.alarm_type = ${
      req.body.alarmtype}`;
  }

  if(req.body.alarmcode != undefined){
    query.text
      += ` and his_alarm_list.alarm_code NOT IN(${
      req.body.alarmcode
    })`;
  }
  query.text += ')T group by alarm_code, alarm_name, alarm_type, alarm_code, alarm_type_name, zone_id, zone_name, robot_id, robot_name';
  commonModule.mainDB.execute(query, req.session.spsid, res);
})


// 설정 알람 리스트 등록 수정
alarmStatistics.post('/zone/:zoneid/file/alarm/data', (req, res) => {
  const query = {
    text: `UPDATE def_zone_config SET alarm_list = $1 WHERE zone_id = $2 `,
    values: [
      req.body.alarm_list,
      req.params.zoneid,
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})
// renew 알람 리스트 등록 수정
alarmStatistics.post('/renew/file/alarm/data', (req, res) => {
  const query = {
    text: `UPDATE main.zone_config SET alarm_list = $1 WHERE zone_id = $2 `,
    values: [
      req.body.alarmlist,
      req.body.zoneid,
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 설정 alarmlist 조회
alarmStatistics.get('/zone/:zoneid/file/alarm/data', async(req, res) => {
  let query
  if(req.params.zoneid !== 'null'){
    query = `SELECT alarm_list FROM def_zone_config WHERE zone_id = ${req.params.zoneid}`
  }else{
    query = `SELECT zone_config.alarm_list, zone_config.zone_id, zone_config.zone_name \
      FROM def_zone_config zone_config INNER JOIN his_alarm_list alarm_list ON alarm_list.zone_id = zone_config.zone_id \
      WHERE alarm_list is not null GROUP BY zone_config.alarm_list, zone_config.zone_id, zone_config.zone_name`
  }
        commonModule.mainDB.execute(query, req.session.spsid, res);
})
// renew 설정 alarmlist 조회
alarmStatistics.get('/renew/zone/:zoneid/file/alarm/data', async(req, res) => {
  const query = `SELECT alarm_list FROM main.zone_config WHERE zone_id = ${req.params.zoneid}`
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

