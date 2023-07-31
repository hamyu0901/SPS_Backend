const express = require('express');
const sparepart = express.Router();
const bodyParser = require('body-parser');
const commonModule = require('./app');

sparepart.use(bodyParser.urlencoded({ extended: true }));
sparepart.use(bodyParser.json());

sparepart.get('/', function(req, res) {
    res.status(200).send('Spare part');
});

// 데이터 불러오기
sparepart.post('/data/gridtable', function(req, res) {
    let query = 
    "SELECT def_robot_config.rc_model_id, def_robot_config.robot_model_id, def_robot_config.atom_model_id \
    FROM def_robot_config WHERE booth_id = "
    + req.body.boothid + 
    " AND zone_id = "
    + req.body.zoneid +
    " AND robot_id ="
    + req.body.robotid;
    commonModule.mainDB.execute(query, req.session.spsid, function(result) {
        query =
        "SELECT DISTINCT spare.part_no AS partno, spare.part_name AS partname, spare.product_no AS productno, \
        spare.remain_amount AS remainamount, spare.btime AS btime, spare.check_cycle AS checkcycle, spare.replacement_cycle AS replacecycle, \
        spare.image_id AS imageid, spare.remarks AS remarks, spare.drawing_no AS drawingno, model.model_id AS modelid, model.model_name AS modelname,	model.sub_id AS subid \
        FROM def_model_spare AS model_spare	FULL OUTER JOIN def_spare_list AS spare ON model_spare.part_no = spare.part_no \
        FULL OUTER JOIN def_model_config AS model ON model_spare.model_id = model.model_id \
        WHERE spare.part_no IS NOT NULL AND model.model_id IN ("
        + result +
        ") AND spare.part_no IN (SELECT part_no FROM def_model_spare WHERE model_id IN ("
        + result +
        ")) ORDER BY partno ASC"
        commonModule.mainDB.execute(query, req.session.spsid, res);
    })
})

// 데이터 추가
sparepart.post('/data/create', function(req, res) {
    let query =
    "INSERT INTO def_spare_list (part_no, product_no, drawing_no, remain_amount, remarks, check_cycle, \
    replacement_cycle, part_name) VALUES('"
    + req.body.partno +
    "', '"
    + req.body.productno +
    "', '"
    + req.body.drawingno +
    "', "
    + req.body.remainamount +
    ", '"
    + req.body.remarks +
    "', "
    + req.body.checkcycle +
    ", "
    + req.body.replacementcycle +
    ", '"
    + req.body.partname +
    "')";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 데이터 자세히 보기
sparepart.post('/data/detail', function(req, res) {
    let query =
    "SELECT * FROM def_spare_list WHERE part_no ='"
    + req.body.partno +
    "'";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 데이터 수정
sparepart.post('/data/modify', function(req, res) {
    let query =
    "UPDATE def_spare_list SET product_no = '"
    + req.body.productno +
    "', drawing_no = '"
    + req.body.drawingno +
    "', remain_amount = "
    + req.body.remainamount +
    ", remarks = '"
    + req.body.remarks +
    "', check_cycle = "
    + req.body.checkcycle +
    ", replacement_cycle = "
    + req.body.replacementcycle +
    ", part_name = '"
    + req.body.partname +
    "' WHERE	part_no ='"
    + req.body.partno +
    "'";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 데이터 삭제
sparepart.post('/data/delete', function(req, res) {
    let query =
    "DELETE FROM def_spare_list WHERE part_no = '" 
    + req.body.partno +
    "'";
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

export { sparepart }