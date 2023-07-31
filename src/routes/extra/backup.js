/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint linebreak-style: ["error", "windows"] */
const express = require('express');

const backUp = express.Router();
export { backUp };
const bodyParser = require('body-parser');
const commonModule = require('../app');

backUp.use(bodyParser.urlencoded({ extended: true }));
backUp.use(bodyParser.json());

backUp.get('/', (req, res) => {
    res.status(200).send('BackUp');
});

backUp.get('/list', (req, res) => {
    const query = ` SELECT TO_CHAR(update_time, 'YYYY-MM-DD HH24:MI:SS') as date , backup_file_path as path, backup_file_name as name FROM main.his_backup_data`;
    commonModule.mainDB.execute(query, req.session.spsid, res);
});

backUp.get('/download/file', (req, res) => {
    const filePath = req.query['path'];
    res.download(filePath);
});

