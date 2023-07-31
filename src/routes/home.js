/* eslint-disable import/prefer-default-export */
/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');
const { flattenDeep, isNull } = require('lodash');
const home = express.Router();
export { home };
const bodyParser = require('body-parser');
const commonModule = require('./app');

home.use(bodyParser.urlencoded({ extended: true }));
home.use(bodyParser.json());
const predict = require('./home/predict');

home.use('/predict', predict.predict);

home.get('/', (req, res) => {
  res.status(200).send('Home');
});

const getPredictAnalysisItems = (query) => {
  return new Promise((resolve, reject) => {
      try {
          commonModule.mainDB.dbClient.query(query, (err, res) => {
              res === undefined ? reject(new Error(err)) : resolve(res.rows);
          })
      } catch (error) {
          reject(new Error(error));
      }
  })
}

const convertToFlatArray = (items) => {
    const sortItems = items.length > 0 ? items.sort((a,b) => b.violation_count - a.violation_count) : [];
    return sortItems.length > 0 ? sortItems.reduce((acc, val) => acc.concat(val), []).sort((a, b) => { return Number(b.violation_level !== null ? b.violation_level : 0) - Number(a.violation_level !== null ? a.violation_level : 0) }) : [];
}

const convertToPredictCountArray = (axis, items) => {
    const predictArr = new Array(axis).fill(0);
    items.forEach(item => {
        !isNull(item) && Array.isArray(item) && item.forEach((axisItem, axisItemIdx) => {
            predictArr[axisItemIdx] += axisItem;
        })
    })
    return predictArr;
}


