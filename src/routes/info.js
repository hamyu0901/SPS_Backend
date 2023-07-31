import { common } from '../modules/cmmodule';

const express = require('express');
const info = express.Router();
const bodyParser = require('body-parser');

const commonModule = require('./app');
const adGridKey = 'CompanyName=Yesinsoft Inc._on_behalf_of_DOOLIM-YASKAWA Co. Ltd.,LicensedGroup=DY Smart Work,LicenseType=MultipleApplications,LicensedConcurrentDeveloperCount=4,LicensedProductionInstancesCount=0,AssetReference=AG-022844,ExpiryDate=2_December_2022_[v2]_MTY2OTkzOTIwMDAwMA==61600137da1d12343d26857daf21ef29'
info.use(bodyParser.urlencoded({ extended: true }));
info.use(bodyParser.json());

info.get('/', function(req, res) {
    res.status(200).send('info');
})

info.get('/alive', function(req, res) {
    res.status(200).send();
})

info.get('/factorys', function(req, res) {
    if(commonModule.infoManager.getFactoryID() == "") {
        commonModule.mainDB.setFactoryId(function(result) {
            commonModule.infoManager.setFactoryID(result[0][0]);
        })
    }
    res.status(200).json(commonModule.infoManager.getFactoryID());
})

info.post('/factory', function(req, res) {
    let query = "SELECT factory_name FROM def_factory_config WHERE factory_id = "
    + req.body.factoryid;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/factoryid/:factoryid/auth', (req, res) => {
    let query = {
        text: "SELECT auth FROM public.web_config WHERE factory_id = $1;",
        values: [
            req.params.factoryid
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.post('/booths', function(req, res) {
    let query = "SELECT booth_name as name, booth_id as id from def_booth_config Where factory_id= '"
    + req.body.factoryid +
    "' order by show";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.post('/zones', function(req, res) {
    let query = "SELECT booth_id as booth, zone_name as name, zone_id as id from def_zone_config Where factory_id= '"
    + req.body.factoryid +
    "' order by show";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.post('/robots', function(req, res) {
    let query = "SELECT zone_id AS zone, robot_name AS name, robot_id AS id, robot_type AS robottype FROM def_robot_config WHERE factory_id= '"
    + req.body.factoryid +
    "' ORDER BY show";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.post('/language', function(req, res) {
    commonModule.task.setGlobalLanguage(req.body.language);
    res.status(200).send(commonModule.task.getGlobalLanguage());
})

info.post('/boothid', function(req, res) {
    let query =
    "SELECT booth_id FROM def_booth_config WHERE booth_name = '"
    + req.body.boothname +
    "'";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.post('/zoneid', function(req, res) {
    let query =
    "SELECT zone_id FROM def_zone_config WHERE zone_name = '"
    + req.body.zonename +
    "'";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/historian', function(req, res) {
    if (commonModule.sess.requestAuth(req.session.spsid)) {
        if (commonModule.infoManager.getFactoryID() === 308) {
            res.status(200).send('HMMR');
        }
        else {
            res.status(200).send('STANDARD');
        }
    }
    else {
        res.status(404).send('not login');
    }
})

info.get('/extend/zone', function(req, res) {
    if (commonModule.sess.requestAuth(req.session.spsid)) {
        if (commonModule.infoManager.getFactoryID() === 801) {
            res.status(200).send('CHERRY');
        }
        else {
            res.status(200).send('STANDARD');
        }
    }
    else {
        res.status(404).send('not login');
    }
})

info.get('/copyright', (req, res) => {
    res.status(200).json(commonModule.setCfg.getCopyRight());
});

info.get('/active/pid', (req, res) => {
    let query = `select state, pid from pg_stat_activity where state = 'active' and wait_event = 'DataFileRead'`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

info.get('/active/kill/:pid', (req, res) => {
    let query = `SELECT pg_cancel_backend(${req.params.pid});`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

// new 부스 정보 조회
info.get('/renew/booths', (req, res) => {
    const query = "SELECT * FROM main.booth_config ORDER BY booth_no";
    commonModule.mainDB.execute(query, req.session.spsid, res);
});
info.get('/renew/zones', function(req, res) {
    const query = "SELECT booth_id, disp_booth_id, zone_id, zone_no, zone_name FROM main.zone_config ORDER BY zone_no";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
info.get('/renew/robots', function(req, res) {
    const query = `SELECT zone_id, robot_no, robot_name, robot_id, rc_model_id, robot_ip, tool_id, robot_model_name, rc_model_name, alarm_status, (cart + axis_count) as robot_axis FROM (\
    SELECT main.robot_config.zone_id, robot_no, robot_name, main.robot_config.robot_id, main.robot_config.rc_model_id , robot_ip, robot_model.robot_model_name, rc_model.rc_model_name, is_cart, tool_id, robot_level as alarm_status,\
    CASE WHEN is_cart IS true THEN 1 ELSE 0 END AS cart, robot_model.axis_count FROM main.robot_config \
    INNER JOIN main.def_robot_model robot_model on robot_model.robot_model_id = main.robot_config.robot_model_id \
    INNER JOIN main.def_rc_model rc_model on rc_model.rc_model_id = main.robot_config.rc_model_id \
    LEFT OUTER JOIN main.his_daily_report daily_report on daily_report.robot_id = main.robot_config.robot_id AND
    daily_report.date BETWEEN current_date - 1 AND current_date)T`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
info.get('/rc/model', function(req, res) {
    const query = `SELECT * FROM main.def_rc_model`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/robot/tool', function(req, res) {
    const query = `SELECT * FROM main.def_tool_model`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/user/auth', function(req, res) {
    const { userId } = req.query;
    const query = `SELECT user_authority FROM def_user_config WHERE user_id = ${userId}`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
info.get('/license/key', function(req, res) {
    res.send(adGridKey).status(200);
})

info.get('/alarm/type', (req, res) => {
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT type_id, type_name_${language} AS type_name FROM main.def_alarm_type`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/robot/part', (req, res) => {
    const language = commonModule.task.getGlobalLanguage();
    const query = `SELECT part_id, part_name_${language} AS part_name, part_level FROM main.def_robot_part`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

info.get('/robot/alarm/part/match', (req, res) => {
    const query = `SELECT * FROM main.def_alarm_part_match`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
export {info}