const appHandle = require('../routes/app');

export class HisAlarmList {
    constructor() {

    }
    _seq = appHandle.mapper;
    updateAlarm(obj) {
        let self = this;
        return new Promise((resolve, reject) => {
            this._seq.his_alarm_list.findOne(
                {
                    attributes: ['time_stamp', 'alarm_code', 'alarm_name'],
                    where: {
                        factory_id: obj.factoryid,
                    },
                    order: [['time_stamp', 'desc']],
                    limit: 1,
                }).then((res) => {
                    resolve(res);
                });
        });
    }
}