/* eslint-disable consistent-return */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-return-assign */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const maintenance = express.Router();
export { maintenance };
const bodyParser = require('body-parser');
const commonModule = require('./app');

maintenance.use(bodyParser.urlencoded({ extended: true }));
maintenance.use(bodyParser.json());

maintenance.get('/', (_req, res) => {
  res.status(200).send('Maintenance');
});

// 부스, 존, 로봇
maintenance.post('/data/insp/info', (req, res) => {
  const query = 'SELECT booth_id AS boothid, zone_id AS zoneid, robot_id AS robotid, FROM def_robot_config';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 점검 항목
maintenance.post('/data/insp/list', (req, res) => {
  let query = `SELECT \
    dm.maint_point, \
    dm.maint_code, \
    dm.maint_name_${commonModule.task.getGlobalLanguage()} AS maint_name, \
    ( SELECT sub_name FROM def_spare_sub_group WHERE sub_id = dm.unit_id ) AS unit, \
    dm.maint_cycle, \
    dm.maint_description_${commonModule.task.getGlobalLanguage()} AS maint_description , \
    dm.etc, \
    dm.file_name, \
    round( \
     ( \
      CAST ( \
       SUM ( \
       CASE \
         WHEN ( now_timestamp ( ) - cm.last_check_date ) > CAST ( dm.maint_cycle || ' ' || ' month' AS INTERVAL ) THEN \
         0 ELSE 1 \
        END \
        ) AS DOUBLE PRECISION \
       ) / COUNT ( * ) \
      ) * 100 \
     ) AS progress \
    FROM \
     maintenance.def_maint_list dm \
     LEFT JOIN maintenance.cur_robot_maint cm ON ( dm.maint_code = cm.maint_code AND \
        cm.factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
            += ` AND cm.booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
            += ` AND cm.zone_id = ${
        req.body.zoneid}`;
  }
  if (!commonModule.common.isEmpty(req.body.robotid)) {
    query
            += ` AND cm.robot_id = ${
        req.body.robotid}`;
  }
  query += `) \
    GROUP BY \
     dm.maint_code, \
     dm.maint_name_${commonModule.task.getGlobalLanguage()}, \
     dm.unit_id, \
     dm.maint_cycle, \
     dm.maint_description_${commonModule.task.getGlobalLanguage()}, \
    dm.etc, \
    dm.file_name ORDER BY maint_code ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 상세보기
maintenance.get('/data/insp/:filename', (req, res) => {
  let filePath = null;
  const language = (commonModule.task.getGlobalLanguage() === 'cn') ? 'zh' : commonModule.task.getGlobalLanguage();
  const query = `SELECT display_name_${
    language
  } AS display_name, file_name, file_format, uid FROM def_filemanual WHERE manual_categories = 2 ORDER BY uid`;
  commonModule.mainDB.execute(query, req.session.spsid, async (type) => {
    await Object.keys(type).forEach((key) => {
      if (type[key][1] === req.params.filename) {
        if (language === 'kr') {
          return filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        }
        if (language === 'en') {
          // 영문 버전이 없는 관계로 국문으로 대체 1.0.7
          return filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        }
        if (language === 'zh') {
          // 중문 버전이 없는 관계로 국문으로 대체 1.0.7
          return filePath = `./manual/maintenance/${type[key][1]}_ko-KR.pdf`;
        }
      }
    });
    if (filePath === null) {
      res.status(404).send('');
    } else {
      res.download(filePath);
    }
  });
});

// 세부 점검 항목 리스트
maintenance.post('/data/insp/list/detail', (req, res) => {
  let query = `with ml as \
    ( \
    SELECT ml.*,dml.maint_cycle \
    FROM \
     ( \
      select * fROM( select ml.factory_id, ml.booth_id, ml.zone_id, ml.robot_id,ml.maint_code,time_stamp,comment ,rank() over ( partition by robot_id order by time_stamp desc) \
      from maintenance.his_maint_list ml \
      WHERE ml.factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
        += ` AND ml.booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
        += ` AND ml.zone_id = ${
        req.body.zoneid}`;
  }
  if (!commonModule.common.isEmpty(req.body.robotid)) {
    query
        += ` AND ml.robot_id = ${
        req.body.robotid}`;
  }
  query += ` AND ml.maint_code = '${
    req.body.alarmcode
  }' \
      GROUP BY ml.factory_id, ml.booth_id, ml.zone_id,ml.robot_id,ml.maint_code, time_stamp, comment \
      order by booth_id,zone_id,robot_id ) a where rank = 1 \
     ) ml left join maintenance.def_maint_list dml on ml.maint_code = dml.maint_code \
    ) \
    SELECT rc.booth_name, rc.booth_id, rc.zone_name, rc.zone_id, rc.robot_name,rc.robot_id, to_char(ml.time_stamp,'YYYY-MM-DD') last_check, ml.maint_code, ml.comment, ml.maint_cycle \
    FROM robot_layout_view rc \
    left join ml on ( rc.factory_id = ml.factory_id and rc.booth_id = ml.booth_id and rc.zone_id = ml.zone_id and rc.robot_id = ml.robot_id ) \
    WHERE rc.factory_id = ${
  req.body.factoryid}`;
  if (!commonModule.common.isEmpty(req.body.boothid)) {
    query
        += ` AND rc.booth_id = ${
        req.body.boothid}`;
  }
  if (!commonModule.common.isEmpty(req.body.zoneid)) {
    query
        += ` AND rc.zone_id = ${
        req.body.zoneid}`;
  }
  if (!commonModule.common.isEmpty(req.body.robotid)) {
    query
        += ` AND rc.robot_id = ${
        req.body.robotid}`;
  }
  query += ' ORDER BY robot_name;';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// userid 는 접속 id
// actiontype 은 0, 1 이고 0은 점검 X는 오류
// comment는 유저 입력 텍스트
maintenance.post('/data/insp/list/execute', (req, res) => {
  let query = `INSERT INTO maintenance.his_maint_list(\
        factory_id, \
        booth_id, \
        zone_id, \
        robot_id, \
        time_stamp, \
        maint_code, \
        comment, \
        user_id, \
        action_type) \
    VALUES(${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, now_timestamp(),'${
  req.body.maintcode
}','${
  req.body.comment
}', '${
  req.body.userid
}', ${
  req.body.actiontype
});`;
  commonModule.mainDB.execute(query, req.session.spsid, () => {
    query = `INSERT INTO maintenance.cur_robot_maint(\
            factory_id, \
            booth_id, \
            zone_id, \
            robot_id, \
            maint_code, \
            last_check_date) \
            VALUES(${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, '${
  req.body.maintcode
}',now_timestamp()::date) ON CONFLICT ON CONSTRAINT cur_robot_maint_pk DO UPDATE SET last_check_date = EXCLUDED.last_check_date;`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
  });
});

