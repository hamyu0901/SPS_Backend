/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const robotdetails = express.Router();
export { robotdetails };
const bodyParser = require('body-parser');

const commonModule = require('./app');

robotdetails.use(bodyParser.urlencoded({ extended: true }));
robotdetails.use(bodyParser.json());

robotdetails.get('/', (req, res) => {
  res.status(200).send('robotdetails');
});

// 주소
// robotdetails/robot/type

// 로봇 타입
// 0 : 오프너
// 1 : 중/상도
// 2 : 하도
robotdetails.post('/robot/type', (req, res) => {
  const query = `SELECT robot_type FROM def_robot_config WHERE factory_id = ${
    req.body.factoryid
  } AND booth_id = ${
    req.body.boothid
  } AND zone_id = ${
    req.body.zoneid
  } AND robot_id = ${
    req.body.robotid}`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 로봇 - flow 트렌드
robotdetails.post('/robot/trend/sealer/flow', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp), \
  ROUND(AVG(flow_cmd)) as flow_cmd, ROUND(AVG(flow_feedback)) as flow_feedback FROM his_sealer_data WHERE factory_id =${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 로봇 - swirl 트렌드
robotdetails.post('/robot/trend/sealer/swirl', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp), \
    ROUND(AVG(swirl_cmd)) as swirl_cmd, ROUND(AVG(swirl_feedback)) as swirl_feedback FROM his_sealer_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 로봇 - masking unit speed (for only cmd)
robotdetails.post('/robot/trend/sealer/maskingunitspeed', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp), \
    ROUND(AVG(masking_unit_speed_cmd)) as masking_unit_speed_cmd FROM his_sealer_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 로봇 - pressure (for only feedback)
robotdetails.post('/robot/trend/sealer/pressure', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp), \
    ROUND(AVG(pressure_feedback)) as pressure_feedback FROM his_sealer_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇-모니터링 하단 실시간 차트 - SA_S
robotdetails.post('/robotinfo/trend/sa_s', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp),\
    ROUND(AVG(sa_s_cmd)) as sa_s_cmd, ROUND(AVG(sa_s_feedback)) as sa_s_feedback FROM his_plc_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇-모니터링 하단 실시간 차트 - flow
robotdetails.post('/robotinfo/trend/flow', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp),\
    ROUND(AVG(flow_cmd)) as flow_cmd, ROUND(AVG(flow_feedback)) as flow_feedback FROM his_plc_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇-모니터링 하단 실시간 차트 - hvolt
robotdetails.post('/robotinfo/trend/hvolt', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp),\
    ROUND(AVG(hv_cmd)) as hv_cmd, ROUND(AVG(hv_feedback)) as hv_feedback FROM his_plc_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇-모니터링 하단 실시간 차트 - turbin_speed
robotdetails.post('/robotinfo/trend/turbin_speed', (req, res) => {
  const query = `SELECT date_trunc('second',time_stamp),\
    ROUND(AVG(turbine_speed_cmd)) as turbin_speed_cmd, ROUND(AVG(turbine_speed_feedback)) as turbin_speed_feedback FROM his_plc_data WHERE factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp BETWEEN now_timestamp() - INTERVAL '15 second' AND now_timestamp() \
    GROUP BY date_trunc('second',time_stamp) ORDER BY date_trunc('second',time_stamp) ASC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇-모니터링 현재 상태 정보 및 모델정보
robotdetails.post('/robotinfo/table', (req, res) => {
  const query = `SELECT c.robot_mode_home,c.robot_mode_auto,c.robot_mode_teach,c.robot_mode_run,c.robot_mode_rins,c.robot_mode_bypass,c.main_air,c.spray_enable,c.hv_enable,r.pp_mode,r.servo_on,r.robot_status\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.rc_model_id ) AS rc_model\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.robot_model_id ) AS robot_model\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.atom_model_id ) AS atom_model,\
    d.install_date,\
    d.ip_addr \
    FROM cur_plc_data c JOIN cur_robot_data r ON (c.robot_id = r.robot_id) JOIN def_robot_config d ON ( c.robot_id = d.robot_id ) \
    WHERE c.factory_id = ${
  req.body.factoryid
}AND c.booth_id = ${
  req.body.boothid
}AND c.zone_id = ${
  req.body.zoneid
}AND c.robot_id = ${
  req.body.robotid
};`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 하도 로봇 모니터링 현재 상태 정보 및 모델 정보
robotdetails.post('/robotinfo/sealer/table', (req, res) => {
  const query = `SELECT c.robot_mode_home,c.robot_mode_auto,c.robot_mode_teach,c.robot_mode_run,c.robot_mode_rins,c.robot_mode_bypass,c.main_air,c.spray_enable,c.hv_enable,r.pp_mode,r.servo_on,r.robot_status\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.rc_model_id ) AS rc_model\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.robot_model_id ) AS robot_model\
    ,(SELECT model_name FROM def_model_config WHERE model_id = d.atom_model_id ) AS atom_model,\
    d.install_date,\
    d.ip_addr, \
    h.trigger1, \
    h.trigger2, \
    h.trigger3 \
    FROM cur_plc_data c JOIN cur_robot_data r ON (c.robot_id = r.robot_id) JOIN def_robot_config d ON ( c.robot_id = d.robot_id ) JOIN cur_sealer_data h ON (c.robot_id = h.robot_id) \
    WHERE c.factory_id = ${
  req.body.factoryid
}AND c.booth_id = ${
  req.body.boothid
}AND c.zone_id = ${
  req.body.zoneid
}AND c.robot_id = ${
  req.body.robotid
};`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 지난 24시간 로봇동작상태(분)
robotdetails.post('/robotinfo/prevchart', (req, res) => {
  const query = `with t3 as (\
        with t2 as (\
            with t as(\
                SELECT time_stamp,robot_status\
                , lag( robot_status ) over ( order by time_stamp asc ) tt_robotstatus FROM his_robot_data\
                WHERE factory_id = ${
  req.body.factoryid
}and booth_id = ${
  req.body.boothid
}and zone_id = ${
  req.body.zoneid
}and robot_id = ${
  req.body.robotid
}and time_stamp between now_timestamp() - interval '24 hour' and now_timestamp()\
                ORDER BY time_stamp asc\
            )\
            (select now_timestamp() - interval '24 hour' as time_stamp,robot_status,robot_status+1 as tt_robotstatus from t order by time_stamp asc limit 1) \
            UNION ALL\
            (select time_stamp,robot_status,coalesce(tt_robotstatus,robot_status) from t)\
            UNION ALL\
            (select now_timestamp(),robot_status,tt_robotstatus+1 from t order by time_stamp desc limit 1)\
            order by time_stamp asc\
        )\
        select flag, round(extract('epoch' FROM sum(duration)) / 60) as minutes \
        FROM (\
        SELECT time_stamp s_time, e_time, e_time - time_stamp as duration, 'robot_manual' flag \
        FROM ( \
                select *,(CASE robot_status WHEN 1 THEN LEAD(time_stamp) OVER ( order by time_stamp asc ) END ) e_time from t2\
                where (robot_status = 1 and tt_robotstatus <> 1) or (robot_status <> 1 and tt_robotstatus = 1 ) \
             ) a WHERE e_time is not null\
        ) temp group by flag\
        UNION\
        select flag, round(extract('epoch' FROM sum(duration)) / 60) as minutes \
        from (\
            SELECT time_stamp s_time, e_time, e_time - time_stamp as duration, 'robot_playback' flag\
            FROM (\
                select *,(CASE robot_status WHEN 2 THEN LEAD(time_stamp) OVER ( order by time_stamp asc ) END ) e_time\
                from t2\
                where (robot_status = 2 and tt_robotstatus <> 2) or (robot_status <> 2 and tt_robotstatus = 2 )\
            ) a\
            WHERE e_time is not null\
        ) temp group by flag\
        UNION\
        select flag, round(extract('epoch' FROM sum(duration)) / 60) as minutes\
        FROM (\
            SELECT time_stamp s_time, e_time, e_time - time_stamp as duration, 'robot_alarm' flag \
            FROM ( \
            select *,(CASE robot_status WHEN 4 THEN LEAD(time_stamp) OVER ( order by time_stamp asc ) END ) e_time\
            from t2\
            where (robot_status = 4 and tt_robotstatus <> 4) or (robot_status <> 4 and tt_robotstatus = 4 )\
            ) a\
            WHERE e_time is not null\
        ) temp group by flag\
        UNION\
        select flag, round(extract('epoch' FROM sum(duration)) / 60) as minutes \
        FROM (\
            SELECT time_stamp s_time, e_time, e_time - time_stamp as duration, 'robot_offline' flag\
            FROM (\
                select *,(CASE robot_status WHEN 0 THEN LEAD(time_stamp) OVER ( order by time_stamp asc ) END ) e_time\
                from t2\
                where (robot_status = 0 and tt_robotstatus <> 0) or (robot_status <> 0 and tt_robotstatus = 0 )\
            ) a\
            WHERE e_time is not null\
        ) temp group by flag\
    )\
    SELECT * FROM t3;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 현재 로봇 동작 상태
