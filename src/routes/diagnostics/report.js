const express = require('express');

const report = express.Router();
export { report };
const bodyParser = require('body-parser');
const commonModule = require('../app');

report.use(bodyParser.urlencoded({ extended: true }));
report.use(bodyParser.json());

report.get('/', (req, res) => {
  res.status(200).send('report');
});

/*리포트 생성*/

report.post('/report', (req, res) => {
    const query = {
        text: `INSERT INTO his_report(report_name, update_time)
        VALUES($1, $2);`,
        values: [
          req.body.reportName,
          req.body.timeStamp
        ]
      }
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

// 리포트 조회
report.get('/report', (req, res) => {
    const query = {
        text: `
        SELECT
            *
        FROM
            his_report \
        `
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})


// 리포트 상세 조회 (다시 수정 필요)
// report.get('/report/detail/:zoneid', (req,res) => {
//     const query = {
//         text: `
//         SELECT
//             *
//         FROM
//             his_report_detail \
//         WHERE
//             zone_id = $1
//         `,
//         values: [
//             req.params.zoneid,
//         ],
//     };
//     commonModule.mainDB.execute(query, req.session.spsid, res);
// })

// 리포트 상세 조회
report.get('/report/detail/type/:reporttype', (req,res) => {   // report_type 별
    const query = {
        text: `
        SELECT
            *
        FROM
            his_report_detail \
        WHERE
            report_type = $1
        `,
        values: [
            req.params.reporttype
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
report.get('/report/detail/:reportid', (req,res) => {     // report_id 별
    const query = {
        text: `
        SELECT
            *
        FROM
            his_report_detail \
        WHERE
            report_id = $1
        `,
        values: [
            req.params.reportid,
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
report.get('/report/detail/type/:type/zone/:zoneid/start_date/:startdate/end_date/:enddate', (req,res) => {  // 현재 존 별 날짜 조회
    const query = {
        text: `
        SELECT
            current_data,
            robot_id,
            current_start_date,
            current_end_date
        FROM
            his_report_detail \
        WHERE
            zone_id = $1 AND report_type = $2 AND current_start_date >= $3 AND current_end_date <= $4
        `,
        values: [
            req.params.zoneid,
            req.params.type,
            req.params.startdate,
            req.params.enddate
        ],
    };
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 리포트 상세 생성
report.post('/report/:reportid',(req,res)=> {
    const query = {
        text: `INSERT INTO his_report_detail(report_id, report_type, factory_id, booth_id, zone_id, current_data, robot_id, prev_data_id, comment, current_start_date, current_end_date)
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        values: [
            req.params.reportid,
            req.body.report_type,
            req.body.factory_id,
            req.body.booth_id,
            req.body.zone_id,
            req.body.current_data,
            req.body.robot_id,
            req.body.prev_data_id,
            req.body.comment,
            req.body.current_start_date,
            req.body.current_end_date
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
// 리포트 상세 수정

report.put('/report/:reportid',(req,res)=> {
    const query = {
        text: `UPDATE his_report_detail SET current_data =$1, comment =$2, prev_data_id =$5, current_start_date =$6, current_end_date =$7 WHERE report_id = $3 AND data_id = $4` ,
        values: [
            req.body.current_data,
            req.body.comment,
            req.params.reportid,
            req.body.data_id,
            req.body.prev_data_id,
            req.body.current_start_date,
            req.body.current_end_date
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 리포트 삭제 (his_report)
report.post('/report/reportid/:reportid/delete', (req,res)=> {
    const query = {
        text:  `DELETE FROM his_report WHERE report_id = $1`,
        values: [
            req.params.reportid
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})

// 리포트 상세 정보 data_id 조회 및 삭제
report.get('/report/reportid/:reportid/delete/detail',async (req,res)=> {
    const query = {
        text: `SELECT data_id FROM his_report_detail WHERE report_id = $1`,
        values: [
            req.params.reportid
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
report.post('/report/dataid/:dataid/delete/detail',async (req,res)=> {
    const query = {
        text: `UPDATE his_report_detail SET prev_data_id = null WHERE prev_data_id = $1`,
        values: [
            req.params.dataid
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
report.post('/report/reportid/:reportid/delete/detail',async (req,res)=> {
    const query = {
        text: `DELETE FROM his_report_detail WHERE report_id = $1`,
        values: [
            req.params.reportid
        ]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})