const convertToPredictLevelArray = (axis, items) => {
    let predictArr = new Array(axis).fill(null).map(() => { return new Array() });
    items.forEach((item, itemIdx) => {
        (!isNull(item) && Array.isArray(item)) && item.forEach((axisItem, axisItemIdx) => {
            predictArr[axisItemIdx].push(axisItem);
        })
        predictArr = (items.length - 1) === itemIdx ? predictArr.map(predictLevelItem => {
            return predictLevelItem.includes(1) ? 1 : 0;
        }) : predictArr;
    })
    return predictArr;
}
// 홈 화면 부스 모니터링
home.get('/status/info', (req, res) => {
  const query = 'WITH t AS (SELECT c.booth_id, c.zone_id, c.robot_id, CASE WHEN c.robot_status = 4 or a.atomizer_alarm = 1 THEN 4 ELSE c.robot_status END AS robot_status FROM cur_robot_data c join cur_plc_data a on (c.robot_id = a.robot_id)) SELECT booth_id, robot_status, count(robot_status) AS count FROM t group by booth_id, robot_status';
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 홈 화면 부스 모니터링 - POST
home.post('/status/info', (req, res) => {
  const query = `WITH t AS (\
        SELECT c.booth_id, c.zone_id, c.robot_id, \
        CASE WHEN \
        c.robot_status = 4 or a.atomizer_alarm = 1 \
        THEN 4 ELSE c.robot_status END AS robot_status \             
        FROM \
        cur_robot_data c join cur_plc_data a on (c.robot_id = a.robot_id)) \
        SELECT booth_id, robot_status, count(robot_status) AS count \
        FROM t \
        WHERE booth_id = ${req.body.boothid
} group by booth_id, robot_status`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 홈화면 알람 목록
home.get('/alarm/list', (req, res) => {
  const query = `SELECT alarm_name, time_stamp, alarm_code, alarm_id, alarm_status, \
    (SELECT booth_name FROM def_booth_config AS booth WHERE booth.booth_id = al.booth_id), \
    (SELECT zone_name FROM def_zone_config AS zone WHERE zone.zone_id = al.zone_id), \
    (SELECT robot_name FROM def_robot_config AS robot WHERE robot.robot_id = al.robot_id ), \
    (SELECT type_name_${
  commonModule.task.getGlobalLanguage()
} FROM def_alarm_type AS alarm WHERE alarm.type_no = al.alarm_type), \
    alarm_content \
    FROM \
    his_alarm_list AS al WHERE alarm_type in (0,3,4) and time_stamp > now_timestamp() - interval'2 d' and alarm_status = 0\
    ORDER BY time_stamp desc;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 홈화면 유지보수 현황
home.post('/maintenance/list', (req, res) => {
  const query = `select dm.maint_point, dm.maint_code, dm.maint_name_${
    commonModule.task.getGlobalLanguage()
  } AS maint_name, ( SELECT sub_name FROM def_spare_sub_group WHERE sub_id = dm.unit_id ) AS unit,dm.maint_cycle,dm.maint_description_${
    commonModule.task.getGlobalLanguage()
  },dm.etc, dm.file_name \
    , round(( cast ( sum(CASE WHEN ( now_timestamp ( ) - cm.last_check_date ) > CAST (  dm.maint_cycle || ' ' || ' month' AS INTERVAL ) THEN 0 ELSE 1 END) AS DOUBLE PRECISION ) / count(*)) * 100)  AS progress \
    FROM maintenance.def_maint_list dm left join maintenance.cur_robot_maint cm ON ( dm.maint_code = cm.maint_code and cm.factory_id = ${
  req.body.factoryid
}) \
    GROUP BY dm.maint_code,dm.maint_name_${
  commonModule.task.getGlobalLanguage()
},dm.unit_id,dm.maint_cycle,dm.maint_description_${
  commonModule.task.getGlobalLanguage()
},dm.etc, dm.file_name;`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 홈화면 알람 차트
// 오늘자 시간별 알람 발생
// x label : time (hour),
// y count or DT
// line
home.get('/alarm/chart', (req, res) => {
  const query = "SELECT date_part('hour',time_stamp) AS hour, count(*), MAX(COALESCE(ROUND(EXTRACT(epoch FROM ( update_time - time_stamp )) / 60), 0)) AS DT FROM his_alarm_list al WHERE alarm_status = 1 AND alarm_type in (0,3,4) AND time_stamp::date = now_timestamp()::date GROUP BY date_part('hour',time_stamp);";
  commonModule.mainDB.execute(query, req.session.spsid, res);
});

const setAccumAxisViolationLevelArr = (jobCount, countItems) => {
    return countItems.map(countItem => {
        return countItem > (Number(jobCount) * 0.1) ? 1 : 0;
    })
}

/** 어제 기준 예지보전 적산 알람 분석 결과 */
home.get('/predict/analysis/accum', (req, res) => {
    const query = `SELECT robot_id, robot_name, zone_id, zone_name, type, SUM(job_count::integer) AS job_count, (cart + axis_count) as robot_axis, array_agg(torque_accum_data ->> 'violation_count') as axis_accum_violation_count, array_agg(torque_accum_data ->> 'violation_level') as axis_accum_violation_level FROM ( SELECT main.his_daily_report.robot_id, main.robot_config.robot_name, \
    main.his_daily_report.zone_id, main.zone_config.zone_name, CASE WHEN main.robot_config.tool_id = 2 OR main.robot_config.rc_model_id = 0 THEN 'torque_accum_avg' ELSE 'torque_accum' END AS type, CASE WHEN main.robot_config.tool_id = 2 OR main.robot_config.rc_model_id = 0 THEN null ELSE torque_accum_data ->> 'job_count' END AS job_count, CASE WHEN main.robot_config.tool_id = 2 OR main.robot_config.rc_model_id = 0 THEN torque_accum_avg_data ELSE torque_accum_data END AS torque_accum_data, CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart, main.def_robot_model.axis_count FROM main.his_daily_report INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id \
    INNER JOIN main.zone_config ON main.his_daily_report.zone_id = main.zone_config.zone_id INNER JOIN main.def_robot_model ON main.robot_config.robot_model_id = main.def_robot_model.robot_model_id WHERE date BETWEEN (current_date - INTERVAL'1 WEEK')::date - 1 AND current_date) T GROUP BY robot_id, robot_name, zone_id, zone_name, robot_axis, type`;
    getPredictAnalysisItems(query).then(result => {
        const predictAnalysisItems = result.length > 0 ? result : [];
        const predictAnalysisAccumItems = predictAnalysisItems.length > 0 && predictAnalysisItems.map(predictAnalysisItem => {
            const { robot_id, robot_name, zone_id, zone_name, type, job_count, robot_axis, axis_accum_violation_count, axis_accum_violation_level } = predictAnalysisItem;
            const axisViolationCountArr = axis_accum_violation_count === null ? new Array(robot_axis).fill(null) : convertToPredictCountArray(robot_axis, axis_accum_violation_count.map(accumViolationCount => JSON.parse(accumViolationCount)));
            const axisViolationLevelArr = type === 'torque_accum_avg' ? (axis_accum_violation_level === null ? new Array(robot_axis).fill(0) : convertToPredictLevelArray(robot_axis, axis_accum_violation_level.map(accumViolationLevel => JSON.parse(accumViolationLevel)))) : setAccumAxisViolationLevelArr(job_count, axisViolationCountArr);
            const predictAnalysisAccumItem = axisViolationCountArr.map((count, index) => {
                return {
                    robot_id: robot_id,
                    robot_name: robot_name,
                    zone_id: zone_id,
                    zone_name: zone_name,
                    violation_count: count,
                    violation_level: axisViolationLevelArr[index],
                    axis: (index+1)
                }
            })
            return predictAnalysisAccumItem;
        })
        res.status(200).send(convertToFlatArray(predictAnalysisAccumItems));
    }).catch(error => {
        res.status(400).send(error);
    })
});

/** 어제 기준 예지보전 온도 알람 분석 결과 */
home.get('/predict/analysis/temperature', (req, res) => {
    const query = `SELECT robot_id, robot_name, zone_id, zone_name, (cart + axis_count) as robot_axis, array_agg(temperature ->> 'violation_count') as axis_temperature_violation_count, array_agg(temperature ->> 'violation_level') as axis_temperature_violation_level FROM ( SELECT main.his_daily_report.robot_id, main.robot_config.robot_name, \
    main.his_daily_report.zone_id, main.zone_config.zone_name, temperature, CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart, main.def_robot_model.axis_count FROM main.his_daily_report INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id \
    INNER JOIN main.zone_config ON main.his_daily_report.zone_id = main.zone_config.zone_id INNER JOIN main.def_robot_model ON main.robot_config.robot_model_id = main.def_robot_model.robot_model_id WHERE date BETWEEN (current_date - INTERVAL'1 WEEK')::date - 1 AND current_date) T GROUP BY robot_id, robot_name, zone_id, zone_name, robot_axis`;

    getPredictAnalysisItems(query).then(result => {
        const predictAnalysisItems = result.length > 0 ? result : [];
        const predictAnalysisTemperatureItems = predictAnalysisItems.length > 0 && predictAnalysisItems.map(predictAnalysisItem => {
            const { robot_id, robot_name, zone_id, zone_name, robot_axis, axis_temperature_violation_count, axis_temperature_violation_level } = predictAnalysisItem;
            const axisViolationCountArr = axis_temperature_violation_count === null ? new Array(robot_axis).fill(null) : convertToPredictCountArray(robot_axis, axis_temperature_violation_count.map(temperatureViolationCount => JSON.parse(temperatureViolationCount)));
            const axisViolationLevelArr = axis_temperature_violation_level === null ? new Array(robot_axis).fill(0) : convertToPredictLevelArray(robot_axis, axis_temperature_violation_level.map(temperatureViolationLevel => JSON.parse(temperatureViolationLevel)));
            const predictAnalysisTemperatureItem = axisViolationCountArr.map((count, index) => {
                return {
                    robot_id: robot_id,
                    robot_name: robot_name,
                    zone_id: zone_id,
                    zone_name: zone_name,
                    violation_count: count,
                    violation_level: axisViolationLevelArr[index],
                    axis: (index+1)
                }
            })
            return predictAnalysisTemperatureItem;
        })
        res.status(200).send(convertToFlatArray(predictAnalysisTemperatureItems));
    }).catch(error => {
        res.status(400).send(error);
    })
})

/** 어제 기준 예지보전 pmtorque 알람 분석 결과 */
home.get('/predict/analysis/pm-torque', (req, res) => {
    const query = `SELECT robot_id, robot_name, zone_id, zone_name, (cart + axis_count) as robot_axis, array_agg(pmtorque ->> 'violation_count') as axis_pmtorque_violation_count, array_agg(pmtorque ->> 'violation_level') as axis_pmtorque_violation_level FROM ( SELECT main.his_daily_report.robot_id, main.robot_config.robot_name, \
    main.his_daily_report.zone_id, main.zone_config.zone_name, pmtorque, CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart, main.def_robot_model.axis_count FROM main.his_daily_report INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id \
    INNER JOIN main.zone_config ON main.his_daily_report.zone_id = main.zone_config.zone_id INNER JOIN main.def_robot_model ON main.robot_config.robot_model_id = main.def_robot_model.robot_model_id WHERE date BETWEEN (current_date - INTERVAL'1 WEEK')::date - 1 AND current_date) T
    GROUP BY robot_id, robot_name, zone_id, zone_name, robot_axis`;

    getPredictAnalysisItems(query).then(result => {
        const predictAnalysisItems = result.length > 0 ? result : [];
        const predictAnalysisPMTorqueItems = predictAnalysisItems.length > 0 && predictAnalysisItems.map(predictAnalysisItem => {
            const { robot_id, robot_name, zone_id, zone_name, robot_axis, axis_pmtorque_violation_count, axis_pmtorque_violation_level } = predictAnalysisItem;
            const axisViolationCountArr = axis_pmtorque_violation_count === null ? new Array(robot_axis).fill(null) : convertToPredictCountArray(robot_axis, axis_pmtorque_violation_count.map(pmTorqueViolationCount => JSON.parse(pmTorqueViolationCount)));
            const axisViolationLevelArr = axis_pmtorque_violation_level === null ? new Array(robot_axis).fill(0) : convertToPredictLevelArray(robot_axis, axis_pmtorque_violation_level.map(pmTorqueViolationLevel => JSON.parse(pmTorqueViolationLevel)));
            const predictAnalysisPMTorqueItem = axisViolationCountArr.map((count, index) => {
                return {
                    robot_id: robot_id,
                    robot_name: robot_name,
                    zone_id: zone_id,
                    zone_name: zone_name,
                    violation_count: count,
                    violation_level: axisViolationLevelArr[index],
                    axis: (index+1)
                }
            })
            return predictAnalysisPMTorqueItem;
        })
        res.status(200).send(convertToFlatArray(predictAnalysisPMTorqueItems));
    }).catch(error => {
        res.status(400).send(error);
    })
})

home.get('/predict/analysis/atomizer', (req, res) => {
    const query = `SELECT robot_id, robot_name, zone_id, zone_name, array_agg(raw_data_atomizer ->> 'violation_count') AS raw_data_atomizer_violation_count, array_agg(raw_data_atomizer ->> 'violation_level') AS raw_data_atomizer_violation_level FROM (
    SELECT main.his_daily_report.robot_id, main.robot_config.robot_name, main.his_daily_report.zone_id, main.zone_config.zone_name, main.his_daily_report.raw_data_atomizer FROM main.his_daily_report INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id
    INNER JOIN main.zone_config ON main.his_daily_report.zone_id = main.zone_config.zone_id  WHERE date BETWEEN (current_date - INTERVAL'1 WEEK')::date - 1 AND current_date) T GROUP BY robot_id, robot_name, zone_id, zone_name`;

    getPredictAnalysisItems(query).then(result => {
        const predictAnalysisItems = result.length > 0 ? result : [];
        const predictAnalysisAtomierItems = predictAnalysisItems.length > 0 ? predictAnalysisItems.map(predictAnalysisItem => {
            const { robot_id, robot_name, zone_id, zone_name, raw_data_atomizer_violation_count, raw_data_atomizer_violation_level } = predictAnalysisItem;
            const rawViolationCount = raw_data_atomizer_violation_count === null ? 0 : flattenDeep(raw_data_atomizer_violation_count.map(atomierViolationCount => JSON.parse(atomierViolationCount))).reduce((a,b) => a+b, 0);
            const rawViolationLevel = raw_data_atomizer_violation_level === null ? 0 : (flattenDeep(raw_data_atomizer_violation_level.map(atomizerViolationLevel => JSON.parse(atomizerViolationLevel))).includes(1) ? 1 : 0);
            return {
                robot_id: robot_id,
                robot_name: robot_name,
                zone_id: zone_id,
                zone_name: zone_name,
                violation_count: rawViolationCount,
                violation_level: rawViolationLevel
            }
        }) : predictAnalysisItems;
        res.status(200).send(convertToFlatArray(predictAnalysisAtomierItems));
    }).catch(error => {
        res.status(400).send(error);
    })
})

home.get('/zone-alarm/statistics', (req, res) => {
    const query = `WITH zone_alarm_list AS ( SELECT COALESCE(COUNT(main.his_zone_alarm.zone_id), 0) AS count, main.zone_config.zone_id, main.zone_config.zone_name, main.zone_config.disp_booth_id, main.zone_config.zone_no FROM main.zone_config LEFT JOIN main.his_zone_alarm ON main.zone_config.zone_id = main.his_zone_alarm.zone_id 
    AND status = 1 AND level > 0 AND warning = false AND update_time BETWEEN current_date AND current_date + 1 GROUP BY main.zone_config.zone_id, main.zone_config.zone_name, main.zone_config.disp_booth_id, main.zone_config.zone_no ) SELECT count, zone_id, zone_name, disp_booth_id, zone_no, booth_name
    FROM zone_alarm_list INNER JOIN main.booth_config on zone_alarm_list.disp_booth_id = main.booth_config.booth_id ORDER BY disp_booth_id, zone_no`;

    commonModule.mainDB.execute(query, req.session.spsid, res);
})

home.get('/zone-alarm/statistics/zone', (req, res) => {
    const query = `WITH zone_alarm_count AS ( SELECT zone_id, type_id, COUNT(alarm_id) AS alarm_count FROM main.his_zone_alarm WHERE update_time BETWEEN current_date AND current_date + 1 AND level >= 1 AND status = 1 AND warning = false GROUP BY zone_id, type_id ORDER BY zone_id ) SELECT main.zone_config.zone_id,
    main.zone_config.zone_name, COALESCE( (SELECT alarm_count FROM zone_alarm_count WHERE main.zone_config.zone_id = zone_alarm_count.zone_id AND zone_alarm_count.type_id = 1), 0) AS system, COALESCE( (SELECT alarm_count FROM zone_alarm_count WHERE main.zone_config.zone_id = zone_alarm_count.zone_id AND
    zone_alarm_count.type_id = 2), 0) AS sprayers, COALESCE( (SELECT alarm_count FROM zone_alarm_count WHERE main.zone_config.zone_id = zone_alarm_count.zone_id AND zone_alarm_count.type_id = 3), 0) AS zone, COALESCE( (SELECT alarm_count FROM zone_alarm_count WHERE main.zone_config.zone_id = zone_alarm_count.zone_id AND zone_alarm_count.type_id = 4), 0) AS vision, 
    COALESCE( (select sum(alarm_count) from zone_alarm_count where main.zone_config.zone_id = zone_alarm_count.zone_id group by main.zone_config.zone_id), 0 ) as violation_count FROM main.zone_config ORDER BY violation_count DESC`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

home.get('/zone-alarm/statistics/code', (req, res) => {
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT main.his_zone_alarm.type_id, type_name_${language} AS type_name, COUNT(main.his_zone_alarm.type_id) AS violation_count FROM main.his_zone_alarm INNER JOIN main.def_alarm_type ON main.his_zone_alarm.type_id = main.def_alarm_type.type_id WHERE update_time BETWEEN current_date AND current_date + 1  AND status = 1 AND level >= 1 AND warning = false \
    GROUP BY main.his_zone_alarm.type_id, type_name`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

home.get('/robot-alarm/statistics', (req, res) => {
    const query = `WITH robot_alarm_list AS ( SELECT COALESCE(count(main.his_robot_alarm.robot_id), 0) AS count, main.robot_config.robot_id, main.robot_config.robot_name, main.robot_config.robot_no, main.robot_config.zone_id FROM main.robot_config LEFT JOIN main.his_robot_alarm ON main.robot_config.robot_id = main.his_robot_alarm.robot_id
    AND update_time BETWEEN current_date and current_date + 1 GROUP BY main.robot_config.robot_id, main.robot_config.robot_name, main.robot_config.zone_id, main.robot_config.robot_no ) SELECT count, robot_id, robot_name, robot_no, robot_alarm_list.zone_id, zone_name, main.zone_config.disp_booth_id, main.zone_config.zone_no,
    (SELECT booth_name FROM main.booth_config WHERE main.zone_config.disp_booth_id = booth_id) FROM robot_alarm_list INNER JOIN main.zone_config ON robot_alarm_list.zone_id = main.zone_config.zone_id ORDER BY disp_booth_id, zone_no, robot_no`;

    commonModule.mainDB.execute(query, req.session.spsid, res);
})

home.get('/robot-alarm/statistics/robot', (req, res) => {
    const query = `SELECT main.robot_config.robot_id, main.robot_config.robot_name, main.zone_config.zone_id, main.zone_config.zone_name, coalesce(T.alarm_count, 0) AS violation_count FROM main.robot_config \
    INNER JOIN main.zone_config ON main.robot_config.zone_id = main.zone_config.zone_id LEFT OUTER JOIN ( SELECT robot_id, COUNT(alarm_id) as alarm_count FROM main.his_robot_alarm WHERE update_time BETWEEN current_date AND current_date + 1 
    GROUP BY robot_id) as T ON main.robot_config.robot_id = T.robot_id ORDER BY alarm_count DESC`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

home.get('/robot-alarm/statistics/code', (req, res) => {
    const query = `SELECT code AS alarm_code, count(code) AS violation_count, name AS alarm_contents FROM main.his_robot_alarm WHERE update_time BETWEEN current_date AND current_date + 1 GROUP BY alarm_code, alarm_contents ORDER BY violation_count DESC`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})







