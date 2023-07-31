import e from 'cors';

const pg = require('pg');

pg.defaults.poolIdleTimeout = 30000;
var parser = pg.types.getTypeParser(1114);
pg.types.setTypeParser(1114, function(str) {
    var date = parser(str);
    return new Date( date.getTime() - date.getTimezoneOffset() * 60 * 1000 );
});

const appHandle = require('../routes/app');

class pgTask {
    dbConfig;
    dbClient;
    notifyDBClient;

    constructor(ip, port, name) {
        this.config = {
            ip : ip,
            pw: 'SPSMon0350',
            port: port,
            name: name,
        }
    }

    notificationInitClient() {
        this.notifyDBClient = new pg.Client({
            host: this.config.ip,
            database: this.config.name,
            user: 'postgres',
            password: this.config.pw,
            port: this.config.port,
        })
        this.notifyStart();
    }

    initialize() {
        this.dbClient = new pg.Pool({
            host: this.config.ip,
            database: this.config.name,
            user: 'postgres',
            password: this.config.pw,
            port: this.config.port,
            connectionTimeoutMillis: 0,
          })
        this.start();
    }

    start() {
        this.dbClient.connect(err => {
            err? console.error('db client connection error', err.stack) : console.log('db client connected');
        });
    }

    notifyStart() {
        this.notifyDBClient && this.notifyDBClient.connect().then(() => {
            console.log('notify db client connected');
        }).catch(err => console.error('notify db client connection err', err.stack));
    }

    end() {
        this.dbClient.end(err => {
            console.log('db client has disconnected');
            err && console.log('db client error during disconnection', err.stack);
        });
    }

    notifyEnd() {
        this.notifyDBClient && this.notifyDBClient.end().then(() => console.log('notify db client has disconnected'))
            .catch(err => console.error('notify db client error during disconnection', err.stack))
    }

    getInstance() {
        return this.dbClient;
    }
    execute_io(query, mutableParam) {
        if (typeof mutableParam === 'function') {
            this.dbClient.query(query, (err, res) => {
                if (err) {
                    appHandle.logMsg.error(err.message);
                    mutableParam('error');
                }
                else if (res.rows.length == 0) {
                    mutableParam('no data');
                }
                else {
                    let resData = [];
                    Object.keys(res.rows).forEach(function eachKey(key) {
                        resData.push(Object.values(res.rows[key]));
                    });
                    mutableParam(resData);
                }
            })
        }
    }

    execute_debug(query, response) {
        this.dbClient.query(query, (err, res) => {
            if (err) {
                response.status(404).json(err.message);
                return;
            }
            else if (res.rows.length == 0) {
                response.status(204).send('service failed');
            }
            else {
                response.status(200).json(res.rows);
            }
        })
    }

    consoleLogPrint(query) {
        if (appHandle.sess.isDebugMode() == true) {
            appHandle.logMsg.info(query);
        }
    }

