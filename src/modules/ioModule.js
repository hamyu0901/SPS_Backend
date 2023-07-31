const appHandle = require('../routes/app');

class ioModule {
    constructor(http) {
        this.io = require('socket.io')(http);
    }
    intervalL = null;
    intervalR = null;
    connections = new Set();
    getInstance() {
        return this.io;
    }

    notifyRun() {
        this.io.on('connection', socket => {
            this.connections.add(socket);
            socket.on('monitoring_emit', () => {
                appHandle.mainDB.notificationInitClient();
            })
            socket.on('robot_status_emit', () => {
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.query('LISTEN notify_robot_status');
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.on('notification', msg => {
                    msg.channel === 'notify_robot_status' && socket.emit('robot_status', typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload);
                })
            })

            socket.on('monitoring_disconnect', async () => {
                appHandle.mainDB.notifyDBClient && await appHandle.mainDB.notifyDBClient.query('UNLISTEN notify_robot_status');
                appHandle.mainDB.notifyDBClient && await appHandle.mainDB.notifyDBClient.query('UNLISTEN notify_zone_alarm');
                appHandle.mainDB.notifyDBClient && await appHandle.mainDB.notifyDBClient.query('UNLISTEN notify_robot_ppmode');
                await appHandle.mainDB.notifyEnd();
            })
            socket.on('robot_mode_emit', () => {
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.query('LISTEN notify_robot_ppmode');
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.on('notification', msg => {
                    msg.channel === 'notify_robot_ppmode' && socket.emit('robot_ppmode', typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload);
                })
            })
            socket.on('zone_alarm_emit', () => {
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.query('LISTEN notify_zone_alarm');
                appHandle.mainDB.notifyDBClient && appHandle.mainDB.notifyDBClient.on('notification', msg => {
                    msg.channel === 'notify_zone_alarm' && socket.emit('zone_alarm', typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload);
                })
            })
            socket.on('error', (error) => {
                console.log(error);
            }),
            socket.on('disconnect', () => {
                this.connections.delete(socket);
                socket.disconnect();
            })
        })
    }
};

export { ioModule }