const express = require('express');

const torqueMonitoring = express.Router();
export { torqueMonitoring };
const bodyParser = require('body-parser');
const commonModule = require('./app');

torqueMonitoring.use(bodyParser.urlencoded({ extended: true }));
torqueMonitoring.use(bodyParser.json());

torqueMonitoring.get('/', (req, res) => {
  res.status(200).send('Torque Monitoring');
});

torqueMonitoring.get('/factory/data', (req, res) => {
    const query = {
        text: `
        SELECT
            (SELECT count(*) FROM def_robot_config) AS all_robot,
            count(*) AS predict_alarm_robot
        FROM
            public.cur_predict_data
        WHERE predict_occur[5] = 1;
        `,
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueMonitoring.get('/zone/robot', (req, res) => {
    const query = {
        text: `
        SELECT
            show
        FROM
            def_robot_config
        WHERE
            factory_id = $1
            and booth_id = $2
            and zone_id = $3`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueMonitoring.get('/zone/data', (req, res) => {
    const query = {
        text: `
        select
            robot_type,
            show as robot_name,
            (
            select
                predict_occur[5] as predict_alarm
            from
                cur_predict_data as cur
            where
                cur.robot_id = def.robot_id)
        from
            def_robot_config as def
        where
            factory_id = $1
            and booth_id = $2
            and zone_id = $3
        order by
            robot_name asc;
        `,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

torqueMonitoring.get('/zone/detail/data', (req, res) => {
    const query1 = {
        text: `
        SELECT
            factory_id,
            booth_id,
            zone_id,
            robot_id,
            time_stamp
        FROM
            cur_predict_data
        WHERE
            factory_id = $1 AND
            booth_id = $2 AND
            zone_id = $3 AND
            predict_occur[5] = 1;`,
        values: [
            req.query.factoryid,
            req.query.boothid,
            req.query.zoneid,
        ],
    };
    commonModule.mainDB.execute(query1, req.session.spsid, (data) => {
        if (String(data) === `no data`) {
            res.status(200).send(``);
            return;
        }
        let query2 = {
            text: `
            SELECT
                DISTINCT 'P005' AS code,
                (SELECT alarm_comment_${commonModule.task.getGlobalLanguage()} FROM def_predictalarm_list WHERE alarm_code = 'P005') AS content,
                time_stamp,
                end_time,
                booth_id,
                zone_id,
                robot_id,
                job_name,
                axis,
                accum_type,
                violation_value,
                config_value,
                (SELECT type_name_${commonModule.task.getGlobalLanguage()} AS accum_type FROM def_accumtype_list AS def WHERE def.accum_type = c.accum_type),
                (SELECT booth_name AS booth FROM def_booth_config AS def WHERE def.booth_id = c.booth_id),
                (SELECT zone_name AS zone FROM def_zone_config AS def WHERE def.zone_id = c.zone_id),
                (SELECT robot_name AS robot FROM def_robot_config AS def WHERE def.robot_id = c.robot_id),
                (SELECT show AS robot_name FROM def_robot_config AS r WHERE r.robot_id = c.robot_id )
            FROM
                his_violationjob_accum AS c
            WHERE
                factory_id = $1 AND
                booth_id = $2 AND
                zone_id = $3 AND
                time_stamp BETWEEN now_timestamp() - interval ${req.query.date} AND now_timestamp()
            ORDER by time_stamp DESC;`,
            values: [
                data[0][0],
                data[0][1],
                data[0][2],
            ],
        }
        commonModule.mainDB.execute(query2, req.session.spsid, res);
    });
});

//data report

torqueMonitoring.get('/factory/:factoryid/startdate/:startdate/enddate/:enddate', (req, res) => {
    const query = {
        text: `
        SELECT
            booth_id,
            zone_id,
            robot_id,
            axis,
            time_stamp
        FROM
            his_violationjob_accum \
        WHERE
            factory_id = $1 AND time_stamp >= $2 AND time_stamp <= $3
        `,
        values: [
            req.params.factoryid,
            req.params.startdate,
            req.params.enddate
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})