// 밸브 카운트
maintenance.post('/data/insp/list/valve', (req, res) => {
  const query = `with t as ( \
        select \
        unnest(valve_type) valve_type \
        , unnest(valve_name) valve_name \
        , unnest( ARRAY[valve1,valve2,valve3,valve4,valve5,valve6,valve7,valve8,valve9,valve10,valve11,valve12,valve13,valve14,valve15,valve16,valve17,\
            valve18,valve19,valve20,valve21,valve22,valve23,valve24,valve25,valve26,valve27,valve28,valve29,valve30,valve31,valve32,valve33,valve34,valve35,\
            valve36,valve37,valve38,valve39,valve40] ) as current_valvecount \
        from def_robot_config dr \
        left join defines.def_atomizer_config on atom_id = atom_model_id \
        left join cur_valve_data cv on ( cv.booth_id = ${
  req.body.boothid
} AND cv.zone_id = ${
  req.body.zoneid
} AND cv.robot_id = ${
  req.body.robotid
}) \
        where dr.booth_id = ${
  req.body.boothid
} AND dr.zone_id = ${
  req.body.zoneid
} AND dr.robot_id = ${
  req.body.robotid
}) \
        SELECT t.valve_name,t.current_valvecount \
        , ( SELECT valve_maint_count FROM maintenance.def_valvemaint_list b WHERE b.valve_type = t.valve_type) \
        , ( SELECT valve_name FROM maintenance.def_valvemaint_list b WHERE b.valve_type = t.valve_type) as valve_type \
        FROM t WHERE t.valve_name is not null;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 밸브 카운트 저장
maintenance.post('/data/insp/list/valve/execute', (req, res) => {
  let query = `INSERT INTO maintenance.his_maint_list(\
        factory_id, \
        booth_id, \
        zone_id, \
        robot_id, \
        time_stamp, \
        maint_code, \
        comment, \
        user_id, \
        action_type) \
    VALUES(${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, now_timestamp(),'${
  req.body.maintcode
}','${
  req.body.comment
}', '${
  req.body.userid
}', ${
  req.body.actiontype
});`;
  commonModule.mainDB.execute(query, req.session.spsid, () => {
    query = `UPDATE cur_valve_data \
        SET ${
  req.body.valve
} = 0, time_stamp = now_timestamp() WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
  });
});


// renew 하드웨어 수명 조회
maintenance.post('/renew/robot/pmhard', (req, res) => {
  const query = `SELECT * FROM main.his_robot_pmhard \
  WHERE robot_id in (${req.body.robotid}) and to_char(date_trunc('day', update_time_system), 'YYYY-MM-DD')\
  IN (SELECT max(to_char(date_trunc('day', update_time_system), 'YYYY-MM-DD')) from  main.his_robot_pmhard group by robot_id) \
  order by robot_id `
  commonModule.mainDB.execute(query, req.session.spsid, res);
})