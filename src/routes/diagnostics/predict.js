/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const predict = express.Router();
export { predict };
const bodyParser = require('body-parser');
const commonModule = require('../app');
const isEmpty = require('lodash/isEmpty');
const flatten = require('lodash/flatten');

predict.use(bodyParser.urlencoded({ extended: true }));
predict.use(bodyParser.json());

const getPredictStatusItems = (query) => {
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

const DateType = {
    day: 0,
    week: 7,
    month: 30
}

const atomizerType = {
    turbine: 'turbine',
    sa_s: 'sa_s',
    sa_v: 'sa_v',
    hv: 'hv',
    alarm: 'alarm'
}

const convertToDateFilter = (dateType) => {
    return DateType[dateType];
}

const PredictType = {
    'accum_alarm_status': 'torque_accum_data',
    'pmtorque_alarm_status': 'pmtorque',
    'temperature_alarm_status': 'temperature',
    'accum_daily_alarm_status' : 'torque_accum_avg_data'
}

const convertToPredictFilter = (predictType) => {
    return PredictType[predictType];
}

const sumAccumViolationCountItems = (items, axis = null) => {
    const sumAccumViolationCountItems = items.map(item => {
        const accumViolationCountItems = item.accum_violation_count.map(accumViolationCount => JSON.parse(accumViolationCount));
        let violationCountArr =  new Array(axis !== null ? Number(axis) : accumViolationCountItems[0].length).fill(0);
        accumViolationCountItems.forEach((accumViolationCountItem, accumViolationCountItemIdx) => {
            accumViolationCountItem.forEach((accumViolationCount, accumViolationCountIdx) => {
                violationCountArr[accumViolationCountIdx] += accumViolationCount;
            })
            item.accum_violation_count = accumViolationCountItems.length - 1 === accumViolationCountItemIdx ? violationCountArr : item.accum_violation_count;
        })
        return item;
    })
    return sumAccumViolationCountItems;
}

const setAccumViolationLevelItems = (items, axis = null) => {
    const accumViolationCountItems = sumAccumViolationCountItems(items, axis);
    const accumViolationLevelItems = accumViolationCountItems.map(accumViolationCountItem => {
        accumViolationCountItem['accum_violation_level'] = accumViolationCountItem.accum_violation_count.map(accumViolationCount => {
            return accumViolationCount > (Number(accumViolationCountItem.job_count) * 0.1) ? 1 : 0;
        })
        return accumViolationCountItem;
    })
    return accumViolationLevelItems;
}
const mergeToAccumAlarmItems = (accumAlarmItems, alarmItems) => {
    const accumViolationLevelItems = setAccumViolationLevelItems(accumAlarmItems);
    const mergedAlarmItems = alarmItems.map(alarmItem => {
        accumViolationLevelItems.forEach(accumViolationLevelItem => {
            if( alarmItem.robot_id === accumViolationLevelItem.robot_id ) {
                const accumAlarmStatus = accumViolationLevelItem.accum_violation_level.reduce((a,b) => a+b, 0);
                alarmItem['accum_alarm_status'] = accumAlarmStatus;
            }
        })
        return alarmItem;
    })
    return mergedAlarmItems;
}

predict.get('/', (req, res) => {
    res.status(200).send('predict');
});

predict.get('/robot/alarm/status', (req, res) => {
    const { zoneId, prevDate } = req.query;

    const query = `SELECT robot_id, ARRAY_AGG((torque_accum_data ->> 'error_level')::integer) as accum_alarm_status, ARRAY_AGG((torque_accum_avg_data ->> 'error_level')::integer) as accum_daily_alarm_status, ARRAY_AGG((temperature ->> 'error_level')::integer) as temperature_alarm_status, \
    ARRAY_AGG((pmtorque ->> 'error_level')::integer) as pmtorque_alarm_status, ARRAY_AGG(( raw_data_atomizer->> 'error_level')::integer) as atomizer_alarm_status FROM main.his_daily_report WHERE zone_id = ${zoneId} AND date BETWEEN ${prevDate}::date AND CURRENT_DATE GROUP BY robot_id`;

    const accumQuery = `SELECT main.his_daily_report.robot_id,  SUM((torque_accum_data ->> 'job_count')::integer) AS job_count, ARRAY_AGG((torque_accum_data ->> 'violation_count')) AS accum_violation_count FROM main.his_daily_report
    INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id WHERE main.his_daily_report.zone_id = ${zoneId} AND date BETWEEN ${prevDate}::date AND CURRENT_DATE AND main.robot_config.tool_id != 2 AND
    main.robot_config.rc_model_id != 0 GROUP BY  main.his_daily_report.robot_id`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(query).then(result => {
            if(result.length > 0) {
                const alarmStatusItems = result.map(alarmStatusItem => {
                    let alarmStatusItemsObj = {};
                    Object.keys(alarmStatusItem).map(alarmStatusItemKey => {
                        alarmStatusItemsObj[alarmStatusItemKey] = (Array.isArray(alarmStatusItem[alarmStatusItemKey]) ? (alarmStatusItem[alarmStatusItemKey].includes(1) ? 1 : (alarmStatusItem[alarmStatusItemKey].includes(0) ? 0 : 2)) : alarmStatusItem[alarmStatusItemKey]);
                    })
                    return alarmStatusItemsObj;
                })
                getPredictStatusItems(accumQuery).then(accumResult => {
                    const robotAlarmStatusItems = accumResult.length > 0 ? mergeToAccumAlarmItems(accumResult, alarmStatusItems) : alarmStatusItems;
                    res.status(200).send(robotAlarmStatusItems);
                }).catch(error => {
                    res.status(404).send(error);
                })
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

predict.get('/axis/accum/alarm/status', (req, res) => {
    const { robotId, axisCount, prevDate } = req.query;
    const query = `SELECT main.his_daily_report.robot_id,  SUM((torque_accum_data ->> 'job_count')::integer) AS job_count, ARRAY_AGG((torque_accum_data ->> 'violation_count')) AS accum_violation_count FROM main.his_daily_report
    INNER JOIN main.robot_config ON main.his_daily_report.robot_id = main.robot_config.robot_id WHERE main.his_daily_report.robot_id = ${robotId} AND date BETWEEN ${prevDate}::date AND CURRENT_DATE AND main.robot_config.tool_id != 2 AND
    main.robot_config.rc_model_id != 0 GROUP BY  main.his_daily_report.robot_id`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(query).then(result => {
            if(result.length > 0) {
                const axisAccumViolationLevelItems = setAccumViolationLevelItems(result, axisCount);
                const axisAlarmStatusItems = axisAccumViolationLevelItems.map(axisAccumViolationLevelItem => {
                    let axisAccumAlarmStatusItemsObj = {};
                    axisAccumViolationLevelItem.accum_violation_level.forEach((axisViolationLevel, axisViolationLevelIdx) => {
                        axisAccumAlarmStatusItemsObj[`axis`+(axisViolationLevelIdx+1)] = axisViolationLevel;
                    })
                    return axisAccumAlarmStatusItemsObj;
                })
                res.status(200).send(axisAlarmStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
    : res.status(404).send('not login');

})

predict.get('/axis/alarm/status', (req, res) => {
    const { robotId, axisCount, prevDate, predictType } = req.query;
    let axisStatusQuery = '';
    for (let axis = 0; axis < axisCount; ++axis) {
        axisStatusQuery += axis !== axisCount-1? `ARRAY_AGG((${convertToPredictFilter(predictType)} ->> 'violation_level')::json ->> ${axis}) as axis${axis+1}, ` :
            `ARRAY_AGG((${convertToPredictFilter(predictType)} ->> 'violation_level')::json ->> ${axis}) as axis${axis+1}`;
    }
    const totalAxisStatusQuery = `SELECT ${axisStatusQuery} FROM main.his_daily_report WHERE robot_id =  ${robotId} AND date BETWEEN ${prevDate}::date AND CURRENT_DATE`;
    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(totalAxisStatusQuery).then(result => {
            if(result.length > 0) {
                const axisAlarmStatusItems = result.map(axisStatusItem => {
                    let axisAlarmStatusItemsObj = {};
                    Object.keys(axisStatusItem).map(axisStatusItemKey => {
                        axisAlarmStatusItemsObj[axisStatusItemKey] = (Array.isArray(axisStatusItem[axisStatusItemKey]) ? (axisStatusItem[axisStatusItemKey].includes('1') ? '1' : (axisStatusItem[axisStatusItemKey].includes('0') ? '0' : '2')) : axisStatusItem[axisStatusItemKey]);
                    })
                    console.log('data', axisAlarmStatusItemsObj)
                    return axisAlarmStatusItemsObj;
                })
               res.status(200).send(axisAlarmStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

predict.get('/accum/chart', (req, res) => {
    const { robotId, axis, prevDate} = req.query;
    const predictAccumItemsQuery = `SELECT main.his_daily_report.robot_id, TO_CHAR(main.his_daily_report.date, 'YYYY-MM-DD') as date, jsonb_agg(value) as raw_data_torque, main.his_daily_report.torque_accum_data \
    FROM main.his_daily_report INNER JOIN main.his_report_rawdata_robot AS raws ON raws.robot_id = main.his_daily_report.robot_id AND raws.date = main.his_daily_report.date \
    CROSS JOIN jsonb_array_elements(raw_data_torque) WHERE value ->> 'job_name' = main.his_daily_report.torque_accum_data ->> 'job_name' AND main.his_daily_report.robot_id = ${robotId} AND \
    main.his_daily_report.date BETWEEN ${prevDate}::date AND CURRENT_DATE GROUP BY main.his_daily_report.date, main.his_daily_report.robot_id, \
    main.his_daily_report.torque_accum_data`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(predictAccumItemsQuery).then(result => {
            if(result.length > 0) {
                let predictAxisAccumStatusItems = [];
                result.forEach(predictAccumStatusItem => {
                    const { robot_id, date, raw_data_torque, torque_accum_data } = predictAccumStatusItem;
                    const predictAxisAccumStatusItem = raw_data_torque.length > 0 && raw_data_torque.map(rawData => {
                        const axisAccumItem = {torque: rawData.sum[axis], config: torque_accum_data.config[axis], job_name: rawData.job_name, update_time: rawData.update_time};
                        return axisAccumItem;
                    })
                    predictAxisAccumStatusItems = [ ...predictAxisAccumStatusItems, ...predictAxisAccumStatusItem ];
                })
                predictAxisAccumStatusItems && res.status(200).send(predictAxisAccumStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})
predict.get('/accum/avg/chart', (req, res) => {
    const { robotId, axis, prevDate} = req.query;
    const predictAccumAvgItemsQuery = `SELECT main.his_daily_report.robot_id, TO_CHAR(main.his_daily_report.date, 'YYYY-MM-DD') as date, jsonb_agg(value) as raw_data_torque_avg, main.his_daily_report.torque_accum_avg_data \
    FROM main.his_daily_report INNER JOIN main.his_report_rawdata_robot AS raws ON raws.robot_id = main.his_daily_report.robot_id AND raws.date = main.his_daily_report.date \
    CROSS JOIN jsonb_array_elements(raw_data_torque_accum_avg) WHERE value ->> 'job_name' = main.his_daily_report.torque_accum_avg_data ->> 'job_name' AND main.his_daily_report.robot_id = ${robotId} AND \
    main.his_daily_report.date BETWEEN ${prevDate}::date AND CURRENT_DATE GROUP BY main.his_daily_report.date, main.his_daily_report.robot_id, \
    main.his_daily_report.torque_accum_avg_data`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(predictAccumAvgItemsQuery).then(result => {
            if(result.length > 0) {
                let predictAxisAccumAvgStatusItems = [];
                result.forEach(item => {
                    const { robot_id, date, raw_data_torque_avg, torque_accum_avg_data } = item;
                    const predictAxisAccumAvgStatusItem = raw_data_torque_avg.length > 0 && raw_data_torque_avg.map(rawData => {
                        const axisAccumItem = {torque: rawData.torque_accum_avg[axis], config: torque_accum_avg_data.config[axis], job_name: rawData.job_name, update_time: date};
                        return axisAccumItem;
                    })
                    predictAxisAccumAvgStatusItems = [ ...predictAxisAccumAvgStatusItems, ...predictAxisAccumAvgStatusItem ];
                })
                predictAxisAccumAvgStatusItems && res.status(200).send(predictAxisAccumAvgStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})


predict.get('/temperature/chart', (req, res) => {
    const { robotId, axis, prevDate } = req.query;
    const predictTemperatureItemsQuery = `SELECT main.his_daily_report.robot_id, TO_CHAR(main.his_daily_report.date, 'YYYY-MM-DD') AS date, main.his_daily_report.temperature, \
    raws.raw_data_temperature FROM main.his_daily_report INNER JOIN main.his_report_rawdata_robot AS raws ON main.his_daily_report.robot_id = raws.robot_id AND \
    main.his_daily_report.date = raws.date WHERE main.his_daily_report.robot_id = ${robotId} AND main.his_daily_report.date BETWEEN ${prevDate}::date AND CURRENT_DATE`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(predictTemperatureItemsQuery).then(result => {
            if(result.length > 0) {
                let predictAxisTemperatureStatusItems = [];
                result.forEach(predictTemperatureItem => {
                    const { robot_id, date, temperature, raw_data_temperature } = predictTemperatureItem;
                    const predictAxisTemperatureStatusItem = raw_data_temperature.length > 0 && raw_data_temperature.map(rawData => {
                        const axisTemperatureItem = { config: temperature.config[axis], update_time: rawData.update_time, avg_temperature: rawData.motor_avg_encoder[axis], max_temperature: rawData.motor_max_encoder[axis] };
                        return axisTemperatureItem;
                    })
                    predictAxisTemperatureStatusItems = [ ...predictAxisTemperatureStatusItems, ...predictAxisTemperatureStatusItem ];
                })
                predictAxisTemperatureStatusItems && res.status(200).send(predictAxisTemperatureStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

predict.get('/pm-torque/chart', (req, res) => {
    const { robotId, axis, prevDate } = req.query;
    const predictPMToruqeItemsQuery = `SELECT main.his_daily_report.robot_id, TO_CHAR(main.his_daily_report.date, 'YYYY-MM-DD') AS date, main.his_daily_report.pmtorque, \
    raws.raw_data_robot_pmtorque FROM main.his_daily_report INNER JOIN main.his_report_rawdata_robot AS raws ON main.his_daily_report.robot_id = raws.robot_id AND main.his_daily_report.date = raws.date \
    WHERE main.his_daily_report.robot_id = ${robotId} AND main.his_daily_report.date BETWEEN ${prevDate}::date AND CURRENT_DATE `;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(predictPMToruqeItemsQuery).then(result => {
            if(result.length > 0) {
                /** pmtorque 값이 null 인 경우는 제어기가 해당 기능을 제공하고 있지 않기 때문이다. pm-torque 제공하는 제어기(dx200, yrc1000)
                 *  raw_data_robot_pmtorque 값이 null 인 경우도 위의 내용과 동일하다.
                 * */
                /**
                 * raw_data_robot_pmtorque 데이터 로직
                 * judge로 먼저 판단한다. 0: 정상, 1: 알람, 2: 불가(이 경우, 차트 불가)
                 * average: torque_avg_elapsed - torque_avg_latest 값
                 * config: pmtorque.config[axis]
                 * isEmpty -> 값이 있으면 false, 값이 없으면 true
                 * */

                let predictAxisPMTorqueStatusItems = [];
                result.forEach(predictPMTorqueItem => {
                    const { date, pmtorque, raw_data_robot_pmtorque } = predictPMTorqueItem;
                    const predictAxisPMTorqueStatusItem = ( !isEmpty(pmtorque) && !isEmpty(raw_data_robot_pmtorque) && raw_data_robot_pmtorque[axis].judge !== 2 ) ? {
                        config: Number(pmtorque.config) / 100, update_time: date, average: Number(raw_data_robot_pmtorque[axis].torque_avg_latest - raw_data_robot_pmtorque[axis].torque_avg_elapsed) / 100
                    } : false;
                    predictAxisPMTorqueStatusItems = [ ...predictAxisPMTorqueStatusItems, predictAxisPMTorqueStatusItem];
                });

                predictAxisPMTorqueStatusItems = predictAxisPMTorqueStatusItems.filter(predictAxisPMTorqueStatusItem => predictAxisPMTorqueStatusItem !== false);

                res.status(!isEmpty(predictAxisPMTorqueStatusItems)? 200 : 204).send(predictAxisPMTorqueStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
});

predict.get('/atomizer/alarm/status', (req, res) => {
    const { robotId, prevDate, currDate } = req.query;
    const query = `SELECT ARRAY_AGG((raw_data_atomizer ->> 'violation_level')::json ->> 0) AS turbine, ARRAY_AGG((raw_data_atomizer ->> 'violation_level')::json ->> 1) AS sa_s, ARRAY_AGG((raw_data_atomizer ->> 'violation_level')::json ->> 2) AS sa_v,
    ARRAY_AGG((raw_data_atomizer ->> 'violation_level')::json ->> 3) AS hv, ARRAY_AGG((raw_data_atomizer ->> 'violation_level')::json ->> 4) AS alarm FROM main.his_daily_report where robot_id = ${robotId} AND date BETWEEN ${prevDate}::date AND ${ currDate ? `(${currDate}::date)` : `CURRENT_DATE` }`;
    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(query).then(result => {
            if(result.length > 0) {
                const atomizerAlarmStatusItems = result.map(atomizerStatusItem => {
                    let atomizerAlarmStatusItemsObj = {};
                    Object.keys(atomizerStatusItem).map(atomizerStatusItemKey => {
                        atomizerAlarmStatusItemsObj[atomizerStatusItemKey] = (Array.isArray(atomizerStatusItem[atomizerStatusItemKey]) ? (atomizerStatusItem[atomizerStatusItemKey].includes('1') ? '1' : (atomizerStatusItem[atomizerStatusItemKey].includes('0') ? '0' : '2')) : atomizerStatusItem[atomizerStatusItemKey]);
                    })
                    return atomizerAlarmStatusItemsObj;
                })
                res.status(200).send(atomizerAlarmStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
});

predict.get('/atomizer/chart', (req,res) => {
    const { robotId, type, typeNo, prevDate, currDate } = req.query;
    const predictAtomizerItemsQuery = `SELECT main.his_daily_report.robot_id, TO_CHAR(main.his_daily_report.date, 'YYYY-MM-DD') AS update_date, main.his_daily_report.raw_data_atomizer, raws.raw_data_atomizer_avg, main.his_daily_report.raw_data_atomizer -> 'violation_count' ->> 4 AS alarm_count FROM main.his_daily_report
    INNER JOIN main.his_report_rawdata_robot AS raws ON main.his_daily_report.robot_id = raws.robot_id AND main.his_daily_report.date = raws.date WHERE main.his_daily_report.robot_id = ${robotId} AND main.his_daily_report.date BETWEEN ${prevDate}::date AND ${ currDate ? `${currDate}::date` : `CURRENT_DATE` } AND
    raws.raw_data_atomizer_avg IS NOT NULL GROUP BY update_date, main.his_daily_report.robot_id, main.his_daily_report.raw_data_atomizer, raws.raw_data_atomizer_avg ORDER BY update_date`;

    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(predictAtomizerItemsQuery).then(result => {
            if(result.length > 0) {
                let predictAtomizerTypeStatusItems = [];
                result.forEach(predictAtomizerStatusItem => {
                    const { update_date: date, raw_data_atomizer_avg, raw_data_atomizer, alarm_count } = predictAtomizerStatusItem;
                    const predictAtomizerTypeStatusItem = { date: date, alarm_count: alarm_count, item: [] };

                    if ( type === atomizerType.hv ) {
                        raw_data_atomizer_avg.hv_current_avg.forEach((hvAvg, hvIndex) => {
                            hvAvg !== 0 && predictAtomizerTypeStatusItem.item.push(
                                { name: ((hvIndex+1)*5)+'-COMMAND', value: Number(hvAvg.toFixed(2)) },
                                { name: ((hvIndex+1)*5)+'-CONFIG', value: Number(raw_data_atomizer.config[typeNo][hvIndex])},
                            );
                        })
                    } else if(type !== atomizerType.hv && type !== atomizerType.alarm) {
                        predictAtomizerTypeStatusItem.item.push(
                            { name: 'CMD-FEEDBACK-UPPER-AVG', value: Number(raw_data_atomizer_avg[type+'_upper_avg'].toFixed(2)) },
                            { name: 'CMD-FEEDBACK-UPPER-CONFIG', value: Number(raw_data_atomizer.config[typeNo][0]) },
                            { name: 'CMD-FEEDBACK-UNDER-AVG', value: Number(raw_data_atomizer_avg[type+'_under_avg'].toFixed(2)) },
                            { name: 'CMD-FEEDBACK-UNDER-CONFIG', value: Number(raw_data_atomizer.config[typeNo][1]) },
                        )
                    }
                    predictAtomizerTypeStatusItems = [...predictAtomizerTypeStatusItems, predictAtomizerTypeStatusItem];
                })
                predictAtomizerTypeStatusItems && res.status(200).send(predictAtomizerTypeStatusItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
});

predict.get('/export', (req, res) => {
    const { date } = req.query;
    const query = `SELECT main.robot_config.zone_id, main.zone_config.zone_name, main.his_report_rawdata_robot.robot_id, main.robot_config.robot_name, main.robot_accum_config.job_name, (CASE WHEN is_cart IS true THEN 1 ELSE 0 END + main.def_robot_model.axis_count) as axis, jsonb_path_query_array(raw_data_temperature, '$[*].motor_max_encoder') as temperature_max, temperature ->> 'config' as temperature_spec, temperature ->> 'violation_level' as temperature_violation, raw_data_torque_accum_avg, 
    CASE WHEN main.robot_config.tool_id != 2 AND main.robot_config.rc_model_id != 0 THEN torque_accum_spec ELSE torque_accum_avg_spec END as torque_accum_avg_spec, CASE WHEN main.robot_config.tool_id != 2 AND main.robot_config.rc_model_id != 0 THEN torque_accum_data ->> 'violation_level' ELSE torque_accum_avg_data ->> 'violation_level' END as torque_accum_avg_violation FROM main.his_report_rawdata_robot 
    INNER JOIN main.robot_config ON main.his_report_rawdata_robot.robot_id = main.robot_config.robot_id INNER JOIN main.zone_config ON main.robot_config.zone_id = main.zone_config.zone_id INNER JOIN main.robot_accum_config ON main.his_report_rawdata_robot.robot_id = main.robot_accum_config.robot_id INNER JOIN main.def_robot_model ON main.robot_config.robot_model_id = main.def_robot_model.robot_model_id INNER JOIN main.def_rc_model ON main.robot_config.rc_model_id = main.def_rc_model.rc_model_id INNER JOIN main.his_daily_report ON main.robot_config.zone_id = main.his_daily_report.zone_id AND
    main.his_report_rawdata_robot.robot_id = main.his_daily_report.robot_id AND main.his_daily_report.date = ${date}::date WHERE main.his_report_rawdata_robot.date = ${date}::date ORDER BY main.zone_config.disp_booth_id, main.zone_config.zone_no, main.robot_config.robot_no`;

    commonModule.sess.requestAuth(req.session.spsid) ?
    getPredictStatusItems(query).then(result => {
        if(result.length > 0) {
            let exportItems = [];
            result.forEach(res => {
                const { zone_id, zone_name, robot_id, robot_name, job_name, axis, temperature_max, temperature_spec, temperature_violation, raw_data_torque_accum_avg, torque_accum_avg_spec, torque_accum_avg_violation } = res;
                const torqueAccumAvgItem = raw_data_torque_accum_avg.length > 0 ? raw_data_torque_accum_avg.filter(torqueAccumAvg => {
                    return torqueAccumAvg.job_name === job_name;
                }) : [];
                const temperatureMaxItem = temperature_max.length > 0 ? temperature_max.reduce((accumulator, curValue) => {
                    return curValue.map((value, index) => {
                        return Math.max(accumulator[index], value)
                    })
                }) : [];
                exportItems.push({
                    zone_id,
                    zone_name,
                    robot_id,
                    robot_name,
                    job_name,
                    axis,
                    temperature_value: temperatureMaxItem,
                    temperature_config: JSON.parse(temperature_spec),
                    temperature_violation: JSON.parse(temperature_violation),
                    accum_value: torqueAccumAvgItem.length > 0 ? torqueAccumAvgItem[0].torque_accum_avg : [],
                    accum_config: torque_accum_avg_spec,
                    accum_violation: JSON.parse(torque_accum_avg_violation),
                    warning: JSON.parse(temperature_violation).includes(1) || JSON.parse(torque_accum_avg_violation).includes(1)
                })
            })
            res.status(200).send(exportItems);
        } else {
            res.status(204).send([]);
        }
    }).catch(error => {
        res.status(404).send(error);
    })
    : res.status(404).send('not login');
})

predict.get('/atomizer/alarm/list', (req, res) => {
    const { robotId, prevDate, currDate } = req.query;
    const query = {
        text: `SELECT to_char(date, 'YYYY-MM-DD') AS date, raw_data_atomizer_alarm as alarm_list FROM main.his_report_rawdata_robot WHERE robot_id = $1 AND date BETWEEN $2::date AND ${ currDate ? `${currDate}::date` : `CURRENT_DATE` } AND JSONB_ARRAY_LENGTH(raw_data_atomizer_alarm) > 0 ORDER BY date`,
        values: [robotId, prevDate]
    };
    commonModule.sess.requestAuth(req.session.spsid) ?
        getPredictStatusItems(query).then(result => {
            if(result.length > 0) {
               const atomizerAlarmList = result.map(res => {
                   return res.alarm_list;
               });
                res.status(200).send(flatten(atomizerAlarmList));
            } else {
                res.status(204).send([]);
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})