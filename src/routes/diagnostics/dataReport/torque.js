/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const torque = express.Router();
export { torque };
const bodyParser = require('body-parser');
const commonModule = require('../../app');

torque.use(bodyParser.urlencoded({ extended: true }));
torque.use(bodyParser.json());

torque.get('/temperature/', (req, res) => {
  res.status(200).send('Torque Analysis');
});

torque.post('/data/graph', (req, res) => {
  const query = `SELECT step_no, round(avg(t.motor_torque [${
    req.body.axis
  }]), 0) AS Torque FROM his_robot_torque AS t WHERE factory_id = ${
    req.body.factoryid
  } AND booth_id = ${
    req.body.boothid
  } AND zone_id = ${
    req.body.zoneid
  } AND robot_id = ${
    req.body.robotid
  } AND time_stamp BETWEEN '${
    req.body.prevtime
  } 00:00:00' AND '${
    req.body.currtime
  } 23:59:59' AND (motor_torque [ 1 ]= 0 AND motor_torque [ 2 ] = 0 AND motor_torque [ 3 ] = 0 \
    AND motor_torque [ 4 ] = 0 AND motor_torque [ 5 ] = 0 AND motor_torque [ 6 ]= 0 AND motor_torque [ 7 ] = 0) \
    != TRUE AND job_name = '${
  req.body.jobname
}' GROUP BY step_no ORDER BY step_no ASC`;
  commonModule.mainDB.execute(query, req.session.spsid, res);
});