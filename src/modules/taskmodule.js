import { setInterval } from "timers";
import { sess } from "../routes/app";
const pidusage = require('pidusage');
const appHandle = require('../routes/app');

const cmModule = require('../modules/cmmodule');
const sessList = new cmModule.templateList();

class taskManager {
    language = 'kr'

    constructor() {
        
    }

    initialize() {
        //this.startCpuCheck();
        //this.startMemoryCheck();
    }

    startCpuCheck() {
        setInterval(function() {
            pidusage(process.pid, function (err, stats) {
                let timeInfo = new Date(stats.timestamp);
                const time = timeInfo.getHours() + ":" + timeInfo.getMinutes() + ":" + timeInfo.getSeconds();
                stats = stats.cpu.toFixed(0);
                appHandle.io.emit('cpu', stats)
            }.bind(this))
        }, 1000);
    }

    startMemoryCheck() {
        setInterval(function() {
            pidusage(process.pid, function (err, stats) {
                let timeInfo = new Date(stats.timestamp);
                const time = timeInfo.getHours() + ":" + timeInfo.getMinutes() + ":" + timeInfo.getSeconds();
                stats = stats.memory / 10000000;
                stats = stats.toFixed(1);
                appHandle.io.emit('memory', stats)
            }.bind(this))
        }, 1000);
    }

    setGlobalLanguage(language) {
        this.language = language;
    }

    getGlobalLanguage() {
        return this.language;
    }
}

class sessionManager {
    debugMode = false;

    constructor() {

    }

    setDebugMode() {
        this.debugMode = true;
    }

    isDebugMode() {
        return this.debugMode;
    }

    makeSessionID() {
        let text = "";
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 5; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    requestAuth(session) {
        // [TODO]: 인증(세션)관련 로직 수정해야함.
        /** 폐쇠망으로 인해 큰 문제는 없지만, 기존 로직 수정에 시간이 필요한 이유로 추후 수정 예정 */
        return true;
        // if (this.isDebugMode()) {
        //     return true;
        // }
        // else {
        //     return this.find(session);
        // }
    }

    push(session) {
        this.listContainor.append(session);
    }

    find(session) {
        if (this.listContainor.find(session) >= 0) {
            return true;
        }
        else {
            return false;
        }
    }

    pop(session) {
        return this.listContainor.remove(session);
    }
}

sessionManager.prototype.listContainor = sessList;

export { taskManager }
export { sessionManager }