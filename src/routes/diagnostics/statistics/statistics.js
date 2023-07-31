/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const statistics = express.Router();
export { statistics };
const bodyParser = require('body-parser');
const commonModule = require('../../app');

// {localhost:port}/diagnostics/alarmstatistics/data/gridtable/statistics/{::service}
statistics.use(bodyParser.urlencoded({ extended: true }));
statistics.use(bodyParser.json());

statistics.get('/', (req, res) => {
  res.status(200).send('Statistics');
});

// 코드 별 알람 발생
function codealarmQuery(request) {
  let query;
  if (request.body.date === 'day') {
    query = `SELECT alarm_code AS alarmcode, count(*) AS count FROM his_alarm_list \
            WHERE alarm_type not in (2,1) AND time_stamp > '${
  request.body.alarmdate
} 00:00:00' AND time_stamp < '${
  request.body.alarmdate
} 23:59:59' `;
    // eslint-disable-next-line max-len
    if (!commonModule.common.isEmpty(request.body.boothid) && !commonModule.common.isEmpty(request.body.zoneid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid
        } AND zone_id = ${
          request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.boothid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid}`;
    } else if (!commonModule.common.isEmpty(request.body.zoneid)) {
      query += ` AND zone_id = ${
        request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += ' GROUP BY alarm_code order by count(*) desc limit 5';
  } else if (request.body.date === 'weekend') {
    query = `WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM' ) || ' ' || to_char(time_stamp, 'w' ) || '(w)' ) AS DATE, \
        alarm_code FROM his_alarm_list WHERE alarm_type not in (2,1) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00'`;
    if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += `) SELECT alarm_code AS alarmcode, count(*) FROM t WHERE date = '${
      request.body.alarmdate
    }' GROUP BY alarm_code ORDER BY count desc limit 5`;
  } else if (request.body.date === 'month') {
    query = `WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, \
        alarm_code FROM his_alarm_list WHERE alarm_type not in (2,1) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00'`;
    if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += `) SELECT alarm_code AS alarmcode, count(*) FROM t WHERE date = '${
      request.body.alarmdate
    }' GROUP BY alarm_code ORDER BY count desc limit 5`;
  }
  return query;
}

// 알람 종류 별 알람 발생
function alarmeventQuery(request) {
  let query;
  if (request.body.date === 'day') {
    query = `SELECT (SELECT type_name_${commonModule.task.getGlobalLanguage()} from def_alarm_type WHERE type_no = alarm_type ) AS code , \
            count(*) AS count FROM his_alarm_list WHERE alarm_type not in (2,1) AND time_stamp > '${
  request.body.alarmdate
} 00:00:00' AND time_stamp < '${
  request.body.alarmdate
} 23:59:59' `;
    // eslint-disable-next-line max-len
    if (!commonModule.common.isEmpty(request.body.boothid) && !commonModule.common.isEmpty(request.body.zoneid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid
        } AND zone_id = ${
          request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.boothid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid}`;
    } else if (!commonModule.common.isEmpty(request.body.zoneid)) {
      query += ` AND zone_id = ${
        request.body.zoneid}`;
    }
    query += ' GROUP BY alarm_type ORDER BY count(*) desc limit 5';
  } else if (request.body.date === 'weekend') {
    query = `WITH t AS (SELECT(to_char(time_stamp, 'YYYY-MM') || ' ' || to_char(time_stamp, 'w') || '(w)') AS DATE, \
        time_stamp, update_time, alarm_code, (SELECT type_name_${commonModule.task.getGlobalLanguage()
} FROM def_alarm_type WHERE type_no = alarm_type) AS code FROM his_alarm_list \
        WHERE alarm_type NOT IN ( 2, 1 ) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00') SELECT code,count(*) FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY code ORDER BY count desc limit 5`;
  } else if (request.body.date === 'month') {
    query = `WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, (SELECT type_name_${commonModule.task.getGlobalLanguage()
    } FROM def_alarm_type WHERE type_no = alarm_type) AS code FROM his_alarm_list \
        WHERE alarm_type NOT IN ( 2, 1 ) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00') SELECT code, count(*) FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY code ORDER BY count desc limit 5`;
  }
  return query;
}

// 코드 별 정지 시간
function codestopQuery(request) {
  let query;
  if (request.body.date === 'day') {
    query = `SELECT max(extract(epoch from (update_time - time_stamp) / 60  )) AS count, \
            alarm_code AS alarmcode FROM his_alarm_list  WHERE alarm_type not in (2,1) AND time_stamp > '${
  request.body.alarmdate
} 00:00:00'  AND time_stamp < '${
  request.body.alarmdate
} 23:59:59' `;
    // eslint-disable-next-line max-len
    if (!commonModule.common.isEmpty(request.body.boothid) && !commonModule.common.isEmpty(request.body.zoneid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid
        } AND zone_id = ${
          request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.boothid)) {
      query
                += ` AND booth_id = ${
          request.body.boothid}`;
    } else if (!commonModule.common.isEmpty(request.body.zoneid)) {
      query += ` AND zone_id = ${
        request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += ' GROUP BY alarm_code ORDER BY count desc limit 5';
  } else if (request.body.date === 'weekend') {
    query = `WITH t AS (SELECT(to_char(time_stamp, 'YYYY-MM') || ' ' || to_char(time_stamp, 'w') || '(w)') AS DATE, \
        time_stamp, update_time, alarm_code FROM his_alarm_list \
        WHERE alarm_type NOT IN(2, 1) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00'`;
    if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += `) SELECT alarm_code AS alarmcode, max(extract(epoch FROM(update_time - time_stamp) / 60)) AS count \
        FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY alarm_code ORDER BY count desc limit 5`;
  } else if (request.body.date === 'month') {
    query = `WITH t AS (SELECT(to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, time_stamp, update_time, alarm_code FROM his_alarm_list \
        WHERE alarm_type NOT IN ( 2, 1 ) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00'`;
    if (!commonModule.common.isEmpty(request.body.alarmtype)) {
      query += ` AND alarm_type = ${
        request.body.alarmtype}`;
    }
    query += `) SELECT alarm_code AS alarmcode, max(extract(epoch FROM (update_time - time_stamp) / 60  )) AS count \
        FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY alarm_code ORDER BY count desc limit 5`;
  }
  return query;
}

function alarmstopQuery(request) {
  let query;
  if (request.body.date === 'day') {
    query = `select max(extract(epoch from (update_time - time_stamp) / 60)) as count, \
        (SELECT type_name_${commonModule.task.getGlobalLanguage()} from def_alarm_type WHERE type_no = alarm_type ) AS code from his_alarm_list  where alarm_type not in (2,1) and time_stamp > '${
  request.body.alarmdate
} 00:00:00' and time_stamp < '${
  request.body.alarmdate
} 23:59:59' `;
    // eslint-disable-next-line max-len
    if (!commonModule.common.isEmpty(request.body.boothid) && !commonModule.common.isEmpty(request.body.zoneid)) {
      query
            += ` AND booth_id = ${
          request.body.boothid
        } AND zone_id = ${
          request.body.zoneid}`;
    } else if (!commonModule.common.isEmpty(request.body.boothid)) {
      query
            += ` AND booth_id = ${
          request.body.boothid}`;
    } else if (!commonModule.common.isEmpty(request.body.zoneid)) {
      query += ` AND zone_id = ${
        request.body.zoneid}`;
    }
    query += ' GROUP BY alarm_type order by count desc limit 5';
  } else if (request.body.date === 'weekend') {
    query = `WITH t AS (SELECT(to_char( time_stamp, 'YYYY-MM' ) || ' ' || to_char( time_stamp, 'w' ) || '(w)') AS DATE,\
        time_stamp, update_time, (SELECT type_name_${commonModule.task.getGlobalLanguage()
} FROM def_alarm_type WHERE type_no = alarm_type) AS code FROM his_alarm_list \
        WHERE alarm_type NOT IN (2, 1) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00') SELECT code, max(extract(epoch FROM (update_time - time_stamp) / 60)) AS count \
        FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY code ORDER BY count desc limit 5`;
  } else if (request.body.date === 'month') {
    query = `WITH t AS (SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, time_stamp, update_time, \
        (SELECT type_name_${commonModule.task.getGlobalLanguage()} FROM def_alarm_type WHERE type_no = alarm_type) AS code \
        FROM his_alarm_list WHERE alarm_type NOT IN (2, 1) AND time_stamp > '${
  request.body.prevtime
} 00:00' AND time_stamp < '${
  request.body.currtime
} 00:00') SELECT code, max(extract(epoch FROM (update_time - time_stamp) / 60)) AS count \
        FROM t WHERE date = '${
  request.body.alarmdate
}' GROUP BY code ORDER BY count desc limit 5`;
  }
  return query;
}


function alarmNameQuery(request) {
  let query;
  if (request.body.date === 'day') {
    query = `SELECT to_char(time_stamp, 'YYYY-MM-DD') AS date, \
            ROUND(MAX(extract(epoch FROM (update_time - time_stamp) / 60  ))) AS dt, \
            count(*) AS count \
            FROM his_alarm_list \
            WHERE alarm_type NOT IN (2,1) AND alarm_code = ${
  request.body.alarmcode
} AND time_stamp > '${
  request.body.prevtime
} 00:00:00' AND time_stamp < '${
  request.body.currtime
} 23:59:59' GROUP BY to_char(time_stamp, 'YYYY-MM-DD') ORDER BY date asc`;
  } else if (request.body.date === 'weekend') {
    query = `SELECT ((to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)')) AS date, \
            ROUND(MAX(extract(epoch FROM (update_time - time_stamp) / 60))) AS dt, count(*) AS count FROM his_alarm_list \
            WHERE alarm_type NOT IN (2,1) AND alarm_code = ${
  request.body.alarmcode
} AND time_stamp > '${
  request.body.prevtime
} 00:00:00' AND time_stamp < '${
  request.body.currtime
} 23:59:59' GROUP BY ((to_char(time_stamp, 'YYYY-MM')||' '||to_char(time_stamp, 'w')||'(w)'))  ORDER BY date asc`;
  } else if (request.body.date === 'month') {
    query = `SELECT (to_char(time_stamp, 'YYYY-MM')||'(m)') AS date, \
            ROUND(MAX(extract(epoch FROM (update_time - time_stamp) / 60))) AS dt, \
            count(*) AS count FROM his_alarm_list WHERE alarm_type NOT IN (2,1) AND alarm_code = ${
  request.body.alarmcode
} AND time_stamp > '${
  request.body.prevtime
} 00:00:00' AND time_stamp < '${
  request.body.currtime
} 23:59:59' GROUP BY (to_char(time_stamp, 'YYYY-MM')||'(m)')  ORDER BY date asc`;
  }
  return query;
}

function alarmManualQuery(request) {
  let query;
  if (request.body.alarmtype === 0) {
    if (request.body.subcode !== undefined) {
      query = `SELECT alarm_code, sub_code, alarm_name, contents, meaning, cause, remedy \
            FROM defines.def_robotalarm_list_${
  commonModule.task.getGlobalLanguage()
} WHERE alarm_code = '${
  request.body.alarmcode
}' AND sub_code = '${
  request.body.subcode
}' GROUP BY alarm_code, sub_code, alarm_name, contents, meaning, cause_index, cause, remedy ORDER BY cause_index asc`;
    } else {
      query = `SELECT alarm_code, sub_code, alarm_name, contents, meaning, cause, remedy \
            FROM defines.def_robotalarm_list_${
  commonModule.task.getGlobalLanguage()
} WHERE alarm_code = '${
  request.body.alarmcode
}' GROUP BY alarm_code, sub_code, alarm_name, contents, meaning, cause_index, cause, remedy ORDER BY sub_code asc, cause_index asc LIMIT 1`;
    }
  } else if (request.body.alarmtype === 3 || request.body.alarmtype === 4) {
    query = `SELECT message, cause, remedy \
        FROM defines.def_plcalarm_list_${
  commonModule.task.getGlobalLanguage()
} WHERE alarm_code = '${
  request.body.alarmcode
}'`;
  }
  return query;
}

function alarmDescriptionQuery(request) {
  const query = `SELECT alarm_name FROM his_alarm_list WHERE alarm_code = '${
    request.body.alarmcode
  }' AND alarm_name is not null ORDER BY time_stamp desc LIMIT 1`;
  return query;
}

// 코드별 알람 발생
statistics.post('/codealarm', (req, res) => {
  commonModule.mainDB.execute(codealarmQuery(req), req.session.spsid, res);
});

// 알람종류별 알람발생
statistics.post('/alarmevent', (req, res) => {
  commonModule.mainDB.execute(alarmeventQuery(req), req.session.spsid, res);
});

// 코드별 정지시간
statistics.post('/codestop', (req, res) => {
  commonModule.mainDB.execute(codestopQuery(req), req.session.spsid, res);
});

// 알람종류별 정지시간
statistics.post('/alarmstop', (req, res) => {
  commonModule.mainDB.execute(alarmstopQuery(req), req.session.spsid, res);
});

// 일간 최대 발생알람명 / 최다 정지일 의 팝업 데이터
statistics.post('/alarmname', (req, res) => {
  commonModule.mainDB.execute(alarmNameQuery(req), req.session.spsid, res);
});

//renew 발생알람명 / 최다 정지일의 팝업 데이터
statistics.post('/renew/alarmname', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let query = {
    text: ``,
    values: [
      req.body.data.alarm_code,
      start_time,
      end_time
    ]
  }
  if(req.body.data.type_id === 0){
    query.text = `SELECT to_char(update_time, 'YYYY-MM-DD') AS date, count(*) AS count FROM main.his_robot_alarm WHERE code = $1 and update_time between $2 and $3 \
      GROUP BY to_char(update_time, 'YYYY-MM-DD') ORDER BY date asc`
  }
  else{
    query.text = `SELECT to_char(update_time, 'YYYY-MM-DD') AS date, count(*) AS count \
    FROM main.his_zone_alarm \
    WHERE code = $1 and update_time between $2 and $3 and status = 1 GROUP BY to_char(update_time, 'YYYY-MM-DD') ORDER BY date asc`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 알람 매뉴얼
statistics.post('/alarm/manual', (req, res) => {
  commonModule.mainDB.execute(alarmManualQuery(req), req.session.spsid, res);
});

// 알람 내용
statistics.post('/alarm/desc', (req, res) => {
  commonModule.mainDB.execute(alarmDescriptionQuery(req), req.session.spsid, res);
});

// 최대 발생알람명 / 최다 정지일 의 팝업 데이터 중 경보 내용
// - 매뉴얼 검색 후 없으면, 경보 내용 출력
statistics.post('/alarm/code', (req, res) => {
  commonModule.mainDB.execute(alarmManualQuery(req), req.session.spsid, (rows) => {
    if (rows === 'no data') {
      commonModule.mainDB.execute(alarmDescriptionQuery(req), req.session.spsid, res);
    } else {
      res.status(200).json(rows); // 데이터 확인 필요
    }
  });
});

//renew 최대 발생알람명
 statistics.post('/renew/alarm/code', async(req, res) => {
  let query = {
    text: ``,
    values: [
      req.body.data.alarm_code
    ]
  }
  if(req.body.data.type_id === 0){
    query.text = `SELECT alarm_id, code, sub_code, name, sub_code_info from main.his_robot_alarm WHERE code = $1 LIMIT 1`
    res.status(200).send(await commonModule.mainDB.execute(query));
  }else{
    query.text = `SELECT alarm_id, contents as alarm_name FROM main.his_zone_alarm WHERE code = $1 AND contents is not null ORDER BY update_time desc LIMIT 1`
    commonModule.mainDB.execute(query, req.session.spsid, res);
  }
})
// renew 팝업의 차트
statistics.post('/renew/alarm/detail/chart', (req, res) => {
  const start_time = `${String(req.body.startdate)} 00:00:00`;
  const end_time = `${String(req.body.enddate)} 23:59:59`;
  let query = {
    text: ``,
    values: [
      req.body.data.alarm_code,
      start_time,
      end_time
    ]
  }
  if(req.body.data.type_id === 0){
    query.text = `WITH T AS ( \
      SELECT zone_id, booth_config.booth_id, disp_booth_id, booth_config.booth_name FROM main.zone_config \
      INNER JOIN main.booth_config booth_config ON main.zone_config.disp_booth_id = booth_config.booth_id \
    ), TT AS ( \
      SELECT robot_alarm.code, robot_alarm.robot_id, robot_config.zone_id FROM main.his_robot_alarm robot_alarm \
      INNER JOIN main.robot_config robot_config ON robot_alarm.robot_id = robot_config.robot_id \
      WHERE robot_alarm.code = $1 and update_time between $2 and $3)\
    SELECT T.booth_name AS name, COUNT(T.booth_id) AS COUNT from TT INNER JOIN T ON TT.zone_id = T.zone_id \
    GROUP BY T.booth_name`
  }else{
    query.text = `WITH T AS ( \
      SELECT zone_id, booth_config.booth_id, disp_booth_id, booth_config.booth_name FROM main.zone_config \
        INNER JOIN main.booth_config booth_config ON main.zone_config.disp_booth_id = booth_config.booth_id \
    ) \
    SELECT T.booth_name AS name, COUNT(T.booth_id) AS COUNT from T  \
    INNER JOIN main.his_zone_alarm ON T.zone_id = main.his_zone_alarm.zone_id \
    WHERE code = $1 and update_time between $2 and $3 and status = 1 GROUP BY T.booth_name`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});


// 팝업의 차트
statistics.post('/alarm/detail/chart', (req, res) => {
  const startTime = `${req.body.prevtime} 00:00:00`;
  const endTime = `${req.body.currtime} 23:59:59`;
  const query = {
    text: "WITH t AS (SELECT booth_id AS process, count(booth_id) AS count FROM his_alarm_list WHERE alarm_code = $1 AND factory_id = $2 AND time_stamp BETWEEN to_timestamp_imu($3, 'YYYY-MM-DD HH24:MI:SS') AND to_timestamp_imu($4, 'YYYY-MM-DD HH24:MI:SS') GROUP BY process ORDER by count(booth_id) desc) SELECT t.count,c.booth_name AS name FROM t join def_booth_config AS c on (t.process = c.booth_id);",
    values: [
      req.body.alarmcode,
      req.body.factoryid,
      startTime,
      endTime,
    ],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});


statistics.get('/booth/alarm/count', (req, res) => {
  /** 일자 별 집계, 공정 간 경보 발생 비율 */
  const { code, prevDate, currDate } = req.query;
  const startDate = `'${prevDate} 00:00:00'`;
  const endDate = `'${currDate} 23:59:59'`;
  const query = `WITH t AS ( SELECT zone_id, count(zone_id) AS count FROM main.his_zone_alarm WHERE code = ${code} AND \
  update_time BETWEEN to_timestamp_imu(${startDate}, 'YYYY-MM-DD HH24:MI:SS') AND to_timestamp_imu(${endDate}, 'YYYY-MM-DD HH24:MI:SS') \
  GROUP BY zone_id ORDER BY count DESC) SELECT t.count, d.booth_name AS name FROM t INNER JOIN main.zone_config AS c ON (t.zone_id = c.zone_id) \
  INNER JOIN main.booth_config AS d ON (c.booth_id = d.booth_id)`
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

statistics.get('/alarm/mix/count', (req, res) => {
  /** 일자 별 집계, 알람 종류 별 정지 시간 */
  const { zoneId, code, prevDate, currDate } = req.query;
  const startDate = `'${prevDate} 00:00:00'`;
  const endDate = `'${currDate} 23:59:59'`;
  const query = `SELECT count(update_time) AS count, TO_CHAR(update_time, 'yyyy-mm-dd') AS date FROM main.his_zone_alarm WHERE zone_id=${zoneId} AND code = ${code} AND \
  update_time BETWEEN to_timestamp_imu(${startDate}, 'YYYY-MM-DD HH24:MI:SS') AND to_timestamp_imu(${endDate}, 'YYYY-MM-DD HH24:MI:SS') GROUP BY date`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})