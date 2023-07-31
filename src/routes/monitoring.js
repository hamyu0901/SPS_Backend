/* eslint-disable no-useless-concat */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');
const monitoring = express.Router();
const bodyParser = require('body-parser');
const commonModule = require('./app');

monitoring.use(bodyParser.urlencoded({ extended: true }));
monitoring.use(bodyParser.json());

const getProductionInfoItems = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
        res === undefined ? reject(new Error(err)) : resolve(res.rows);
    })
  })
}

const getAlarmItems = (query) => {
  return new Promise((resolve, reject) => {
    commonModule.mainDB.dbClient.query(query, (err, res) => {
        res === undefined ? reject(new Error(err)) : resolve(res.rows);
    })
  })
}

const getBoothID = (idx, body) => {
  if (body != null) {
    return ' AND booth_id = $' + `${idx}`;
  }

  return '';
};
const getZoneID = (idx, body) => {
  if (body != null) {
    return ' AND zone_id = $' + `${idx}`;
  }

  return '';
};
const getRobotID = (idx, body) => {
  if (body != null) {
    return ' AND robot_id = $' + `${idx}`;
  }

  return '';
};

const getValues = (body) => {
  const values = [];
  Object.keys(body).forEach((key) => {
    values.push(body[key]);
  });
  return values;
};

monitoring.get('/', (req, res) => {
  res.status(200).send('Monitoring');
});

