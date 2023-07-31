const express = require('express');

const statistics = express.Router();
export { statistics };
const bodyParser = require('body-parser');
const commonModule = require('../app');

statistics.use(bodyParser.urlencoded({ extended: true }));
statistics.use(bodyParser.json());

statistics.get('/', (req, res) => {
    res.status(200).send('alarm-statistics');
});

const dbClientQuery = (query) => {
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

statistics.get('/alarm-type', (req, res) => {
    const language = commonModule.task.getGlobalLanguage();
    const query = {
        text: `SELECT type_id AS id, type_name_${language} AS name FROM main.def_alarm_type`,
        values: []
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

const setAlarmConditions = (params) => {
    const conditions = [];
    if (params) {
        const conditionMappings = {
            boothId: 'zc.booth_id',
            zoneId: 'zc.zone_id',
            robotId: 'a.robot_id',
            alarmLevel: 'level',
            alarmType: 't.type_id',
        };

        for (const key in conditionMappings) {
            if (params[key]) {
                let conditionValue = params[key];
                key === 'alarmLevel'
                    ? (conditionValue = `IN ${conditionValue}`)
                    : (conditionValue = `= ${conditionValue}`);
                conditions.push(`${conditionMappings[key]} ${conditionValue}`);
            }
        }
    }
    return conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';
};

const getZoneAlarmChartItems = (params) => {
    const { prevDate, currDate } = params;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(params);

    const query = {
        text: `SELECT to_char(update_time::timestamp, 'YYYY-MM-DD') AS date, count(update_time) FROM main.his_zone_alarm a INNER JOIN main.zone_config zc ON zc.zone_id = a.zone_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id WHERE update_time between $1 and $2 AND
        status = 1 and warning = false${conditions} GROUP BY date ORDER BY date;`,
        values: [startDate, endDate]
    }
    return dbClientQuery(query);
}

const getRobotAlarmChartItems = (params) => {
    const { prevDate, currDate } = params;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(params);
    const query = {
        text: `SELECT to_char(update_time::timestamp, 'YYYY-MM-DD') AS date, count(update_time) FROM main.his_robot_alarm a INNER JOIN main.robot_config rc ON rc.robot_id = a.robot_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id INNER JOIN main.zone_config zc ON zc.zone_id = rc.zone_id
        INNER JOIN main.booth_config bc ON bc.booth_id = zc.booth_id WHERE update_time between $1 and $2 AND t.type_id = 0${conditions} GROUP BY date ORDER BY date;`,
        values: [startDate, endDate]
    }
    return dbClientQuery(query);
}

statistics.get('/chart', async(req, res) => {
    if(commonModule.sess.requestAuth(req.session.spsid)) {
        const zoneAlarmChartItemsResult = await getZoneAlarmChartItems(req.query);
        const zoneAlarmChartItems = zoneAlarmChartItemsResult.length > 0 ? zoneAlarmChartItemsResult : [];
        const robotAlarmChartItemsResult = await getRobotAlarmChartItems(req.query);
        const robotAlarmChartItems = robotAlarmChartItemsResult.length > 0 ? robotAlarmChartItemsResult : [];
        res.status(200).send({zone: zoneAlarmChartItems, robot: robotAlarmChartItems});
    } else {
        res.status(404).send('not login');
    }
});

statistics.get('/sum/zone/alarm', (req, res) => {
    const { prevDate, currDate } = req.query;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(req.query);
    const query = {
        text: `SELECT zc.booth_id, zc.zone_id, zc.zone_name, t.type_id, t.type_name_kr AS alarm_type_name, contents AS alarm_name, code AS alarm_code, COUNT(code)::integer AS sum, level
          FROM main.his_zone_alarm a INNER JOIN main.zone_config zc ON zc.zone_id = a.zone_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id  
          WHERE update_time between $1 and $2
          GROUP BY booth_id, a.robot_id, zc.zone_id, zc.zone_name, t.type_id, t.type_name_kr, contents, code, level, warning, status 
          HAVING status = 1 AND warning = false${conditions} ORDER BY level DESC, sum DESC;`,
        values: [startDate, endDate],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

statistics.get('/sum/robot/alarm', (req, res) => {
    const { prevDate, currDate } = req.query;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(req.query);
    const query = {
        text: `SELECT bc.booth_id, zc.zone_id, zc.zone_name, a.robot_id, rc.robot_name, t.type_id, t.type_name_kr as alarm_type_name, a.name as alarm_name, a.code as alarm_code, COUNT(a.code)::integer AS sum
          FROM main.his_robot_alarm a INNER JOIN main.robot_config rc ON rc.robot_id = a.robot_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id INNER JOIN main.zone_config zc ON zc.zone_id = rc.zone_id INNER JOIN main.booth_config bc ON bc.booth_id = zc.booth_id
          WHERE update_time between $1 and $2 and t.type_id = 0${conditions}
          GROUP BY bc.booth_id, zc.zone_id, zc.zone_name, a.robot_id, rc.robot_name, t.type_id, t.type_name_kr,a.name,a.level, a.code;`,
        values: [startDate, endDate],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

const getZoneAlarmItems = (params) => {
    const { prevDate, currDate } = params;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(params);
    const query = {
        text: `SELECT alarm_id, zc.booth_id, zc.zone_id, zc.zone_name, t.type_id, t.type_name_kr AS alarm_type_name, contents AS alarm_name, code AS alarm_code, job_name, level, to_char(update_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')AS time_stamp
          FROM main.his_zone_alarm a INNER JOIN main.zone_config zc ON zc.zone_id = a.zone_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id 
          WHERE update_time between $1 and $2 and status = 1 and warning = false${conditions} ORDER BY update_time DESC`,
        values: [startDate, endDate],
    };
    return dbClientQuery(query);
}

const getRobotAlarmItems = (params) => {
    const { prevDate, currDate } = params;
    const startDate = prevDate + ' 00:00:00';
    const endDate = currDate + ' 23:59:59';
    const conditions = setAlarmConditions(params);
    const query = {
        text: `SELECT alarm_id, a.robot_id, rc_model_id, code as alarm_code, sub_code, name as alarm_name, t.type_id, CASE WHEN level = 2 THEN 99 ELSE level END, job_name, line_no, step_no, to_char(update_time::timestamp, 'YYYY-MM-DD HH24:MI:SS')AS time_stamp, axis_info, disp_alarm_axis, robot_name, t.type_name_kr as alarm_type_name, zone_name, rc.zone_id, zc.booth_id
          FROM main.his_robot_alarm a INNER JOIN main.robot_config rc ON rc.robot_id = a.robot_id INNER JOIN main.def_alarm_type t ON t.type_id = a.type_id INNER JOIN main.zone_config zc ON zc.zone_id = rc.zone_id INNER JOIN main.booth_config bc ON zc.booth_id = zc.booth_id
          WHERE update_time between $1 and $2 and t.type_id = 0${conditions}
          GROUP BY alarm_id, a.robot_id, rc_model_id, code, sub_code, name, t.type_id, level, job_name, line_no, step_no, update_time, axis_info, disp_alarm_axis, robot_name, type_name_kr, zone_name, rc.zone_id, zc.booth_id ORDER BY update_time DESC`,
        values: [startDate, endDate],
    };
    return dbClientQuery(query);
}

statistics.get('/entire/alarm', async(req, res) => {
    if(commonModule.sess.requestAuth(req.session.spsid)) {
        const zoneAlarmItemsResult = await getZoneAlarmItems(req.query);
        const zoneAlarmItems = zoneAlarmItemsResult.length > 0 ? zoneAlarmItemsResult : [];
        const robotAlarmItemsResult = await getRobotAlarmItems(req.query);
        const robotAlarmItems = robotAlarmItemsResult.length > 0 ? robotAlarmItemsResult : [];
        const entireAlarmItems = [...zoneAlarmItems, ...robotAlarmItems].sort((a, b) => {
            if (a.update_time > b.update_time) return 1;
            if (a.update_time < b.update_time) return -1;
        })
        res.status(200).send(entireAlarmItems);
    } else {
        res.status(404).send('not login');
    }
})