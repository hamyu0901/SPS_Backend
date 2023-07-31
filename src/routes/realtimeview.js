/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

export const realtimeview = express.Router();

const bodyParser = require('body-parser');
const commonModule = require('./app');

realtimeview.use(bodyParser.urlencoded({ extended: true }));
realtimeview.use(bodyParser.json());

realtimeview.get('/', (req, res) => {
  res.status(200).send('Realtime View');
});

realtimeview.get('/realtime/nx', (req, res) => {
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

realtimeview.get('/realtime/dx', (req, res) => {
    const query = {
        text: `
        SELECT 
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
        AND 
        time_stamp BETWEEN now_timestamp() - INTERVAL '1 second' AND now_timestamp()
        ORDER BY time_stamp DESC;
        `,
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

realtimeview.get('/historical', (req, res) => {
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

realtimeview.get('/historical/job/list', (req, res) => {
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

realtimeview.get('/historical/job', (req, res) => {
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

realtimeview.post('/robot/value', (req, res) => {
    if (commonModule.sess.requestAuth(req.session.spsid) !== false &&
        req.body.robotid !== undefined && 
        req.body.forwardviolation !== undefined && 
        req.body.reverseviolation !== undefined && 
        req.body.forwardwarning !== undefined && 
        req.body.reversewarning !== undefined &&
        req.body.axis !== undefined) {
        commonModule.factory.realtimeTorqueLoadFactorWarningValue = {
            robotid: req.body.robotid,
            forwardviolation: req.body.forwardviolation,
            reverseviolation: req.body.reverseviolation,
            forwardwarning: req.body.forwardwarning,
            reversewarning: req.body.reversewarning,
            axis: req.body.axis,
        };
        res.status(200).send('');
    } else {
        res.status(404).send('');
    }
});

realtimeview.get('/robot/value', (req, res) => {
    if (commonModule.sess.requestAuth(req.session.spsid) !== false &&
        req.query.robotid !== undefined &&
        req.query.axis !== undefined) {
        let robot = {
            robotid: req.query.robotid,
            axis: req.query.axis,
        }
        res.status(200).send(commonModule.factory.getRealtimeTorqueLoadFactorWarningValue(robot));
    } else {
        res.status(404).send('');
    }
});

realtimeview.post('/robot/log', (req, res) => {
    if (commonModule.sess.requestAuth(req.session.spsid) !== false &&
        req.body.timestamp !== undefined &&
        req.body.robotid !== undefined && 
        req.body.forwardviolation !== undefined && 
        req.body.reverseviolation !== undefined && 
        req.body.forwardwarning !== undefined && 
        req.body.reversewarning !== undefined 
        ) {
        commonModule.factory.realtimeTorqueLoadFactorLogMessage = {
            timestamp: req.body.timestamp,
            robotid: req.body.robotid,
            forwardviolation: req.body.forwardviolation,
            reverseviolation: req.body.reverseviolation,
            forwardwarning: req.body.forwardwarning,
            reversewarning: req.body.reversewarning,
        }
        res.status(200).send('');
    } else {
        res.status(404).send('');
    }
});

realtimeview.get('/robot/log', (req, res) => {
    if (commonModule.sess.requestAuth(req.session.spsid) !== false &&
        req.query.date !== undefined) {
        res.status(200).send(commonModule.factory.getRealtimeTorqueLoadFactorLogMessage(req.query.date));
    } else {
        res.status(404).send('');
    }
});

realtimeview.get('/robot/controller', (req, res) => {
    const query = {
        text: `
        select
            def_model_config.model_name as rc_name 
            from
            def_robot_config 
            inner join def_model_config on
            def_robot_config.rc_model_id = def_model_config.model_id
            inner join def_booth_config on
            def_robot_config.booth_id = def_booth_config.booth_id 
            and def_robot_config.factory_id = def_booth_config.factory_id 
            inner join def_zone_config on
            def_robot_config.booth_id = def_zone_config.booth_id 
            and def_robot_config.factory_id = def_zone_config.factory_id 
            and def_robot_config.zone_id = def_zone_config.zone_id 
            inner join def_model_config as c on
            def_robot_config.atom_model_id = c.model_id 
            inner join def_model_config as b on
            def_robot_config.robot_model_id = b.model_id 
            where
            def_robot_config.factory_id = $1
            and def_robot_config.booth_id = $2
            and def_robot_config.zone_id = $3
            and def_robot_config.robot_id = $4
        `,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
            req.query.robotid,
        ],
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

realtimeview.get('/robot/controller/value', (req, res) => {
    if (commonModule.sess.requestAuth(req.session.spsid) !== false && req.query.controller !== undefined) {
        if (req.query.controller === 'nx') {
            res.status(200).send(commonModule.config.realtimetorqueloadfactor.nx);
        } else {
            res.status(200).send(commonModule.config.realtimetorqueloadfactor.dx);
        }
    } else {
        res.status(404).send('');
    }
});