robotdetails.post('/robot/info/status', (req, res) => {
  const query = `with t as (\
    select c.booth_id,c.zone_id,c.robot_id,\
    CASE WHEN c.robot_status = 4 or a.atomizer_alarm = 1 THEN 4 ELSE c.robot_status END as robot_status\
    FROM cur_robot_data c \
    join cur_plc_data a on (c.robot_id = a.robot_id))\
    select booth_id,robot_status, count(robot_status) as count  from t \
    Where   zone_id =${
  req.body.zoneid
} and robot_id =${
  req.body.robotid
} and booth_id =${
  req.body.boothid
} group by booth_id,robot_status`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

robotdetails.post('/robotinfo/booth', (req, res) => {
  const query = `SELECT def_robot_config.robot_id,\
    (select model_name FROM def_model_config where model_id = def_robot_config.rc_model_id ) as robot_model ,\
    robot_name ,atom_model_id ,rc_model_id ,def_model_config.model_name ,\
    booth_name , zone_name , Ip_addr  , def_model_config.model_name as model2 , c.model_name  as atom_model ,\
    install_date ,pp_mode , servo_on ,main_air ,Spray_Enable ,hv_Enable  FROM def_robot_config\
    INNER JOIN def_model_config ON def_robot_config.robot_model_id = def_model_config.model_id\
    INNER JOIN def_booth_config ON def_robot_config.booth_id = def_booth_config.booth_id\
    AND def_robot_config.factory_id = def_booth_config.factory_id\
    INNER JOIN def_zone_config ON def_robot_config.booth_id = def_zone_config.booth_id\
    AND def_robot_config.factory_id = def_zone_config.factory_id\
    AND def_robot_config.zone_id = def_zone_config.zone_id\
    INNER JOIN def_model_config AS C ON def_robot_config.atom_model_id = C.model_id\
    INNER JOIN cur_plc_data ON cur_plc_data.robot_id = def_robot_config.robot_id\
    INNER JOIN cur_robot_data  ON cur_robot_data .robot_id = def_robot_config.robot_id\
    Where def_robot_config.factory_id =${
  req.body.factoryid
} And def_robot_config.booth_id =${
  req.body.boothid
}And def_robot_config.zone_id =${
  req.body.zoneid
}And def_robot_config.robot_id =${
  req.body.robotid
};`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

robotdetails.post('/robotinfo/alarm', (req, res) => {
  const query = `SELECT time_stamp, alarm_name, (SELECT robot_name FROM def_robot_config AS rc WHERE rc.robot_id = al.robot_id ), alarm_type, alarm_content \
    FROM \
    his_alarm_list AS al \
    WHERE \
    alarm_type in (0,3,4) and alarm_status = 0 \
    AND factory_id = ${
  req.body.factoryid
} AND booth_id = ${
  req.body.boothid
} AND zone_id = ${
  req.body.zoneid
} AND robot_id = ${
  req.body.robotid
} AND time_stamp > now_timestamp() - interval '2 days' ORDER BY time_stamp DESC;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 로봇 각 축의 엔코더 온도
robotdetails.post('/robot/temperature', (req, res) => {
  const query = `SELECT encoder_temper[1] t1,* FROM cur_robot_temperature \
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
