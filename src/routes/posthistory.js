/* eslint-disable import/prefer-default-export */
/* eslint-disable no-plusplus */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const postHistory = express.Router();
export { postHistory };
const bodyParser = require('body-parser');
const commonModule = require('./app');

postHistory.use(bodyParser.urlencoded({ extended: true }));
postHistory.use(bodyParser.json());

postHistory.get('/', (req, res) => {
  res.status(200).send('Post History');
});

// 이력 조회
postHistory.post('/data/gridtable', (req, res) => {
  const query = `SELECT ua.ref_alarm_code AS alarm_code, ua.action_id,ua.action_title,string_agg(tag,',') tag,ua.time_stamp::date,(SELECT type_name_${
    commonModule.task.getGlobalLanguage()
  } FROM def_useraction_type where type_no = action_type) type_name,user_id \
    FROM his_user_action ua \
    left join rel_useraction_tags ut on ua.action_id = ut.action_id \
    left join hashtags tags on ut.tag_id = tags.tag_id \
    WHERE time_stamp BETWEEN '${
  req.body.prevtime
}' AND '${
  req.body.currtime
}' \
    GROUP BY ua.action_id,ua.action_title,ua.time_stamp,ua.remedy_message \
    order by time_stamp desc`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

postHistory.post('/data/update', (req, res) => {
  const query = `UPDATE his_history_list SET clear_action = '${
    req.body.clearaction
  }', cause = '${
    req.body.cause
  }' WHERE history_id = ${
    req.body.historyid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

postHistory.post('/data/create', (req, res) => {
  const query = `INSERT INTO his_history_list (history_id, factory_id, booth_id, zone_id, robot_id, DATE, occur_time, clear_time, dead_time, cause, clear_action, alarm_code, user_id, TYPE) \
    VALUES ((SELECT CASE WHEN (SELECT MAX (history_id) + 1 FROM his_history_list) IS NULL THEN 1 ELSE (SELECT MAX (history_id) + 1 \
    FROM his_history_list) END), ${
  req.body.factoryid
}, ${
  req.body.boothid
}, ${
  req.body.zoneid
}, ${
  req.body.robotid
}, '${
  req.body.date
}', '${
  req.body.occurtime
}', '${
  req.body.cleartime
}', ${
  req.body.deadtime
}, '${
  req.body.cause
}', '${
  req.body.clearaction
}', '${
  req.body.alarmcode
}', '${
  req.body.userid
}', ${
  req.body.type
})`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 알람내용 / 조치내용 받아오기
postHistory.post('/data/desc', (req, res) => {
  const query = `SELECT his_history_list.cause, his_history_list.clear_action \
    FROM his_history_list INNER JOIN def_robot_config ON def_robot_config.factory_id = his_history_list.factory_id \
    AND def_robot_config.booth_id = his_history_list.booth_id AND def_robot_config.zone_id = his_history_list.zone_id \
    AND def_robot_config.robot_id = his_history_list.robot_id INNER JOIN def_zone_config \
    ON def_robot_config.factory_id = def_zone_config.factory_id AND def_robot_config.booth_id = def_zone_config.booth_id \
    AND def_robot_config.zone_id = def_zone_config.zone_id INNER JOIN def_booth_config \
    ON def_zone_config.factory_id = def_booth_config.factory_id AND def_zone_config.booth_id = def_booth_config.booth_id \
    WHERE his_history_list.Date = '${
  req.body.date
}' AND occur_time = '${
  req.body.occurtime
}' AND clear_time = '${
  req.body.cleartime
}' AND his_history_list.factory_id = ${
  req.body.factoryid
} AND his_history_list.booth_id = ${
  req.body.boothid
} AND his_history_list.zone_id = ${
  req.body.zoneid
} AND his_history_list.robot_id = ${
  req.body.robotid
} ORDER BY his_history_list.history_id ASC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 리스트 row 아이템 선택 시 데이터 팝업 요청
postHistory.post('/data/popup', (req, res) => {
  const query = `SELECT * \
    FROM \
    his_user_action \
    WHERE action_id = ${
  req.body.actionid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 조건 별 이력페이지 조회
postHistory.post('/data/search', (req, res) => {
  let query = `SELECT ua.action_id,ua.action_title,string_agg(tag,',') tag,ua.time_stamp,(SELECT type_name_${
    commonModule.task.getGlobalLanguage()
  } FROM def_useraction_type where type_no = action_type) type_name,user_id \
    FROM his_user_action ua \
    left join rel_useraction_tags ut on ua.action_id = ut.action_id \
    left join hashtags tags on ut.tag_id = tags.tag_id \
    WHERE time_stamp BETWEEN '${
  req.body.prevtime
} 00:00:00' AND '${
  req.body.currtime} 23:59:59'`;
  if (!commonModule.common.isEmpty(req.body.title)) {
    query += ` and ua.action_title ilike '%${req.body.title}%'`;
  } else if (!commonModule.common.isEmpty(req.body.userid)) {
    query += ` and ua.user_id ilike '%${req.body.userid}%'`;
  } else if (!commonModule.common.isEmpty(req.body.typename)) {
    query += ` and action_type = (SELECT type_no FROM def_useraction_type WHERE type_name_${
      commonModule.task.getGlobalLanguage()
    } = '${req.body.typename}')`;
  } else if (!commonModule.common.isEmpty(req.body.alarmcode)) {
    query += ` and ref_alarm_code = '${req.body.alarmcode}'`;
  } else if (!commonModule.common.isEmpty(req.body.tag)) {
    query += ` and ua.action_id in (select distinct action_id from rel_useraction_tags WHERE tag_id in ( select tag_id from hashtags WHERE tag ilike '%${req.body.tag}%'))`;
  }
  query
    += 'GROUP BY ua.action_id,ua.action_title,ua.time_stamp,ua.remedy_message order by time_stamp desc';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 내용 삭제
postHistory.post('/data/delete', (req, res) => {
  const query = `DELETE FROM his_user_action WHERE action_id = ${req.body.actionid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 내용 변경
postHistory.post('/data/modify', (req, res) => {
  let cnt = null;
  const count = String(req.body.tags).match(/-/g);
  if (count == null) {
    cnt = 0;
  } else {
    cnt = count.length;
  }
  const insertValue = String(req.body.tags).split('-');
  let values = 'VALUES ';
  for (let idx = 0; idx < (cnt + 1); ++idx) {
    if (idx === (cnt)) {
      values += `('${insertValue[idx]}')`;
    } else {
      values += `('${insertValue[idx]}'),`;
    }
  }
  const query = `WITH del_rel AS ( \
        delete from rel_useraction_tags WHERE action_id = ${
  req.body.actionid
}), temp_tag AS ( \
        WITH all_tags ( NAME ) AS \
        ( ${
  values
}) \
        INSERT INTO hashtags ( tag ) SELECT NAME FROM all_tags ON CONFLICT ( tag ) DO UPDATE SET tag = EXCLUDED.tag RETURNING * \
       ),temp_action AS \
       ( \
       UPDATE his_user_action SET action_title = '${
  req.body.title
}', time_stamp = now_timestamp(), \
       cause_message = ${
  req.body.cause
}, remedy_message = '${
  req.body.remedy
}', factory_id = ${
  req.body.factoryid
}, booth_id = ${
  req.body.boothid
}, zone_id = ${
  req.body.zoneid
}, robot_id = ${
  req.body.robotid
}, ref_alarm_code= '${
  req.body.alarmcode
}', start_deadtime = ${
  req.body.startdeadtime
}, end_deadtime = ${
  req.body.enddeadtime
}, deadtime = ${
  req.body.deadtime
} WHERE action_id = ${
  req.body.actionid
} RETURNING * ) INSERT INTO rel_useraction_tags ( action_id, tag_id ) SELECT action_id, tag_id FROM temp_tag, temp_action ON CONFLICT (action_id,tag_id) DO UPDATE SET tag_id = EXCLUDED.tag_id, action_id = EXCLUDED.action_id;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});
