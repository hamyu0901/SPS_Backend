const express = require('express');
const commonModule = require('./app');
const reportview = express.Router();
export { reportview };
const bodyParser = require('body-parser');

reportview.use(bodyParser.urlencoded({ extended: true }));
reportview.use(bodyParser.json());

reportview.get('/', (req, res) => {
  res.status(200).send('report');
});

const getReportStatusItems = (query) => {
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

// new 리포트

// 존 별 리포트 추가
reportview.post('/renew/report', (req, res) => {
    const query = {
        text: `INSERT INTO main.his_report(zone_id, start_date, end_date, report_name, update_time)
        VALUES($1, $2, $3, $4, $5);`,
        values: [
            req.body.zoneid,
            req.body.startdate,
            req.body.enddate,
            req.body.reportname,
            req.body.updatetime,
        ]
      }
      commonModule.mainDB.execute(query, req.session.spsid, res);
});
// 존 별 리포트 수정
reportview.put('/renew/report', (req, res) => {
    const query = {
        text: `UPDATE main.his_report SET (start_date, end_date, report_name, update_time) = ($2,$3,$4,$5) \
        WHERE zone_id = $1 and report_id = $6`,
        values: [
            req.body.zoneid,
            req.body.startdate,
            req.body.enddate,
            req.body.reportname,
            req.body.updatetime,
            req.body.reportid
        ]
      }
      commonModule.mainDB.execute(query, req.session.spsid, res);
});
// 존 별 리포트 조회
reportview.get(`/renew/report/zoneid/:zoneid`, (req, res) => {
    const query = {
        text: `
        SELECT
            *
        FROM
            main.his_report \
        WHERE
            zone_id = $1 \
        ORDER BY start_date desc
        `,
        values: [
            req.params.zoneid,
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
// 존 별 리포트 삭제
reportview.put(`/renew/report/reportid/:reportid`, (req, res) => {
    const query = {
        text: `DELETE FROM main.his_report WHERE report_id = ${req.params.reportid}`
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
// 존 별 리포트 데이터 수정
reportview.put(`/renew/report/data`, (req, res) => {
    let query
    switch(req.body.type){
      case 'alarm' :
        query = {
          text: `UPDATE main.his_report SET alarm_data = '${req.body.alarm}', prev_data_id = $2 WHERE report_id = $1`,
          values: [
            req.body.reportid,
            req.body.prevreportid
          ]
        }
      break;

      case 'hardware' :
        query = {
          text: `UPDATE main.his_report SET current_data = '${req.body.data}', prev_data_id = $2 WHERE report_id = $1`,
          values: [
            req.body.reportid,
            req.body.prevreportid
          ]
        }
      break;

      case 'atomizer' :
        query = {
          text: `UPDATE main.his_report SET atomizer_data = '${req.body.data}', prev_data_id = $2 WHERE report_id = $1`,
          values: [
            req.body.reportid,
            req.body.prevreportid
          ]
        }
      break;
    default:
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
// 전체 리포트 조회
reportview.get(`/renew/report`, (req, res) => {
    const query = {
        text: `SELECT zone_id, report_id, report_name, current_data, alarm_data, atomizer_data from main.his_report \
        GROUP BY zone_id, report_id, report_name, current_data, alarm_data, update_time, atomizer_data, start_date order by start_date desc `
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
// renew 온도 값 축별 평균 조회
reportview.post('/renew/temp/avg/robot/axis', (req, res) => {
    const start_time = `${String(req.body.startDate)} 00:00:00`;
    const end_time = `${String(req.body.endDate)} 23:59:59`;
    let temperatureAvgconditionStr = ''
    let conditionStr = `robot_id = $3 and start_time between $1 and $2`
    let arrayStr = ''
    for (let i = 0; i < req.body.robotAxis; i++){
        let tempStr = `CAST(sum(temperature_max[${i+1}]) AS numeric) as axis${i+1}`
        temperatureAvgconditionStr += i === req.body.robotAxis-1 ? tempStr : tempStr + ','
        let tempArrayStr = `ROUND(axis${i+1} / count)`
        arrayStr += i === req.body.robotAxis-1 ? tempArrayStr : tempArrayStr + ','
    }
    const query = {
      text: `with t1 as (\
        SELECT robot_id, count(*) FROM main.his_robot_data WHERE ${conditionStr} GROUP BY robot_id), \
          t2 as (\
            SELECT robot_id, ${temperatureAvgconditionStr} FROM main.his_robot_data \
            WHERE ${conditionStr} GROUP BY robot_id\
          )\
        SELECT ARRAY [${arrayStr}] \
        FROM t1 inner join t2 on t1.robot_id = t2.robot_id` ,
      values: [
        start_time,
        end_time,
        req.body.robotId
      ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res)
  })
  reportview.post('/renew/torque/avg/robot/axis', (req, res) => {
    const start_time = `${String(req.body.startDate)} 00:00:00`;
    const end_time = `${String(req.body.endDate)} 23:59:59`;
    let torqueAvgconditionStr = ''
    let conditionStr = ''
    let arrayStr = ''
    for (let i = 0; i < req.body.robotAxis; i++){
        let tempCondition = `(select count(*) as count${i+1} from main.his_robot_pmtorque where axis = ${i+1} and robot_id = $3 and date between $1 and $2 and judge in ('0','1'))`
        conditionStr += i === req.body.robotAxis-1 ? tempCondition : tempCondition + ','
        let tempTorqueAvgconditionStr = `(select CAST(sum((torque_avg_latest - torque_avg_elapsed) * 0.01) AS numeric) as axis${i+1} from main.his_robot_pmtorque where axis = ${i+1} and robot_id = $3 and date between $1 and $2 and judge in ('0','1'))`
        torqueAvgconditionStr += i === req.body.robotAxis-1 ? tempTorqueAvgconditionStr : tempTorqueAvgconditionStr + ','
        let tempArrayStr = `ROUND((axis${i+1} / count${i+1}),2)`
        arrayStr += i === req.body.robotAxis-1 ? tempArrayStr : tempArrayStr + ','
    }
    const query = {
      text: `with t1 as (\
        SELECT robot_id, ${conditionStr} FROM main.his_robot_pmtorque WHERE robot_id = $3 and date between $1 and $2 and judge in ('0','1') GROUP BY robot_id), \
          t2 as (\
            SELECT robot_id, ${torqueAvgconditionStr} FROM main.his_robot_pmtorque WHERE robot_id = $3 and date between $1 and $2 and judge in ('0','1') GROUP BY robot_id) \
        SELECT ARRAY [${arrayStr}] FROM t1 inner join t2 on t1.robot_id = t2.robot_id` ,
      values: [
        start_time,
        end_time,
        req.body.robotId
      ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res)
  })
  function deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
        return obj
    }
    const result = Array.isArray(obj) ? [] : {}
    for (let key of Object.keys(obj)) {
        result[key] = deepClone(obj[key])
    }

    return result
  }
  const spliceArray = (array) => {
    let size = 3;
    let result = [];
    let temp = deepClone(array)
    for(let i = 0; i < temp.length; i ++){
      let value = temp.splice(0,size)
      result.push(value)
    }
    return result
  }

  reportview.get('/atomizer/data/avg', (req, res) => {
    const {robotId, prevDate, currDate, type} = req.query
    const atomizerAvgItemsQuery = `SELECT raw_data_atomizer_avg, robot_id, TO_CHAR(date, 'YYYY-MM-DD') AS date from main.his_report_rawdata_robot \
    WHERE robot_id = ${robotId} AND date BETWEEN ${prevDate}::date AND ${currDate}::date AND raw_data_atomizer_avg IS NOT NULL ORDER BY date`
    commonModule.sess.requestAuth(req.session.spsid) ?
        getReportStatusItems(atomizerAvgItemsQuery).then(result => {
            if(result.length > 0) {
              let reportAtomizerItems =  type !== 'hv' ? Array(3).fill([]) : []
              let reportAtomizerItem = type !== 'hv' ? {upper_value : 0, upper_length : 0, under_value: 0, under_length : 0} : []
              let reportAtomizerHvTemp = [];
              if(type === 'hv'){
                result.forEach(reportAtomizerItem => {
                  const {robot_id, date, raw_data_atomizer_avg} = reportAtomizerItem
                  raw_data_atomizer_avg.hv_current_avg.forEach((hv,hvIndex) => {
                    hv !== null && hv !== 0 && reportAtomizerHvTemp.push({name : ((hvIndex+1)*5), value : hv})
                  })
                })
                reportAtomizerItem = reportAtomizerHvTemp.reduce((acc, {name, value}) => {
                  const item = acc.some(o => o.name == name) ? acc.filter(o => o.name == name)[0] : {name, value : 0, length : 0, avg: 0}
                  item.value += value
                  item.length += 1
                  item.avg = Number((item.value / item.length).toFixed(2))
                  if (acc.some(o => o.name == name)) {
                      return acc.map(o => o.name == name ? item : o).sort(function (a,b){ return a.name < b.name ? -1 : 1})
                  } else {
                      acc.push(item)
                      return acc
                  }
                }, [])
                reportAtomizerItem && (reportAtomizerItem.forEach(atomierItem => {reportAtomizerItems.push([], atomierItem.name, atomierItem.avg)}), reportAtomizerItems = spliceArray(reportAtomizerItems))
              }
              else{
                result.forEach(reportAtomizerAvgItem => {
                  const {robot_id, date, raw_data_atomizer_avg} = reportAtomizerAvgItem
                  Number(raw_data_atomizer_avg[type +'_upper_avg']) !== 0 && (reportAtomizerItem.upper_value += Number(raw_data_atomizer_avg[type +'_upper_avg']), reportAtomizerItem.upper_length += 1)
                  Number(raw_data_atomizer_avg[type +'_under_avg']) !== 0 && (reportAtomizerItem.under_value += Number(raw_data_atomizer_avg[type +'_under_avg']), reportAtomizerItem.under_length += 1)
                  reportAtomizerItems[1] = Number((reportAtomizerItem.upper_value / reportAtomizerItem.upper_length).toFixed(2))
                  reportAtomizerItems[2] = Number((reportAtomizerItem.under_value / reportAtomizerItem.under_length).toFixed(2))
                })
              }
              reportAtomizerItems && res.status(200).send(reportAtomizerItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
  })


  reportview.get('/atomizer/alarm/count', (req, res) => {
    const {robotId, prevDate, currDate} = req.query
    const atomizerAlarmCountItemsQuery = `SELECT robot_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, raw_data_atomizer FROM main.his_daily_report \
    WHERE robot_id = ${robotId} AND date BETWEEN ${prevDate}::date AND ${currDate}::date ORDER BY date`
    commonModule.sess.requestAuth(req.session.spsid) ?
        getReportStatusItems(atomizerAlarmCountItemsQuery).then(result => {
            if(result.length > 0) {
                let reportAtomizerAlarmCountItems = [{value: 0, type: 0, config: null}, {value: 0, type: 1, config: null}, {value: 0, type: 2 , config: null}, {value: 0, type: 3, config: []}]
                result.forEach(atomizerAlarmCountItem=> {
                  const {date, raw_data_atomizer} = atomizerAlarmCountItem
                  if(raw_data_atomizer !== null){
                    reportAtomizerAlarmCountItems[0].value += raw_data_atomizer.violation_level[0] !== 2 ? raw_data_atomizer.violation_level[0] : null
                    reportAtomizerAlarmCountItems[1].value += raw_data_atomizer.violation_level[1] !== 2 ? raw_data_atomizer.violation_level[1] : null
                    reportAtomizerAlarmCountItems[2].value += raw_data_atomizer.violation_level[2] !== 2 ? raw_data_atomizer.violation_level[2] : null
                    reportAtomizerAlarmCountItems[3].value += raw_data_atomizer.violation_level[3] !== 2 ? raw_data_atomizer.violation_level[3] : null
                    reportAtomizerAlarmCountItems[0].config = raw_data_atomizer.config[0]
                    reportAtomizerAlarmCountItems[1].config = raw_data_atomizer.config[1]
                    reportAtomizerAlarmCountItems[2].config = raw_data_atomizer.config[2]
                    reportAtomizerAlarmCountItems[3].config = raw_data_atomizer.config[3].filter(configItem => configItem !== 0 && configItem !== null)
                    // raw_data_atomizer.config[3].forEach(configItem => configItem !== 0 && configItem !== null && reportAtomizerAlarmCountItems[3].config.push(configItem))
                  }
              })
              reportAtomizerAlarmCountItems && res.status(200).send(reportAtomizerAlarmCountItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
  })