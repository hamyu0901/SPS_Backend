const express = require('express');

const extra = express.Router();
export { extra };
const bodyParser = require('body-parser');

const production = require('./extra/production-history');
const vinNoProductionHistory = require('./extra/vin-no-production-history');
const manual = require('./extra/manual');
const backup = require('./extra/backup')

extra.use('/vin-no-production-history', vinNoProductionHistory.vinNoProductionHistory);
extra.use('/production-history', production.productionHistory);
extra.use('/manual', manual.manual);
extra.use('/backUp', backup.backUp);

extra.use(bodyParser.urlencoded({ extended: true }));
extra.use(bodyParser.json());


extra.get('/', (req, res) => {
    res.status(200).send('extra');
});
