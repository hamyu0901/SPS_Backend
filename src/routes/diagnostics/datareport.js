/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const dataReport = express.Router();
export { dataReport };
// const bodyParser = require('body-parser');
// const commonModule = require('../app');
const alarm = require('./dataReport/alarm');
const temperature = require('./dataReport/temperature');
const torque = require('./dataReport/torque');


dataReport.use('/temperature', temperature.temperature);
dataReport.use('/alarm', alarm.alarm);
dataReport.use('/torque', torque.torque);

// dataReport.use(bodyParser.urlencoded({ extended: true }));
// dataReport.use(bodyParser.json());