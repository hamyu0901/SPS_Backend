/* eslint-disable import/prefer-default-export */
/* eslint-disable func-names */
/* eslint-disable no-shadow */
/* eslint-disable no-plusplus */
/* eslint-disable eqeqeq */
/* eslint-disable import/no-extraneous-dependencies */

import { alarm } from './diagnostics/dataReport/alarm';

/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const alarmView = express.Router();
export { alarmView };
const multer = require('multer');
const Q = require('q');
const urlencode = require('urlencode');
const bodyParser = require('body-parser');
const commonModule = require('./app');

alarmView.use(bodyParser.urlencoded({ extended: true }));
alarmView.use(bodyParser.json());

alarmView.get('/', (req, res) => {
  res.status(200).send('Alarm View');
});

//alramCode
alarmView.get('/data/alarm/code', (req, res) => {
  let query =  `SELECT DISTINCT alarm_code from his_alarm_list`
  commonModule.mainDB.execute(query, req.session.spsid, res);
})
// 그리드 조회
alarmView.post('/data/gridtable', (req, res) => {
  const start_time = `${String(req.body.prevDate)} 00:00:00`;
  const end_time = `${String(req.body.currDate)} 23:59:59`;
  let query = {
    text: `SELECT his_alarm_list.time_stamp, his_alarm_list.factory_id, his_alarm_list.booth_id, his_alarm_list.zone_id, \
    his_alarm_list.robot_id, his_alarm_list.alarm_code, his_alarm_list.alarm_sub_code, his_alarm_list.sub_code_info, \
    his_alarm_list.alarm_name, his_alarm_list.update_time, his_alarm_list.alarm_type, his_alarm_list.alarm_level, \
    his_alarm_list.alarm_status, his_alarm_list.alarm_content, his_alarm_list.job_name, his_alarm_list.line_no, \
    his_alarm_list.step_no, his_alarm_list.schedule_id, his_alarm_list.alarm_id, def_booth_config.booth_name, \
    def_zone_config.zone_name, def_robot_config.robot_name FROM his_alarm_list left outer JOIN def_robot_config on \
    def_robot_config.factory_id = his_alarm_list.factory_id and def_robot_config.booth_id = his_alarm_list.booth_id AND \
    def_robot_config.zone_id = his_alarm_list.zone_id AND def_robot_config.robot_id = his_alarm_list.robot_id INNER JOIN \
    def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id AND his_alarm_list.booth_id = def_booth_config.booth_id \
    inner join def_zone_config on his_alarm_list.factory_id = def_zone_config.factory_id AND his_alarm_list.booth_id = \
    def_zone_config.booth_id and his_alarm_list.zone_id = def_zone_config.zone_id WHERE his_alarm_list.factory_id = ${
  req.body.factoryid} AND his_alarm_list.time_stamp BETWEEN $1 AND $2`,
    values: [
      start_time,
      end_time
    ]
  }
  if(req.body.selectedAlarmCodes != undefined && req.body.selectedAlarmCodes != ""){
    query.text
        += ` and his_alarm_list.alarm_code NOT IN(${
          req.body.selectedAlarmCodes
        })`;
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
  if (req.body.alarmtype != undefined) {
    query.text
        += ` and his_alarm_list.alarm_type = ${
        req.body.alarmtype}`;
  }
  if (req.body.alarmstatus != undefined) {
    query.text
        += ` and his_alarm_list.alarm_status = ${
        req.body.alarmstatus}`;
  }
  query.text
    += ' ORDER BY time_stamp desc';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// BASIC
// alarmView.get('/basic/predict/history/startdate/:startdate/enddate/:enddate', (req, res) => {
//   let starttime = req.params.startdate + " 00:00:00";
//   let endtime = req.params.enddate + " 23:59:59";
//   let query = {
//     text: `SELECT a.code, a.content, a.time_stamp, a.end_time, a.job_name, a.axis, a.factory_id, a.booth_id, a.zone_id, a.robot_id, \
//     (SELECT booth_name FROM def_booth_config b WHERE a.factory_id = b.factory_id AND a.booth_id = b.booth_id), \
//     (SELECT zone_name FROM def_zone_config z WHERE a.factory_id = z.factory_id AND a.zone_id = z.zone_id ), \
//     (SELECT robot_name FROM def_robot_config r WHERE a.factory_id = r.factory_id AND a.robot_id = r.robot_id ) FROM ( \
//     ( \
//       SELECT 'P001' AS code, ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, \
//       time_stamp, end_time, job_name, axis, factory_id, booth_id, zone_id, robot_id \
//       FROM his_robot_torque_violationjob \
//       WHERE time_stamp BETWEEN $1 AND $2 \
//     ) UNION ALL \
//     ( \
//       SELECT 'P002' AS code, ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, \
//       update_time AS time_stamp, update_time AS end_time, job_name, axis, factory_id, booth_id, zone_id, robot_id \
//       FROM his_violation_temperature \
//       WHERE update_time BETWEEN $1 AND $2
//     ) \
//     ) a ORDER BY a.time_stamp;`,
//     values: [
//       starttime,
//       endtime
//     ]
//   }
//   commonModule.mainDB.execute(query, req.session.spsid, res);
// })

alarmView.get('/predict/history/startdate/:startdate/enddate/:enddate', (req, res) => {
  let starttime = req.params.startdate + " 00:00:00";
  let endtime = req.params.enddate + " 23:59:59";
  let query = {
    text: `SELECT a.code, a.content, a.time_stamp, a.end_time, a.job_name, a.axis, a.factory_id, a.booth_id, a.zone_id, a.robot_id, \
    (SELECT booth_name FROM def_booth_config b WHERE a.factory_id = b.factory_id AND a.booth_id = b.booth_id), \
    (SELECT zone_name FROM def_zone_config z WHERE a.factory_id = z.factory_id AND a.zone_id = z.zone_id ), \
    (SELECT robot_name FROM def_robot_config r WHERE a.factory_id = r.factory_id AND a.robot_id = r.robot_id ) FROM ( \
    ( \
      SELECT 'P001' AS code, ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P001') AS content, \
      time_stamp, end_time, job_name, axis, factory_id, booth_id, zone_id, robot_id \
      FROM his_robot_torque_violationjob \
      WHERE time_stamp BETWEEN $1 AND $2 \
    ) UNION ALL \
    ( \
      SELECT 'P002' AS code, ( SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P002') AS content, \
      update_time AS time_stamp, update_time AS end_time, job_name, axis, factory_id, booth_id, zone_id, robot_id \
      FROM his_violation_temperature \
      WHERE update_time BETWEEN $1 AND $2
    ) UNION ALL \
    ( \
      SELECT 'P005' AS code, ( SELECT	alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P005') AS content, \
      time_stamp, end_time, job_name, axis, factory_id, booth_id, zone_id, robot_id \
      FROM his_violationjob_accum \
      WHERE time_stamp BETWEEN $1 AND $2 \
    ) \
    ) a ORDER BY a.time_stamp;`,
    values: [
      starttime,
      endtime
    ]
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 팝업 - job 변경 기록
alarmView.post('/data/grid/predictivealarm', (req, res) => {
  const query = `SELECT alarm_code, time_stamp, alarm_content FROM his_alarm_list WHERE factory_id = '${
    req.body.factoryid
  }' And booth_id = ${
    req.body.boothid
  } And zone_id = ${
    req.body.zoneid
  } And robot_id = ${
    req.body.robotid
  } And (alarm_code = '${
    req.body.alarmcode
  }') order by time_stamp desc LIMIT 5`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 팝업 데이터 - 정보
alarmView.post('/data/detail/info', (req, res) => {
  let query;
  if (req.body.robotid != undefined) {
    query = `SELECT his_alarm_list.time_stamp, his_alarm_list.factory_id, his_alarm_list.booth_id, \
        his_alarm_list.zone_id, his_alarm_list.robot_id, his_alarm_list.alarm_code, his_alarm_list.alarm_sub_code, \
        his_alarm_list.sub_code_info, his_alarm_list.alarm_name, his_alarm_list.update_time, his_alarm_list.alarm_type, \
        his_alarm_list.alarm_level, his_alarm_list.alarm_status, his_alarm_list.alarm_content, his_alarm_list.job_name, \
        his_alarm_list.line_no, his_alarm_list.step_no, his_alarm_list.schedule_id, his_alarm_list.alarm_id, \
        def_booth_config.booth_name, def_zone_config.zone_name, def_robot_config.robot_name \
        FROM his_alarm_list INNER JOIN def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id \
        AND his_alarm_list.booth_id = def_booth_config.booth_id INNER JOIN def_zone_config ON his_alarm_list.factory_id = def_zone_config.factory_id \
        AND his_alarm_list.booth_id = def_zone_config.booth_id AND his_alarm_list.zone_id = def_zone_config.zone_id \
        INNER JOIN def_robot_config ON his_alarm_list.factory_id = def_robot_config.factory_id \
        AND his_alarm_list.booth_id = def_robot_config.booth_id AND his_alarm_list.zone_id = def_robot_config.zone_id \
        AND his_alarm_list.robot_id = def_robot_config.robot_id \
        WHERE his_alarm_list.alarm_id = ${
  req.body.alarmid}`;
  } else {
    query = `SELECT his_alarm_list.time_stamp, his_alarm_list.factory_id, his_alarm_list.booth_id, \
        his_alarm_list.zone_id, his_alarm_list.robot_id, his_alarm_list.alarm_code, his_alarm_list.alarm_sub_code, \
        his_alarm_list.sub_code_info, his_alarm_list.alarm_name, his_alarm_list.update_time, his_alarm_list.alarm_type, \
        his_alarm_list.alarm_level, his_alarm_list.alarm_status, his_alarm_list.alarm_content, his_alarm_list.job_name, \
        his_alarm_list.line_no, his_alarm_list.step_no, his_alarm_list.schedule_id, his_alarm_list.alarm_id, \
        def_booth_config.booth_name, def_zone_config.zone_name \
        FROM his_alarm_list INNER JOIN def_booth_config ON his_alarm_list.factory_id = def_booth_config.factory_id \
        AND his_alarm_list.booth_id = def_booth_config.booth_id INNER JOIN def_zone_config ON his_alarm_list.factory_id = def_zone_config.factory_id \
        AND his_alarm_list.booth_id = def_zone_config.booth_id AND his_alarm_list.zone_id = def_zone_config.zone_id \
        WHERE his_alarm_list.alarm_id = ${
  req.body.alarmid}`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

alarmView.post('/data/detail/alarmcontent', (req, res) => {
  const query = `SELECT alarm_code, time_stamp, alarm_content FROM his_alarm_list \
    WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND (alarm_code = '${
  req.body.alarmcode
}') ORDER BY time_stamp desc LIMIT 5`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

alarmView.post('/data/detail/jobinfo', (req, res) => {
  const query = `SELECT job_name, axis, time_stamp, end_time, motor_torque_min, motor_torque_max, robot_id, step_no, violation_step \
    FROM his_robotpredict_point \
    WHERE robot_id = ${
  req.body.robotid
} AND check_date = '${
  req.body.checkdate
}' AND predict_type = ${
  req.body.predicttype}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

alarmView.post('/data/detail/chart', (req, res) => {
  const query = `WITH t AS (\
    SELECT booth_id AS process, count(booth_id) AS count \
    FROM his_alarm_list WHERE alarm_code ='${
  req.body.alarmcode
}' AND factory_id = ${
  req.body.factoryid
} AND time_stamp between (to_timestamp_imu('${
  req.body.selectdate
} 00:00:00', 'YYYY-MM-DD HH24:MI:SS') - INTERVAL '7day') AND (to_timestamp_imu('${
  req.body.selectdate
} 23:59:59', 'YYYY-MM-DD HH24:MI:SS') + INTERVAL '1day') GROUP BY process ORDER by count(booth_id) desc) \
    SELECT t.count,c.booth_name AS name \
    FROM t join def_booth_config AS c on (t.process = c.booth_id);`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

alarmView.post('/data/detail/alarmstop', (req, res) => {
  const query = `SELECT time_stamp, ROUND(MAX(EXTRACT(epoch FROM (update_time - time_stamp) / 60 ))) AS deadtime, \
    COUNT(alarm_code) AS count \
    FROM his_alarm_list \
    WHERE time_stamp between (to_timestamp_imu('${
  req.body.selectdate
} 00:00:00', 'YYYY-MM-DD HH24:MI:SS') - INTERVAL '7day') AND (to_timestamp_imu('${
  req.body.selectdate
} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')) \
    AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND alarm_code = '${
  req.body.alarmcode
}' AND alarm_status = 1 \
    GROUP BY time_stamp ORDER BY time_stamp asc;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

function alarmManualQuery(request) {
  let query;
  if (request.body.alarmtype == 0) {
    if (request.body.subcode != undefined) {
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
  } else if (request.body.alarmtype == 3 || request.body.alarmtype == 4) {
    query = `SELECT message, cause, remedy \
        FROM defines.def_plcalarm_list_${
  commonModule.task.getGlobalLanguage()
} WHERE alarm_code = '${
  request.body.alarmcode
}'`;
  }
  return query;
}

alarmView.post('/data/detail/manual', (req, res) => {
  commonModule.mainDB.execute(alarmManualQuery(req), req.session.spsid, res);
});

// 업데이트 타임 비교 B001
alarmView.post('/data/detail/backup/compare/time', (req, res) => {
  const query = `SELECT a.file_name a_file, a.time_stamp a_time, a.file_content a_content, \
    b.file_name b_file, b.time_stamp b_time, b.file_content b_content \
    FROM \
    (SELECT * \
        FROM \
        his_backup_list \
        WHERE \
        robot_id = ${
  req.body.robotid
} AND time_stamp = '${
  req.body.prevtime
}') a full outer join (SELECT * \
            FROM \
            his_backup_list \
            WHERE \
            robot_id = ${
  req.body.robotid
} AND time_stamp = '${
  req.body.currtime
}') b on a.file_name = b.file_name \
            WHERE a.file_name is null or b.file_name is null`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 내용 비교 B002
alarmView.post('/data/detail/backup/compare/file', (req, res) => {
  const query = `SELECT a.file_name a_file, a.time_stamp a_time, a.file_content a_content, \
    b.file_name b_file, b.time_stamp b_time, b.file_content b_content \
    FROM \
    (SELECT * \
        FROM \
        his_backup_list \
        WHERE \
        robot_id = ${
  req.body.robotid
} AND time_stamp = '${
  req.body.prevtime
}') a full outer join (SELECT * \
            FROM \
            his_backup_list \
            WHERE \
            robot_id = ${
  req.body.robotid
} AND time_stamp = '${
  req.body.currtime
}') b on a.file_name = b.file_name \
            WHERE a.file_content <> b.file_content;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 사용자 알람 조치 내용 저장
alarmView.post('/data/detail/alarm/action/to', (req, res) => {
  let cnt = null;
  let query = null;
  if (!commonModule.common.isEmpty(req.body.tags)) {
    const count = String(req.body.tags).match(/-/g);
    if (count == null) {
      cnt = 0;
    } else {
      cnt = count.length;
    }
    const insertValue = String(req.body.tags).split('-');
    let values = 'VALUES ';
    for (let idx = 0; idx < (cnt + 1); ++idx) {
      if (idx == (cnt)) {
        values += `('${insertValue[idx]}')`;
      } else {
        values += `('${insertValue[idx]}'),`;
      }
    }
    query = `WITH temp_tag AS ( \
        WITH all_tags ( NAME ) AS \
        ( ${
  values
} ) \
        INSERT INTO hashtags ( tag ) SELECT NAME  FROM  all_tags ON CONFLICT ( tag ) DO UPDATE   SET tag = EXCLUDED.tag RETURNING * \
       ), temp_action AS \
       ( \
        INSERT INTO his_user_action ( action_title, time_stamp, ref_alarm_code, user_id, action_type, remedy_message ) VALUES ('${
  req.body.actiontitle
}', now_timestamp ( ), '${
  req.body.alarmcode
}', '${
  req.body.userid
}', ${
  req.body.actiontype
}, '${
  req.body.remedymessage
}') RETURNING * \
       ) \
       INSERT INTO rel_useraction_tags ( action_id, tag_id ) SELECT action_id, tag_id FROM temp_tag, temp_action;`;
  } else {
    query = `INSERT INTO his_user_action ( action_title, time_stamp, ref_alarm_code, user_id, action_type, remedy_message ) VALUES ('${
      req.body.actiontitle
    }', now_timestamp ( ), '${
      req.body.alarmcode
    }', '${
      req.body.userid
    }', ${
      req.body.actiontype
    }, '${
      req.body.remedymessage
    }')`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 사용자 일반/유지보수 조치 내용 저장
alarmView.post('/data/detail/alarm/action/general/to', (req, res) => {
  let cnt = null;
  let query = null;
  if (!commonModule.common.isEmpty(req.body.tags)) {
    const count = String(req.body.tags).match(/-/g);
    if (count == null) {
      cnt = 0;
    } else {
      cnt = count.length;
    }
    const insertValue = String(req.body.tags).split('-');
    let values = 'VALUES ';
    for (let idx = 0; idx < (cnt + 1); ++idx) {
      if (idx == (cnt)) {
        values += `('${insertValue[idx]}')`;
      } else {
        values += `('${insertValue[idx]}'),`;
      }
    }
    query = `WITH temp_tag AS ( \
        WITH all_tags ( NAME ) AS \
        ( ${
  values
} ) \
        INSERT INTO hashtags ( tag ) SELECT NAME  FROM  all_tags ON CONFLICT ( tag ) DO UPDATE   SET tag = EXCLUDED.tag RETURNING * \
       ), temp_action AS \
       ( \
        INSERT INTO his_user_action ( action_title, time_stamp, user_id, action_type, remedy_message ) VALUES ('${
  req.body.actiontitle
}', now_timestamp ( ), '${
  req.body.userid
}', ${
  req.body.actiontype
}, '${
  req.body.remedymessage
}') RETURNING * \
       ) \
       INSERT INTO rel_useraction_tags ( action_id, tag_id ) SELECT action_id, tag_id FROM temp_tag, temp_action;`;
  } else {
    query = `INSERT INTO his_user_action ( action_title, time_stamp, user_id, action_type, remedy_message ) VALUES ('${
      req.body.actiontitle
    }', now_timestamp ( ), '${
      req.body.userid
    }', ${
      req.body.actiontype
    }, '${
      req.body.remedymessage
    }')`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 사용자 고장 보고서 저장
alarmView.post('/data/detail/alarm/action/fault/to', (req, res) => {
  let cnt = null;
  let query = null;
  if (!commonModule.common.isEmpty(req.body.tags)) {
    const count = String(req.body.tags).match(/-/g);
    if (count == null) {
      cnt = 0;
    } else {
      cnt = count.length;
    }
    const insertValue = String(req.body.tags).split('-');
    let values = 'VALUES ';
    for (let idx = 0; idx < (cnt + 1); ++idx) {
      if (idx == (cnt)) {
        values += `('${insertValue[idx]}')`;
      } else {
        values += `('${insertValue[idx]}'),`;
      }
    }
    query = `WITH temp_tag AS ( \
        WITH all_tags ( NAME ) AS \
        ( ${
  values
} ) \
        INSERT INTO hashtags ( tag ) SELECT NAME  FROM  all_tags ON CONFLICT ( tag ) DO UPDATE   SET tag = EXCLUDED.tag RETURNING * \
       ), temp_action AS \
       ( \
        INSERT INTO his_user_action ( action_title, time_stamp, user_id, action_type, cause_message,remedy_message, factory_id, booth_id, zone_id, `;
    if (!commonModule.common.isEmpty(req.body.robotid)) {
      query += 'robot_id,';
    }
    query += `ref_alarm_code, start_deadtime,end_deadtime,deadtime) \
        VALUES ('${
  req.body.actiontitle
}', now_timestamp ( ), '${
  req.body.userid
}', ${
  req.body.actiontype
}, '${
  req.body.causemessage
}', '${
  req.body.remedymessage
}', ${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid}`;
    if (!commonModule.common.isEmpty(req.body.robotid)) {
      query += `, ${req.body.robotid}`;
    }
    query += `, '${
      req.body.alarmcode
    }', '${
      req.body.startdt
    }', '${
      req.body.enddt
    }', ${
      req.body.dt
    }) RETURNING * \
       ) \
       INSERT INTO rel_useraction_tags ( action_id, tag_id ) SELECT action_id, tag_id FROM temp_tag, temp_action;`;
  } else {
    query = 'INSERT INTO his_user_action ( action_title, time_stamp, user_id, action_type, cause_message,remedy_message, factory_id, booth_id, zone_id, ';
    if (!commonModule.common.isEmpty(req.body.robotid)) {
      query += 'robot_id,';
    }
    query += `ref_alarm_code, start_deadtime,end_deadtime,deadtime) \
        VALUES ('${
  req.body.actiontitle
}', now_timestamp ( ), '${
  req.body.userid
}', ${
  req.body.actiontype
}, '${
  req.body.causemessage
}', '${
  req.body.remedymessage
}', ${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid}`;
    if (!commonModule.common.isEmpty(req.body.robotid)) {
      query += `, ${req.body.robotid}`;
    }
    query += `, '${
      req.body.alarmcode
    }', '${
      req.body.startdt
    }', '${
      req.body.enddt
    }', ${
      req.body.dt
    })`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 알람 팝업화면에서 사용자 조치 내용 조회
alarmView.get('/data/detail/alarm/action/from', (req, res) => {
  const query = {
    text: `SELECT
    ua.action_id,
    ua.action_title,
    string_agg(distinct tag,',') tag,
    ua.time_stamp,
    (SELECT type_name_kr FROM def_useraction_type where type_no = action_type) type_name,ua.remedy_message,user_id,
    (SELECT count(*) FROM rel_useraction_useful WHERE action_id = ua.action_id) as useful_point,
    (SELECT count(*) FROM rel_useraction_useful WHERE alarm_id = $1 and action_id = ua.action_id ) as useful_exist
    FROM his_user_action ua
    left join rel_useraction_tags ut on ua.action_id = ut.action_id
    left join hashtags tags on ut.tag_id = tags.tag_id
    left join rel_useraction_useful uu on ua.action_id = uu.action_id
    WHERE ref_alarm_code = $2 and action_type = $3
    GROUP BY ua.action_id,ua.action_title,ua.time_stamp,ua.remedy_message
    ORDER BY useful_point desc;`,
    values: [
      req.query.alarmid,
      req.query.alarmcode,
      req.query.actiontype,
    ],
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 알람 팝업화면 유용함 설정
alarmView.post('/data/detail/alarm/userful/regist', (req, res) => {
  const query = `INSERT INTO rel_useraction_useful(action_id,alarm_id) VALUES(${
    req.body.actionid
  },${
    req.body.alarmid
  }) ON CONFLICT DO NOTHING;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 알람 팝업화면 유용함 해제
alarmView.post('/data/detail/alarm/useful/release', (req, res) => {
  const query = `DELETE FROM rel_useraction_useful WHERE action_id = ${
    req.body.actionid
  } and alarm_id = ${
    req.body.alarmid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 알람 코드로 알람 타입 조회
alarmView.post('/manual/type', (req, res) => {
  const query = {
    text: `select (case when alarm_code = $1 then 0 when alarm_code != $1 then \
        (select (case when alarm_code = $1 then 4 when alarm_code != $1 then null end) AS alarmtype from defines.def_plcalarm_list_${commonModule.task.getGlobalLanguage()} order by alarmtype asc limit 1) \
         end) AS alarmtype from defines.def_robotalarm_list_${commonModule.task.getGlobalLanguage()} order by alarmtype asc limit 1`,
    values: [req.body.alarmcode],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇 알람 매뉴얼 조회
alarmView.post('/manual/type/robot', (req, res) => {
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = {
    text: `SELECT (SELECT display_name_${language
    } FROM public.def_filemanual AS file WHERE file.file_name = robotalarm.alarm_code) AS filename, sub_code AS subcode, \
        alarm_name AS alarmname, contents, meaning, cause_index AS causeindex, cause, remedy FROM defines.def_robotalarm_list_${
  commonModule.task.getGlobalLanguage()} AS robotalarm WHERE alarm_code = $1`,
    values: [req.body.alarmcode],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// PLC 알람 매뉴얼 조회
alarmView.post('/manual/type/plc', (req, res) => {
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = {
    text: `SELECT (SELECT display_name_${language
    } FROM public.def_filemanual AS file WHERE file.file_name = plcalarm.alarm_code) AS filename, message, \
        cause, remedy FROM defines.def_plcalarm_list_${
  commonModule.task.getGlobalLanguage()} AS plcalarm WHERE alarm_code = $1`,
    values: [req.body.alarmcode],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

const upload = function (req, res) {
  const deferred = Q.defer();
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'manual/troubleshooting/');
    },
    filename(req, file, cb) {
      const data = file;
      data.uploadedFile = {
        name: data.originalname,
        ext: data.mimetype.split('/')[1],
      };
      cb(null, data.uploadedFile.name);
    },
  });

  const upload = multer({ storage }).single('file');
  upload(req, res, (err) => {
    if (err) deferred.reject();
    else deferred.resolve(req.file.uploadedFile);
  });
  return deferred.promise;
};

// 매뉴얼 추가
alarmView.post('/manual/file/:code', (req, res) => {
  upload(req, res).then((file) => {
    const query = {
      text: "insert into public.def_filemanual(uid, manual_categories, display_name_kr, file_name, file_format, display_name_en, display_name_zh) values(((select max(uid) as uid from public.def_filemanual)+1), 4, $1, $2, 'pdf', $1, $1);",
      values: [
        String(file.name).split('.')[0],
        req.params.code,
      ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
  }, (err) => {
    res.send(500, err);
  });
});

// 매뉴얼 삭제
alarmView.delete('/manual/file/:name', (req, res) => {
  const query = {
    text: 'delete from public.def_filemanual where file_name = $1',
    values: [urlencode.decode(req.params.name)],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