// 부스 리스트 요청
monitoring.post('/booth/list', (req, res) => {
  const query = {
    text: 'SELECT booth_name AS boothname, booth_id AS boothid FROM public.def_booth_config WHERE factory_id = $1 ORDER BY show ASC',
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 부스의 존 리스트 요청
monitoring.post('/zone/list', (req, res) => {
  const query = {
    text: `SELECT (SELECT booth_name AS boothname FROM public.def_booth_config AS booth WHERE booth.booth_id = zone.booth_id), zone_name AS zonename, booth_id, conveyor_id, zone_id, start_count, end_count FROM public.def_zone_config AS zone WHERE factory_id = $1${getBoothID(2, req.body.boothid)} ORDER BY zone.show ASC`,
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.get('/boothid/:boothid/zoneid/:zoneid/zonename', (req, res) => {
  const query = {
    text: `SELECT zone_name FROM def_zone_config WHERE booth_id = ${req.params.boothid} AND zone_id = ${req.params.zoneid};`
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 존 이름을 통한 부스 아이디와 존 아이디 요청
monitoring.post('/zone/info', (req, res) => {
  const query = {
    text: 'SELECT booth_id, zone_id, conveyor_id, start_count, end_count FROM public.def_zone_config WHERE zone_name = $1',
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 존의 환경 설정 값 요청
monitoring.post('/zone/config', (req, res) => {
  const query = {
    text: 'SELECT zone_type, (SELECT booth_name AS boothname FROM public.def_booth_config AS booth WHERE booth.booth_id = zone.booth_id), zone_name AS zonename, op_db_addr AS opip, plc_type AS plctype, plc_ip AS plcip, end_count AS count FROM public.def_zone_config AS zone WHERE factory_id = $1 AND booth_id = $2 AND zone_id = $3',
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇의 리스트 값 요청
monitoring.post('/zone/robot/list', (req, res) => {
  const query = {
    text: `SELECT robot_name, show AS visible, robot_id, booth_id, zone_id, robot_type, \
        (SELECT robot_status FROM public.cur_robot_data AS robottable WHERE robottable.robot_id = basetable.robot_id), \
        (SELECT robot_mode_run FROM public.cur_plc_data AS plctable WHERE plctable.robot_id = basetable.robot_id), \
        (SELECT booth_name FROM public.def_booth_config AS boothtable WHERE boothtable.booth_id = basetable.booth_id), \
        (SELECT zone_name FROM public.def_zone_config AS findtable WHERE findtable.zone_id = basetable.zone_id), \
        (SELECT atomizer_alarm FROM public.cur_plc_data AS plctable WHERE plctable.robot_id = basetable.robot_id) FROM public.def_robot_config AS basetable WHERE factory_id = $1 ${getBoothID(2, req.body.boothid)}${getZoneID(3, req.body.zoneid)}${getRobotID(4, req.body.robotid)} ORDER BY zone_id, robot_id ASC;`,
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 중/상도 존 로봇 데이터
monitoring.post('/zone/data', (req, res) => {
  let query = `SELECT \
    (SELECT count(*) AS offline FROM cur_robot_data WHERE robot_status = 0), \
    (SELECT count(*) AS waiting FROM cur_robot_data WHERE robot_status = 1), \
    (SELECT count(*) AS action FROM cur_robot_data WHERE robot_status = 2), \
    (SELECT count(*) AS remote FROM cur_robot_data WHERE robot_status = 3), \
    (SELECT count(*) AS alarm FROM cur_robot_data WHERE robot_status = 4 OR robot_status = 5), \
    (SELECT count(*) AS error FROM cur_robot_data WHERE robot_status = 6), \
    (SELECT show AS robot_name FROM def_robot_config AS r WHERE r.robot_id = c.robot_id ), \
    c.factory_id, c.booth_id, c.zone_id, c.robot_id, c.robot_status, r.buse, r.robot_type, a.atomizer_alarm, a.spray_onoff, \
    a.flow_cmd, a.flow_feedback, a.turbine_speed_cmd, a.turbine_speed_feedback, a.sa_s_cmd, a.sa_s_feedback, \
    a.sa_v_cmd, a.sa_v_feedback, a.hv_cmd, a.hv_feedback, a.hvc_feedback, \
    a.robot_mode_home, a.robot_mode_auto, a.robot_mode_teach, a.robot_mode_run, a.robot_mode_rins, a.robot_mode_bypass \
    FROM \
    cur_robot_data AS c \
    JOIN \
    def_robot_config AS r ON (c.robot_id = r.robot_id AND r.buse = true) \
    LEFT JOIN \
    cur_plc_data AS a ON (r.robot_id = a.robot_id) \
    WHERE \
    a.factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
        += ` AND a.booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
        += ` AND a.zone_id = ${
        req.body.zoneid}`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 존 로봇 데이터
monitoring.post('/zone/data/sealer', (req, res) => {
  let query = `SELECT \
    (SELECT show AS robot_name FROM def_robot_config AS r WHERE r.robot_id = c.robot_id ), \
    c.factory_id, c.booth_id, c.zone_id, c.robot_id, c.robot_status, a.atomizer_alarm, a.spray_onoff, \
    a.flow_cmd, a.flow_feedback, a.turbine_speed_cmd, a.turbine_speed_feedback, a.sa_s_cmd, a.sa_s_feedback, \
    a.sa_v_cmd, a.sa_v_feedback, a.hv_cmd, a.hv_feedback, a.hvc_feedback, \
    a.robot_mode_home, a.robot_mode_auto, a.robot_mode_teach, a.robot_mode_run, a.robot_mode_rins, a.robot_mode_bypass \
    ,s.trigger1, s.trigger2,s.trigger3,s.flow_cmd,s.swirl_cmd,s.masking_unit_speed_cmd,s.flow_feedback,s.swirl_feedback,s.pressure_feedback, \
    (s.trigger1 +s.trigger2+s.trigger3) as sealer_on \
    FROM \
    cur_robot_data AS c \
    JOIN \
    def_robot_config AS r ON (c.robot_id = r.robot_id AND r.buse = true) \
    LEFT JOIN \
    cur_plc_data AS a ON (r.robot_id = a.robot_id) \
    LEFT JOIN \
    cur_sealer_data AS s ON (r.robot_id = s.robot_id) \
    WHERE \
    a.factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
        += ` AND a.booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
        += ` AND a.zone_id = ${
        req.body.zoneid}`;
  }
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.post('/zone/waypoint', (req, res) => {
  const query = {
    text: 'SELECT start_count, end_count FROM public.def_zone_config WHERE booth_id = $1 AND zone_id = $2',
    values: getValues(req.body),
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.post('/zone/body/update', (req, res) => {
  const query = `SELECT *, \
    (SELECT end_count AS endcount \
        FROM \
        public.def_zone_config \
        WHERE \
        factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND conveyor_id = ${
  req.body.conveyorid
} AND zone_id = ${
  req.body.zoneid
}), \
    (SELECT zone_type AS zonetype \
        FROM \
        public.def_zone_config \
        WHERE \
        factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND conveyor_id = ${
  req.body.conveyorid
} AND zone_id = ${
  req.body.zoneid
}) \
    FROM \
    public.cur_skid_data \
    WHERE \
    conveyor_id = ${
  req.body.conveyorid
} AND count BETWEEN ${
  req.body.startcount
} AND ${
  req.body.endcount
} ORDER BY count ASC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.post('/alarm', (req, res) => {
  let query = `SELECT time_stamp, alarm_name, alarm_id, alarm_type, alarm_status, \
    (SELECT robot_name FROM def_robot_config AS rc WHERE rc.robot_id = al.robot_id), \
    (SELECT booth_name FROM def_booth_config AS bc WHERE bc.booth_id = al.booth_id), \
    (SELECT zone_name FROM def_zone_config AS zc WHERE zc.zone_id = al.zone_id), \
    alarm_code, alarm_type, alarm_content \
    FROM \
    his_alarm_list AS al \
    WHERE \
    alarm_type in (0,3,4) and alarm_status = 0 \
    AND factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
        += ` AND booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
        += ` AND zone_id = ${
        req.body.zoneid}`;
  }
  if (!commonModule.common.isEmpty(req.body.robotid)) {
    query
        += ` AND robot_id = ${
        req.body.robotid}`;
  }
  query += " AND time_stamp > now_timestamp() - interval '2 days' ORDER BY time_stamp DESC;";
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.post('/zone/robot/status', (req, res) => {
  const query = {
    text: 'SELECT robot_status AS robotstatus FROM cur_robot_data WHERE booth_id = $1 AND zone_id = $2 AND robot_id = $3',
    values: [req.body.boothid, req.body.zoneid, req.body.robotid],
  };
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

monitoring.get('/booth/type', (req, res) => {
  const query = {
    text: 'select booth_name, (select zone_type from def_zone_config as zone where zone.booth_id = booth.booth_id order by zone.zone_type desc limit 1) as booth_type from def_booth_config as booth',
  };
  commonModule.mainDB.prepareExecute(query, res);
});

monitoring.get('/torque/data', (req, res) => {
  const query = {
    text: `select zone_id, robot_id, max(time_stamp)as time from his_torqueaccum_data group by zone_id, robot_id order by robot_id` ,
  }
  commonModule.mainDB.execute(query, req.session.spsid, res)
})

monitoring.get('/factory/name', (req, res) => {
  /** 공장 이름 가져오기 */
  const query = "SELECT factory_name FROM main.common_config";
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.get('/line/robot/status', (req, res) => {
  /** 로봇 상태 값 가져오기 */
  const query = "SELECT robot_id, pp_mode, robot_status FROM main.cur_robot_status";
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.get('/detail/zone/alarm',(req, res) => {
  const { zoneId } = req.query;
  const language = commonModule.task.getGlobalLanguage();
  const alarmLevelType = {
    kr: { high: '상', medium: '중', low: '하' },
    en: { high: 'high', medium: 'medium', low: 'low' },
    cn: { high: '上', medium: '中', low: '下' }
  }
  const query = `SELECT alarm_id, zone_id, code, main.his_zone_alarm.type_id, type_name_${language} as type_name, contents, level, \
  CASE WHEN level = 0 THEN '${alarmLevelType[language].low}' WHEN level = 1 THEN '${alarmLevelType[language].medium}' WHEN level = 2 THEN '${alarmLevelType[language].high}' END AS level_name, \
  TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS update_time FROM main.his_zone_alarm INNER JOIN main.def_alarm_type ON main.his_zone_alarm.type_id = main.def_alarm_type.type_id \
  WHERE zone_id = ${zoneId} AND status = 1 AND update_time BETWEEN current_date AND current_date + 1 ORDER BY update_time DESC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.get('/detail/zone/production', (req, res) => {
  // 쿼리 속도 개선
  const { zoneId } = req.query;
  const query = `SELECT column_name, ARRAY_LENGTH(column_name, 1) AS column_name_length, record, vin_no, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS update_time FROM main.his_production_information \
  WHERE zone_id = ${ zoneId } AND update_time BETWEEN current_date AND current_date + 1 ORDER BY update_time DESC`

  commonModule.sess.requestAuth(req.session.spsid) ?
  getProductionInfoItems(query).then(result => {
      if(result.length > 0) {
        const maxColumnNameRow = result.reduce((prev, curr) => { return prev.column_name_length > curr.column_name_length ? prev : curr });
        const productionItems = result.map(productionItem => {
          maxColumnNameRow.column_name.map((cn, index) => {
            productionItem[cn] = productionItem.record[index];
          })
          return productionItem;
        }) 
        res.status(200).send(productionItems);
      } else {
        res.status(204).send('no data');
      }
    }).catch(error => {
      res.status(404).send(error);
    })
  : res.status(404).send('not login');
})

monitoring.get('/line/zone/alarm', ( req,res ) => {
  const language = commonModule.task.getGlobalLanguage();
  const query = `SELECT alarm_id, zone_id, robot_id, code, sub_code, cur_alarm.type_id, type_name_${language} AS type_name, level, warning, update_time, contents, spc_code FROM main.cur_zone_alarm cur_alarm \
  INNER JOIN main.def_alarm_type ON cur_alarm.type_id = main.def_alarm_type.type_id WHERE warning = false ORDER BY update_time DESC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.post('/line/robot/alarm', ( req,res ) => {
  const { robot_id, start_date, end_date } = req.body;
  const query = `select alarm_id, robot_id, code, name AS alarm_name, job_name, step_no, axis_info, disp_alarm_axis, match_parts, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS update_time FROM main.his_robot_alarm
    left join main.def_alarm_part_match on code = match_alarm_code WHERE robot_id = ${robot_id} and update_time between '${start_date}' and '${end_date}'`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.get('/line/robot/remedy/alarm', (req, res) => {
  const {code, rc_model: rcModel } = req.query;
  const language = commonModule.task.getGlobalLanguage();
  const query = `SELECT * FROM main.def_robot_alarm_list_${language} WHERE alarm_code = '${code}' AND rc_model_id = ${rcModel}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
})

monitoring.get('/line/zone/robot/alarm', (req, res) => {
  const language = commonModule.task.getGlobalLanguage();
  const zone_query = `SELECT alarm_id, main.his_zone_alarm.zone_id, zone_name, code, main.his_zone_alarm.type_id, type_name_${language} AS type, level, warning, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') as date, contents , step_no, job_name \
  FROM main.his_zone_alarm \
  INNER JOIN main.zone_config ON main.his_zone_alarm.zone_id = main.zone_config.zone_id \
  INNER JOIN main.def_alarm_type ON main.his_zone_alarm.type_id = main.def_alarm_type.type_id WHERE update_time between current_date AND current_date + 1 and warning = false and status = 1 order by update_time desc`

  const robot_query = `SELECT alarm_id, code, T.zone_id, robot_id, name as contents, type_id, level, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') as date, robot_name, type_name_${language} as type, zone_name, job_name, step_no  FROM (\
    SELECT alarm_id, zone_id, main.his_robot_alarm.robot_id, code, name, type_name_${language}, main.his_robot_alarm.type_id, level, update_time, robot_name, job_name, step_no FROM main.his_robot_alarm \
    INNER JOIN main.robot_config robot_config ON robot_config.robot_id = his_robot_alarm.robot_id \
    INNER JOIN main.def_alarm_type alarm_type ON alarm_type.type_id = his_robot_alarm.type_id WHERE update_time between current_date AND current_date + 1)T \
    INNER JOIN main.zone_config zone_config ON zone_config.zone_id = T.zone_id `

  const concatArray = (array1, array2) => {
    if(array1 && array2){
      return array1.concat(array2) 
    }
    else if (array1 && !array2){
      return array1
    }
    else{
      return array2
    }
  }
  const orderedDate = (array, key, type) => {
    return type === 'asc' ? array.sort((a, b) => new Date(a[key]) - new Date(b[key])) : array.sort((a, b) => new Date(b[key]) - new Date(a[key]))
  } 
  commonModule.sess.requestAuth(req.session.spsid) ?
      getAlarmItems(zone_query).then(zoneAlarmResult => {
        const zoneAlarmItems = zoneAlarmResult.length > 0 && zoneAlarmResult;
          getAlarmItems(robot_query).then(robotAlarmResult => {
            const robotAlarmItems = robotAlarmResult.length > 0 && robotAlarmResult;
              (!zoneAlarmResult.length && !robotAlarmResult.length) ? res.status(204).send('no data') : res.status(200).send(orderedDate(concatArray(zoneAlarmItems,robotAlarmItems), 'date', 'desc'))
            }).catch(error => {
              res.status(404).send(error);
          })
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

export { monitoring };