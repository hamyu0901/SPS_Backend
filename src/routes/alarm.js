const express = require('express');

const alarm = express.Router();
const bodyParser = require('body-parser');
const commonModule = require('./app');
const path = require('path');
const moment = require('moment');

alarm.use(bodyParser.urlencoded({ extended: true }));
alarm.use(bodyParser.json());

alarm.get('/', (req,res) => {
    res.status(200).send('alarm');
})

const getAlarmItems = (query) => {
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

alarm.get('/robot/info', (req, res) => {
    const { alarmId, robotId } = req.query;
    const query = `select alarm_id, robot_alarm.robot_id, code, name AS alarm_name, job_name, step_no, axis_info, disp_alarm_axis, match_parts, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS update_time, rc_model_id, tool_id \
    FROM main.his_robot_alarm robot_alarm\
    inner join main.robot_config robot_config on robot_config.robot_id = robot_alarm.robot_id \
    left join main.def_alarm_part_match on code = match_alarm_code WHERE alarm_id = ${alarmId} and robot_alarm.robot_id = ${robotId}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/robot/torque', (req, res) => {
    const { robotId, jobName, time, axis } = req.query;
    const query = `SELECT step_no, torque_avg as torque FROM main.his_robot_job_stepdata WHERE robot_id = ${robotId} AND job_name = '${jobName}' AND start_time BETWEEN '${time}'::date - INTERVAL '1 WEEK' AND '${time}'::date ORDER BY start_time DESC LIMIT 2`;
    commonModule.sess.requestAuth(req.session.spsid) ?
        getAlarmItems(query).then(result => {
            if(result.length > 0) {
                const axisArr = axis.split(',').map(a => Number(a));
                let axisItems = [];
                axisArr.map(axis => {
                    result.forEach((alarmItem, alarmItemIdx) => {
                        axisItems.push(
                            { axis: alarmItemIdx === 0 ? axis: axis+'-latest', step_no: alarmItem.step_no[axis-1], torque: alarmItem.torque[axis-1] }
                        )
                    })
                })
                res.status(200).send(axisItems);
            } else {
                res.status(204).send([]);
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

alarm.get('/robot/accum/trend', (req, res) => {
    const { robotId, jobName, time, axis } = req.query;
    const axisArr = axis.split(',').map(a => Number(a));
    let axisQuery = '';
    for ( let i = 0; i < axisArr.length; ++i ) {
        axisQuery += `torque_accum[${axisArr[i]}]::integer AS axis${axisArr[i]}, `;
        axisQuery = (i === (axisArr.length - 1)) ? axisQuery.slice(0, -1) : axisQuery;
    }
    const query = `SELECT ${axisQuery} date AS time FROM (\
        SELECT torque_accum_avg AS torque_accum, main.his_report_rawdata_robot.date, job_name \
        FROM \
            main.his_report_rawdata_robot, jsonb_to_recordset(main.his_report_rawdata_robot.raw_data_torque_accum_avg) AS x(date text, torque_accum_avg bigint[], job_name text) \
            WHERE main.his_report_rawdata_robot.date BETWEEN '${time}'::date - INTERVAL '1 MONTH' AND '${time}' AND robot_id = ${robotId} \
        )T WHERE job_name = '${jobName}' order by date`

    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/robot/temperature/trend', (req, res) => {
    const { robotId, time, axis } = req.query;
    const axisArr = axis.split(',');
    let axisQuery = '';
    for ( let i = 0; i < axisArr.length; ++i ) {
        axisQuery += `temperature_avg[${axisArr[i]}] AS axis${axisArr[i]}, `;
        axisQuery = (i === (axisArr.length - 1)) ? axisQuery.slice(0, -1) : axisQuery;
    }
    const query = `SELECT ${axisQuery} update_time AS time FROM (\
        SELECT update_time::timestamp, motor_max_encoder AS temperature_avg \
            FROM \
                main.his_report_rawdata_robot, jsonb_to_recordset(main.his_report_rawdata_robot.raw_data_temperature \
            ) AS x(update_time timestamp, motor_max_encoder smallint[]) where date BETWEEN '${time}'::date - INTERVAL '1 MONTH' AND '${time}' and robot_id = ${robotId} \
        )T ORDER BY time`
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/robot/accum/gap', (req, res) => {
    const { robotId, jobName, time, axis } = req.query;
    const monthAvgQuery = `SELECT to_char(date, 'YYYY-MM-DD') AS date, raw_data_torque_accum_avg FROM main.his_report_rawdata_robot WHERE robot_id = ${robotId} AND date BETWEEN '${time}'::date - INTERVAL '1 MONTH' AND '${time}'::date`;
    const fiveAvgQuery = `SELECT torque_accum FROM main.his_robot_data WHERE robot_id = ${robotId} AND job_name = '${jobName}' AND start_time BETWEEN '${time}'::date - INTERVAL '1 WEEK' AND '${time}'::date AND alarm_status = 0 ORDER BY start_time DESC LIMIT 5`;
    commonModule.sess.requestAuth(req.session.spsid) ?
        getAlarmItems(monthAvgQuery).then(monthAvgResult => {
            if(monthAvgResult.length > 0) {
                const axisArr = axis.split(',');
                let axisItems = [];
                /** 알람 발생 잡과 동일한 잡이 포함되어 있는 값 추출 */
                const monthAvgResultItems = monthAvgResult.map(monthAvgRes => {
                    const monthAvgResItem = monthAvgRes.raw_data_torque_accum_avg.filter(accumAvgItem => accumAvgItem.job_name === jobName);
                    return { date: monthAvgRes.date, torque_accum_avg: monthAvgResItem.length > 0 ? monthAvgResItem[0].torque_accum_avg : null }
                })
                /** 적산 평균 값이 없는 경우 제거 */
                const filterMonthAvgResultItems = monthAvgResultItems.filter(monthAvgResultItem => monthAvgResultItem.torque_accum_avg !== null);
                /** 축 별 한달 평균 값 추출  { axis: .., month: ... }*/
                axisArr.forEach(axis => {
                    let totalCount = 0;
                    filterMonthAvgResultItems.forEach((filterMonthAvgResultItem, index) => {
                        totalCount += filterMonthAvgResultItem.torque_accum_avg[axis-1];
                        (filterMonthAvgResultItems.length - 1) === index && axisItems.push(
                            { axis: axis, month: Math.round(totalCount / filterMonthAvgResultItems.length) }
                        )
                    })
                });
                getAlarmItems(fiveAvgQuery).then(fiveAvgResult => {
                    if(fiveAvgResult.length > 0) {
                        /** 축 별 5개 평규 값 추출 { axis: .., month: .., days: .. } */
                        axisArr.forEach(axis => {
                            let totalCount = 0;
                            let axisItemIndex = axisItems.findIndex(axisItem => axisItem.axis === axis);
                            fiveAvgResult.forEach((avgResult, index) => {
                                totalCount += avgResult.torque_accum[axis-1];
                                axisItems[axisItemIndex]['days'] = (fiveAvgResult.length - 1) === index && Math.round(totalCount / fiveAvgResult.length);
                            })
                        })
                    }
                    res.status(200).send(axisItems);
                }).catch(error => {
                    res.status(404).send(error);
                })
            } else {
                res.status(204).send([]);
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

alarm.get('/robot/temperature/gap', (req, res) => {
    const { robotId , time, axis } = req.query;
    const monthAvgQuery = `SELECT to_char(date, 'YYYY-MM-DD') AS date, raw_data_temperature FROM main.his_report_rawdata_robot WHERE robot_id = ${robotId} AND date BETWEEN '${time}'::date - INTERVAL '1 MONTH' AND '${time}'::date`;
    const fiveAvgQuery = `SELECT temperature_avg FROM main.his_robot_data WHERE robot_id = ${robotId} AND start_time BETWEEN '${time}'::date - INTERVAL '1 WEEK' AND '${time}'::date AND alarm_status = 0 ORDER BY start_time DESC LIMIT 5`;
    commonModule.sess.requestAuth(req.session.spsid) ?
        getAlarmItems(monthAvgQuery).then(monthAvgResult => {
            if(monthAvgResult.length > 0) {
                const axisArr = axis.split(',');
                let axisItems = [];
                /** 온도 값이 하루에 여러개 들어오기 때문에 해당 날짜 기준 평균 값 추출 */
                const monthAvgResultItems = monthAvgResult.map(monthAvgRes => {
                    let totalCountArr = Array.from({length: 7}, () => 0);
                    axisArr.forEach(axis => {
                        let totalCount = 0;
                        monthAvgRes.raw_data_temperature.forEach((avgRes, index) => {
                            totalCount += avgRes.motor_avg_encoder[axis-1];
                            totalCountArr[axis-1] = (monthAvgRes.raw_data_temperature.length - 1 === index) && Math.round(totalCount / monthAvgRes.raw_data_temperature.length);
                        })
                    })
                    return { date: monthAvgRes.date, motor_avg_encoder: totalCountArr };
                })
                /** 온도 값이 없는 경우 제거 */
                const filterMonthAvgResultItems = monthAvgResultItems.filter(monthAvgResultItem => monthAvgResultItem.motor_avg_encoder.filter(avg => avg > 0).length > 0);
                /** 축 별 한달 평균 값 추출  { axis: .., month: ... }*/
                axisArr.forEach(axis => {
                    let totalCount = 0;
                    filterMonthAvgResultItems.forEach((filterMonthAvgResultItem, index) => {
                        totalCount += filterMonthAvgResultItem.motor_avg_encoder[axis-1];
                        (filterMonthAvgResultItems.length - 1) === index && axisItems.push(
                            { axis: axis, month: Math.round(totalCount / filterMonthAvgResultItems.length) }
                        )
                    })
                });
                getAlarmItems(fiveAvgQuery).then(fiveAvgResult => {
                    if(fiveAvgResult.length > 0) {
                        /** 축 별 5개 평규 값 추출 { axis: .., month: .., days: .. } */
                        axisArr.forEach(axis => {
                            let totalCount = 0;
                            let axisItemIndex = axisItems.findIndex(axisItem => axisItem.axis === axis);
                            fiveAvgResult.forEach((avgResult, index) => {
                                totalCount += avgResult.temperature_avg[axis-1];
                                axisItems[axisItemIndex]['days'] = (fiveAvgResult.length - 1) === index && Math.round(totalCount / fiveAvgResult.length);
                            })
                        })
                    }
                    res.status(200).send(axisItems);
                }).catch(error => {
                    res.status(404).send(error);
                })
            } else {
                res.status(204).send([]);
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
})

/** 도장기 알람 정보 */
alarm.get('/atomizer/info', (req, res) => {
    const { alarmId } = req.query;
    const query = `SELECT alarm_id, zone_id, code, contents, level, robot_id, job_name, step_no, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS date FROM main.his_zone_alarm WHERE alarm_id = ${alarmId}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

/** 도장기 알람 차트 데이터 */
alarm.get('/atomizer/trend', (req, res) => {
    const { alarmId } = req.query;
    const query = `SELECT step_no, flow_cmd, flow_feedback, turbine_speed_cmd, turbine_speed_feedback, sa_s_cmd, sa_s_feedback, sa_v_cmd, sa_v_feedback, hv_cmd, hv_feedback, hvc_feedback, fgp_pressure_input, fgp_pressure_output FROM main.his_atomizer_alarm
    WHERE zone_alarm_id = ${alarmId}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

/** 도장기 알람 전 후 도장기 타입 알람 리스트 */
alarm.get('/atomizer/list', (req, res) => {
    const { alarmId, zoneId } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT alarm_id, zone_id, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS date, type_name_${language} AS type, code, contents, level, job_name FROM ( (SELECT * FROM main.his_zone_alarm WHERE alarm_id > ${alarmId} AND status = 1  AND type_id = 2 AND zone_id = ${zoneId} AND warning = false ORDER BY alarm_id LIMIT 10) UNION ALL (SELECT * FROM main.his_zone_alarm WHERE alarm_id <= ${alarmId} AND status = 1 AND type_id = 2 AND zone_id = ${zoneId} AND warning = false ORDER BY alarm_id DESC LIMIT 10)) alarm_list
    INNER JOIN main.def_alarm_type ON alarm_list.type_id = main.def_alarm_type.type_id ORDER BY alarm_id`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

/** 도장기 알람 전 후 타입 미구분 알람 리스트 */
alarm.get('/atomizer/entire/list', (req, res) => {
    const { alarmId, zoneId } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT alarm_id, zone_id, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS date, type_name_${language} AS type, code, contents, level, job_name  FROM ( (SELECT * FROM main.his_zone_alarm WHERE alarm_id > ${alarmId} AND status = 1  AND zone_id = ${zoneId} AND warning = false ORDER BY alarm_id LIMIT 10) UNION ALL (SELECT * FROM main.his_zone_alarm WHERE alarm_id <= ${alarmId} AND status = 1 AND zone_id = ${zoneId} AND warning = false ORDER BY alarm_id DESC LIMIT 10)) alarm_list
    INNER JOIN main.def_alarm_type ON alarm_list.type_id = main.def_alarm_type.type_id ORDER BY alarm_id`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/zone/list', (req, res) => {
    const { zoneId } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT alarm_id, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS date, main.his_zone_alarm.type_id, type_name_${language} AS type, code, contents, main.his_zone_alarm.robot_id, robot_name, job_name, step_no, level, spc_code
    FROM main.his_zone_alarm INNER JOIN main.def_alarm_type ON main.his_zone_alarm.type_id = main.def_alarm_type.type_id
    LEFT JOIN main.robot_config ON main.his_zone_alarm.robot_id = main.robot_config.robot_id WHERE main.his_zone_alarm.zone_id = ${zoneId} AND status = 1 AND level > 0 AND warning = false AND update_time BETWEEN current_date AND current_date + 1 ORDER BY alarm_id DESC`;

    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/robot/list', (req, res) => {
    const { robotId } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT alarm_id, robot_id, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS date, main.his_robot_alarm.type_id, type_name_${language} AS type, code, sub_code, name AS contents, job_name, match_parts, step_no, axis_info, disp_alarm_axis FROM main.his_robot_alarm INNER JOIN main.def_alarm_type ON main.his_robot_alarm.type_id = main.def_alarm_type.type_id
    LEFT JOIN main.def_alarm_part_match ON code = match_alarm_code WHERE robot_id = ${robotId} AND update_time BETWEEN current_date AND current_date + 1 ORDER BY alarm_id DESC`;

    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/spc/list', (req, res) => {
    const { alarmCode } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT * FROM main.def_spc_alarm_list_${language} WHERE alarm_code = ${alarmCode}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

alarm.get('/spc/file/:fileName', (req, res) => {
    const { fileName } = req.params;
    const language = commonModule.task.getGlobalLanguage();
    const filePath = path.resolve(`./manual/spc/${language}/${fileName}.pdf`);

    res.sendFile(filePath, {
        headers: {
            'Content-Type': 'application/pdf'
        }
    });
});

alarm.get('/common/date/count', (req, res) => {
    const { type, date, alarmCode, robotId, zoneId } = req.query;
    const startDate = moment(date).subtract(1, 'weeks').format('YYYY-MM-DD');
    const endDate = moment(date).format('YYYY-MM-DD');
    const query = {
        text: Number(type) === 0 ?
        `SELECT TO_CHAR(update_time, 'YYYY-MM-DD') AS date, COUNT(*)::integer FROM main.his_robot_alarm WHERE robot_id = ${robotId} AND code = $1 AND TO_CHAR(update_time, 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}' GROUP BY date` :
        `SELECT TO_CHAR(update_time, 'YYYY-MM-DD') AS date, COUNT(*)::integer FROM main.his_zone_alarm WHERE zone_id = ${zoneId} AND code = $1 AND TO_CHAR(update_time, 'YYYY-MM-DD') BETWEEN '${startDate}' AND '${endDate}' GROUP BY date`,
        values: [alarmCode]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

alarm.get('/common/info', (req, res) => {
    const { type, alarmId } = req.query;
    const language = commonModule.task.getGlobalLanguage();
    const query = {
        text: Number(type) === 0 ?
            `SELECT main.his_robot_alarm.robot_id, rc.robot_name, zc.zone_name, code, sub_code, name AS contents, main.his_robot_alarm.type_id, at.type_name_${language}, job_name AS job, step_no, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS time
            FROM main.his_robot_alarm INNER JOIN main.robot_config rc ON main.his_robot_alarm.robot_id = rc.robot_id INNER JOIN main.zone_config zc ON rc.zone_id = zc.zone_id INNER JOIN main.def_alarm_type at ON main.his_robot_alarm.type_id = at.type_id 
            WHERE alarm_id = $1` :
            `SELECT main.his_zone_alarm.zone_id, zc.zone_name, code, main.his_zone_alarm.type_id, at.type_name_${language}, contents, level, TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') AS time FROM main.his_zone_alarm 
            INNER JOIN main.zone_config zc ON main.his_zone_alarm.zone_id = zc.zone_id INNER JOIN main.def_alarm_type at ON main.his_zone_alarm.type_id = at.type_id WHERE alarm_id = $1`,
        values: [alarmId]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

export { alarm };