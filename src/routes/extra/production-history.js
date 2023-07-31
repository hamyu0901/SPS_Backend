/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const productionHistory = express.Router();
export { productionHistory };
const bodyParser = require('body-parser');
const commonModule = require('../app');

productionHistory.use(bodyParser.urlencoded({ extended: true }));
productionHistory.use(bodyParser.json());

productionHistory.get('/', (req, res) => {
    res.status(200).send('Production History');
});

const getProductionItems = (query) => {
    return new Promise((resolve, reject) => {
        try {
            commonModule.mainDB.dbClient.query(query, (err, res) => {
                res === undefined ? reject(new Error(err)) : resolve(res.rows);
            })
        }catch(error) {
            reject(new Error(error))
        }

    })
};

const setProductionConditions = (params) => {
    const conditions = [];
    if (params) {

        const conditionMappings = {
            robotId: 'robot_id',
            model: 'record[1]',
            color: 'record[2]'
        };

        for (const key in conditionMappings) {
            if (params[key]) {
                let conditionValue = params[key];
                (conditionValue = `= ${conditionValue}`);
                conditions.push(`${conditionMappings[key]} ${conditionValue}`);
            }
        }
    }
    return conditions.length > 0 ? ` AND ${conditions.join(' AND ')}` : '';
};

productionHistory.get('/zone/:zoneId',(req, res) => {
    const { zoneId } = req.query;
    const start_time = `${String(req.query['startDate'])} 00:00:00`;
    const end_time = `${String(req.query['endDate'])} 23:59:59`;
    const conditions = setProductionConditions(req.query);
    const query = {
        text: ` SELECT record[1] AS model, record[2] AS color, p.robot_id, robot_name, SUM(record[3]) AS "flow" FROM main.his_production_information as p \
         INNER JOIN main.robot_config on main.robot_config.robot_id = p.robot_id WHERE p.zone_id = $1 AND update_time between $2 and $3${conditions}\
         GROUP BY record[1], record[2], p.robot_id, robot_name  order by p.robot_id`,
        values:[
            zoneId,
            start_time,
            end_time
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

productionHistory.get(`/zone`, (req, res) => {
    const { zoneId } = req.query
    const start_time = `${String(req.query['startDate'])} 00:00:00`;
    const end_time = `${String(req.query['endDate'])} 23:59:59`;
    const conditions = setProductionConditions(req.query);

    const query = {
        text: `SELECT TO_CHAR(update_time, 'MM-DD HH24:MI:SS') as time, zone_id, robot_id, column_name as column, record as value, vin_no 
        FROM main.his_production_information WHERE zone_id = $1 and update_time between $2 and $3${conditions} order by update_time`,
        values:[
            zoneId,
            start_time,
            end_time
        ]
    }

    commonModule.sess.requestAuth(req.session.spsid) ?
        getProductionItems(query).then(result => {
            if(result.length > 0) {
                const productionItems = result.map(item => {
                    item.column.unshift('Time');
                    const header = item.column;
                    const obj = {};

                    header.forEach((key, index) => {
                        obj[key] = key !== 'Time' ? item.value[index-1] : item.time;
                    });
                    return {
                        header,
                        item: obj,
                        date: item.date
                    };
                });
                productionItems && res.status(200).send(productionItems);
            } else {
                res.status(204).send('no data');
            }
        }).catch(error => {
            res.status(404).send(error);
        })
        : res.status(404).send('not login');
});