    prepareExecute(query, response) {
        this.dbClient.query(query, (err, res) => {
            if (err) {
                appHandle.logMsg.error(err);
                response.status(404).send('error');
                return;
            }
            else if (res.rows.length == 0) {
                response.status(204).send('no data');
                return;
            }
            else {
                response.status(200).json(res.rows);
            }
        })
    }
    async execute() {
        if(arguments.length == 1){
            const query = arguments[0];
            let res;
            try {
                res = await this.dbClient.query(query);
            } catch (err) {
                appHandle.logMsg.error(err.message);
                return;
            }

            if(res.rows.length == 0){
                return;

            }else{
                
                let resData = [];
                Object.keys(res.rows).forEach(function eachKey(key) {
                    resData.push(Object.values(res.rows[key]));
                });
                return resData;
            }

            
        }else if(arguments.length === 3){

            const query = arguments[0];
            const session = arguments[1];
            const mutableParam = arguments[2];

            this.consoleLogPrint(query);
            if (query == undefined) {
                mutableParam('no data');
                return;
            }
            else {
                if (appHandle.sess.requestAuth(session)) {
                    if (typeof mutableParam === 'function') {
                        this.dbClient.query(query, (err, res) => {
                            if (err) {
                                appHandle.logMsg.error(err.message);
                                mutableParam('error');
                                return;
                            }
                            else if (res.rows.length == 0) {
                                mutableParam('no data');
                                return;
                            }
                            else {
                                let resData = [];
                                Object.keys(res.rows).forEach(function eachKey(key) {
                                    resData.push(Object.values(res.rows[key]));
                                });
                                mutableParam(resData);
                                return;
                            }
                        })
                    }
                    else {
                        this.dbClient.query(query, (err, res) => {
                            if (err) {
                                appHandle.logMsg.error(err);
                                
                                return mutableParam.status(404).send('error');
                            }
                            else if (res.rows.length == 0) {
                                
                                return mutableParam.status(204).send('no data');
                            }
                            else {
                                return mutableParam.status(200).json(res.rows);
                            }
                        })
                    }
                }
                else {
                    if (typeof mutableParam === 'function') {
                        mutableParam('not login');
                        return;
                    }
                    else {
                        mutableParam.status(404).send('not login');
                    }
                }
            }
        }
        
    }

    execute_callback_debug(query, callback) {
        this.dbClient.query(query, (err, res) => {
            if (err) {
                callback(err.message);
            }
            else if (res.rows.length == 0) {
                callback('no data');
            }
            else {
                if (typeof callback === 'function') {
                    let resData = [];
                    Object.keys(res.rows).forEach(function eachKey(key) {
                        resData.push(Object.values(res.rows[key]));
                    });
                    callback(resData);
                }
            }
        })
    }

    setFactoryId(mutableParam) {
        let query = 'SELECT factory_id FROM web_config;'
        this.dbClient.query(query, (err, res) => {
            if (err) {
                appHandle.logMsg.error(err.message);
                mutableParam('error');
                return;
            }
            else if (res.rows.length == 0) {
                mutableParam('no data');
                return;
            }
            else {
                let resData = [];
                Object.keys(res.rows).forEach(function eachKey(key) {
                    resData.push(Object.values(res.rows[key]));
                });
                mutableParam(resData);
                return;
            }
        })
    }

    isAuth(id, callback) {
        let query =
            "SELECT user_id FROM def_user_config WHERE user_id = '"
            + id +
            "'";
        this.dbClient.query(query, (err, res) => {
            if (err) {
                if (err.message == 'Connection terminated unexpectedly') {
                    callback(500);
                }
                else {
                    callback(404);
                }
            }
            else if (res.rows.length == 0) {
                callback(304);
            }
            else {
                if (typeof callback === 'function') {
                    callback(200);
                }
            }
        })
    }

    auth_pw(id, callback) {
        let query = 
        "SELECT user_password FROM def_user_config WHERE user_id = '"
        + id +
        "'";
        this.dbClient.query(query, (err, res) => {
            if (err) {
                callback(false);
            }
            else if (res.rows.length == 0) {
                callback(false);
            }
            else {
                if (typeof callback === 'function') {
                    callback(res.rows);
                }
            }
        })
    }

    register(query, response) {
        this.dbClient.query(query, (err, res) => {
            if (err) {
                response.status(404).json(err.message);
                return;
            }
            else if (res.rows.length == 0) {
                response.status(204).send('service failed');
            }
            else {
                response.status(200).json(res.rows);
            }
        })
    }

    login(id, callback) {
        let query =
            "SELECT security_code FROM def_user_config WHERE user_id = '"
            + id +
            "'";
        this.dbClient.query(query, (err, res) => {
            if (err) {
                callback(false);
            }
            else if (res.rows.length == 0) {
                callback(false);
            }
            else {
                if (typeof callback === 'function') {
                    callback(res.rows);
                }
            }
        })
    }
}

export { pgTask }