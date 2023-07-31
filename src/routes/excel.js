/* eslint-disable import/prefer-default-export */
/* eslint-disable linebreak-style */
/* eslint-disable no-plusplus */
/* eslint-disable linebreak-style */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const excel = express.Router();
const bodyParser = require('body-parser');
const xl = require('excel4node');

excel.use(bodyParser.urlencoded({ extended: true }));
excel.use(bodyParser.json());

excel.get('/', (req, res) => {
  res.status(200).send('excel');
});

excel.post('/torquerange', (req, res) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Torque Range');
  const titleStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 15,
      bold: true,
    },
    border: {
      left: {
        style: 'thin',
        color: 'black',
      },
      right: {
        style: 'thin',
        color: 'black',
      },
      top: {
        style: 'thin',
        color: 'black',
      },
      bottom: {
        style: 'thin',
        color: 'black',
      },
      outline: false,
    },
  });
  const style = wb.createStyle({
    font: {
      color: '#000000',
      size: 12,
    },
    border: {
      left: {
        style: 'thin',
        color: 'black',
      },
      right: {
        style: 'thin',
        color: 'black',
      },
      top: {
        style: 'thin',
        color: 'black',
      },
      bottom: {
        style: 'thin',
        color: 'black',
      },
      outline: false,
    },
  });
  const stepStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 12,
      bold: true,
    },
    border: {
      left: {
        style: 'thin',
        color: 'black',
      },
      right: {
        style: 'thin',
        color: 'black',
      },
      top: {
        style: 'thin',
        color: 'black',
      },
      bottom: {
        style: 'thin',
        color: 'black',
      },
      outline: false,
    },
  });
  ws.cell(1, 1).string(String(req.body.datescript)).style(titleStyle);
  ws.cell(2, 1).string(String(req.body.date)).style(style);
  ws.cell(1, 2).string(String(req.body.boothscript)).style(titleStyle);
  ws.cell(2, 2).string(String(req.body.booth)).style(style);
  ws.cell(1, 3).string(String(req.body.zonescript)).style(titleStyle);
  ws.cell(2, 3).string(String(req.body.zone)).style(style);
  ws.cell(1, 4).string(String(req.body.robotscript)).style(titleStyle);
  ws.cell(2, 4).string(String(req.body.robot)).style(style);
  ws.cell(1, 5).string(String(req.body.jobnamescript)).style(titleStyle);
  ws.cell(2, 5).string(String(req.body.jobname)).style(style);
  ws.cell(1, 6).string(String(req.body.axisscript)).style(titleStyle);
  ws.cell(2, 6).string(String(req.body.axis)).style(style);

  ws.cell(3, 1).string(String(req.body.robotnamescript)).style(titleStyle);
  ws.cell(4, 1).string(String(req.body.robotname)).style(style);
  ws.cell(3, 2).string(String(req.body.rcnamescript)).style(titleStyle);
  ws.cell(4, 2).string(String(req.body.rcname)).style(style);
  ws.cell(3, 3).string(String(req.body.robotmodelscript)).style(titleStyle);
  ws.cell(4, 3).string(String(req.body.robotmodel)).style(style);
  ws.cell(3, 4).string(String(req.body.atommodelscript)).style(titleStyle);
  ws.cell(4, 4).string(String(req.body.atommodel)).style(style);
  ws.cell(3, 5).string(String(req.body.ipscript)).style(titleStyle);
  ws.cell(4, 5).string(String(req.body.ip)).style(style);
  ws.cell(3, 6).string(String(req.body.installdatescript)).style(titleStyle);
  ws.cell(4, 6).string(String(req.body.installdate)).style(style);

  const stepCnt = Number(req.body.stepcount) + 1;
  const torqueLoadfactor = req.body.torqueloadfactorvalue;
  const torqueLoadFactorWarning = req.body.torqueloadfactorwarnvalue;

  ws.cell(5, 1).string(String(req.body.stepscript)).style(titleStyle);
  ws.cell(5, 2).string(String(req.body.torqueloadfactorminscript)).style(titleStyle);
  ws.cell(5, 3).string(String(req.body.torqueloadfactormaxscript)).style(titleStyle);
  ws.cell(5, 4).string(String(req.body.torqueloadfactorwarnminscript)).style(titleStyle);
  ws.cell(5, 5).string(String(req.body.torqueloadfactorwarnmaxscript)).style(titleStyle);
  ws.cell(5, 6).string('').style(titleStyle);
  for (let idx = 1, i = 6; idx < stepCnt; ++i, ++idx) {
    ws.cell(i, 1).string(String(torqueLoadfactor[idx - 1].stepno)).style(stepStyle);
    ws.cell(i, 2).string(String(torqueLoadfactor[idx - 1].min)).style(style);
    ws.cell(i, 3).string(String(torqueLoadfactor[idx - 1].max)).style(style);
    if (torqueLoadFactorWarning != null) {
      ws.cell(i, 4).string(String(torqueLoadFactorWarning[0].min_val[idx - 1])).style(style);
      ws.cell(i, 5).string(String(torqueLoadFactorWarning[0].max_val[idx - 1])).style(style);
      ws.cell(i, 6).string('').style(style);
    } else {
      ws.cell(i, 4).string('').style(style);
      ws.cell(i, 5).string('').style(style);
      ws.cell(i, 6).string('').style(style);
    }
  }
  wb.write('TorqueRange.xlsx', res);
});

