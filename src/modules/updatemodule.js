const appHandle = require('../routes/app');

export class UpdateModule {
    constructor(sec) {
        this.cycle = sec;
    }
    alarm = appHandle.alarmQuery;
    io = appHandle.ioManager.io;
    factoryid = Number(appHandle.infoManager.getFactoryID());
    getInstance() {
        return this;
    }
    updateAlarm() {
        setInterval(async() => {
            this.io.emit('alarm', await this.alarm.updateAlarm({
                factoryid: this.factoryid,
            }));
        }, this.cycle);
    }
};