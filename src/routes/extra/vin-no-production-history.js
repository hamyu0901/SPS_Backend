/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const vinNoProductionHistory = express.Router();
export { vinNoProductionHistory };
const bodyParser = require('body-parser');
const commonModule = require('../app');

vinNoProductionHistory.use(bodyParser.urlencoded({ extended: true }));
vinNoProductionHistory.use(bodyParser.json());

vinNoProductionHistory.get('/', (req, res) => {
    res.status(200).send('Production History');
});

vinNoProductionHistory.get('/items', (req, res) => {
    const { vinNo, date } = req.query;
    const startDate = date + ' 00:00:00';
    const endDate = date + ' 23:59:59';
    const query = {
        text: `SELECT disp_booth_id, zone_no, main.his_production_information.zone_id, zone_name, robot_no, robot_name, main.his_production_information.robot_id, vin_no, update_time, column_name, record FROM main.his_production_information
        INNER JOIN main.robot_config ON main.robot_config.robot_id = main.his_production_information.robot_id INNER JOIN main.zone_config ON main.zone_config.zone_id = main.his_production_information.zone_id
        INNER JOIN main.booth_config ON main.booth_config.booth_id = main.zone_config.booth_id WHERE vin_no = $1 AND update_time BETWEEN '${startDate}' AND '${endDate}' ORDER BY disp_booth_id, zone_no, robot_no`,
        values: [vinNo]
    }
    commonModule.mainDB.execute(query, req.session.spsid, res);
})