excel.post('/torquesimilarity', (req, res) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Torque Similarity');
  const titleStyle = wb.createStyle({
    font: {
      color: '#000000',
      size: 15,
      bold: true,
    },
    border: {
      left: {
        style: 'thin',
        color: 'black',
      },
      right: {
        style: 'thin',
        color: 'black',
      },
      top: {
        style: 'thin',
        color: 'black',
      },
      bottom: {
        style: 'thin',
        color: 'black',
      },
      outline: false,
    },
  });
  const style = wb.createStyle({
    font: {
      color: '#000000',
      size: 12,
    },
    border: {
      left: {
        style: 'thin',
        color: 'black',
      },
      right: {
        style: 'thin',
        color: 'black',
      },
      top: {
        style: 'thin',
        color: 'black',
      },
      bottom: {
        style: 'thin',
        color: 'black',
      },
      outline: false,
    },
  });

  ws.cell(1, 1).string(String(req.body.boothscript)).style(titleStyle);
  ws.cell(2, 1).string(String(req.body.lbooth)).style(style);
  ws.cell(1, 2).string(String(req.body.zonescript)).style(titleStyle);
  ws.cell(2, 2).string(String(req.body.lzone)).style(style);
  ws.cell(1, 3).string(String(req.body.robotscript)).style(titleStyle);
  ws.cell(2, 3).string(String(req.body.lrobot)).style(style);
  ws.cell(1, 4).string(String(req.body.axisscript)).style(titleStyle);
  ws.cell(2, 4).string(String(req.body.axis)).style(style);
  ws.cell(3, 1).string(String(req.body.jobnamescript)).style(titleStyle);
  ws.cell(4, 1).string(String(req.body.ljob)).style(style);

  ws.cell(3, 2).string(String(req.body.starttimescript)).style(titleStyle);
  ws.cell(4, 2).string((req.body.indvjob === 'false') ? String(req.body.ldate) : String(req.body.lstarttime)).style(style);
  ws.cell(3, 3).string((req.body.indvjob === 'false') ? '' : String(req.body.endtimescript)).style(titleStyle);
  ws.cell(4, 3).string((req.body.indvjob === 'false') ? '' : String(req.body.lendtime)).style(style);
  ws.cell(3, 4).string((req.body.indvjob === 'false') ? '' : String(req.body.cyclescript)).style(titleStyle);
  ws.cell(4, 4).string((req.body.indvjob === 'false') ? '' : String(req.body.lcycletime)).style(style);

  ws.cell(5, 1).string(String(req.body.boothscript)).style(titleStyle);
  ws.cell(6, 1).string(String(req.body.lbooth)).style(style);
  ws.cell(5, 2).string(String(req.body.zonescript)).style(titleStyle);
  ws.cell(6, 2).string(String(req.body.lzone)).style(style);
  ws.cell(5, 3).string(String(req.body.robotscript)).style(titleStyle);
  ws.cell(6, 3).string(String(req.body.lrobot)).style(style);
  ws.cell(5, 1).string(String(req.body.jobnamescript)).style(titleStyle);
  ws.cell(6, 1).string(String(req.body.rjob)).style(style);

  ws.cell(5, 2).string(String(req.body.starttimescript)).style(titleStyle);
  ws.cell(6, 2).string((req.body.indvjob === 'false') ? String(req.body.rdate) : String(req.body.rstarttime)).style(style);
  ws.cell(5, 3).string((req.body.indvjob === 'false') ? '' : String(req.body.endtimescript)).style(titleStyle);
  ws.cell(6, 3).string((req.body.indvjob === 'false') ? '' : String(req.body.rendtime)).style(style);
  ws.cell(5, 4).string((req.body.indvjob === 'false') ? '' : String(req.body.cyclescript)).style(titleStyle);
  ws.cell(6, 4).string((req.body.indvjob === 'false') ? '' : String(req.body.rcycletime)).style(style);

  ws.cell(7, 1, 7, 4, true).string(String(req.body.loadfactorscript)).style(titleStyle);
  ws.cell(8, 1).string(String(req.body.secondscript)).style(titleStyle);
  ws.cell(8, 2).string(String(req.body.search1)).style(titleStyle);
  ws.cell(8, 3).string(String(req.body.secondscript)).style(titleStyle);
  ws.cell(8, 4).string(String(req.body.search2)).style(titleStyle);

  const lData = req.body.ldata;
  const rData = req.body.rdata;
  const lSec = lData.length + 1;
  const rSec = rData.length + 1;
  for (let idx = 1, i = 9; idx < lSec; ++i, ++idx) {
    ws.cell(i, 1).string((req.body.indvjob === 'false') ? String((lData[idx - 1].step_no)) : String((lData[idx - 1][0] / 1000).toFixed(1))).style(titleStyle);
    ws.cell(i, 2).string((req.body.indvjob === 'false') ? String(lData[idx - 1].torque) : String(lData[idx - 1][2])).style(style);
  }
  for (let idx = 1, i = 9; idx < rSec; ++i, ++idx) {
    ws.cell(i, 3).string((req.body.indvjob === 'false') ? String((rData[idx - 1].step_no)) : String((rData[idx - 1][0] / 1000).toFixed(1))).style(titleStyle);
    ws.cell(i, 4).string((req.body.indvjob === 'false') ? String(rData[idx - 1].torque) : String(rData[idx - 1][2])).style(style);
  }

  wb.write('TorqueSimilarity.xlsx', res);
});

export { excel };
