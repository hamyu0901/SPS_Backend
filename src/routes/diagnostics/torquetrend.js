/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torqueTrend = express.Router();
export { torqueTrend };
const bodyParser = require('body-parser');
const commonModule = require('../app');

torqueTrend.use(bodyParser.urlencoded({ extended: true }));
torqueTrend.use(bodyParser.json());

torqueTrend.get('/', (req, res) => {
  res.status(200).send('Realtime and Historical Trend');
});

torqueTrend.get('/realtime', (req, res) => {
    const query = {
        text: `SELECT 
        time_stamp, 
        motor_torque[$5], 
        job_name 
        FROM 
        his_robot_torque 
        WHERE 
        factory_id = $1 
        AND
        booth_id = $2 
        AND 
        zone_id = $3 
        AND 
        robot_id = $4 
        ORDER BY time_stamp DESC LIMIT 1;`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
            req.query.axis,
        ],
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTrend.get('/historical', (req, res) => {
    const query = {
        text: `SELECT 
        time_stamp, 
        motor_torque[$7] 
        FROM 
        his_robot_torque 
        WHERE 
        factory_id = $1
        AND
        booth_id = $2
        AND 
        zone_id = $3
        AND 
        robot_id = $4
        AND time_stamp between $5 and $6`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
            req.query.starttime,
            req.query.endtime,
            req.query.axis,
        ],
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTrend.get('/historical/job/list', (req, res) => {
    const query = {
        text: `SELECT 
        DISTINCT job_name 
        FROM 
        his_robot_torque 
        WHERE 
        factory_id = $1
        AND
        booth_id = $2
        AND 
        zone_id = $3
        AND 
        robot_id = $4
        AND time_stamp between $5 and $6`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
            req.query.starttime,
            req.query.endtime,
            req.query.axis,
        ],
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTrend.get('/historical/job', (req, res) => {
    const query = {
        text: `SELECT 
        time_stamp, 
        motor_torque[$7] 
        FROM 
        his_robot_torque 
        WHERE 
        factory_id = $1
        AND
        booth_id = $2
        AND 
        zone_id = $3
        AND 
        robot_id = $4
        AND
        job_name = $8 
        AND time_stamp between $5 and $6`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
            req.query.starttime,
            req.query.endtime,
            req.query.axis,
            req.query.jobname,
        ],
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueTrend.post('/robot/value', (req, res) => {
    if (req.body.robotid !== undefined && req.body.violation !== undefined && req.body.failure !== undefined) {
        commonModule.factory.realtimeTorqueLoadFactorWarningValue = {
            robotid: req.body.robotid,
            violation: req.body.violation,
            failure: req.body.failure,
        };
        res.status(200).send('');
    } else {
        res.status(404).send('');
    }
});

torqueTrend.get('/robot/value', (req, res) => {
    if (req.query.robotid !== undefined) {
        res.status(200).send(commonModule.factory.getRealtimeTorqueLoadFactorWarningValue(req.query.robotid));
    } else {
        res.status(404).send('');
    }
});