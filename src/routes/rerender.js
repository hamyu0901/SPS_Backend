const express = require('express');
const rerender = express.Router();
const bodyParser = require('body-parser');
const commonModule = require('./app');
const ip = require('ip');

rerender.use(bodyParser.urlencoded({ extended: true }));
rerender.use(bodyParser.json());

class routerStructure {
    url = {
        login : '/login',
        root : {
            default :       '/sps',
            home :          '/sps/home',
            monitoring : {
                default:  '/sps/monitoring',
                allmonitoring: '/sps/monitoring/allmonitoring',
                zonemonitoring: '/sps/monitoring/zonemonitoring',
                robotdetail: '/sps/monitoring/robotdetail',
                line: '/sps/monitoring/line',
                detail: '/sps/monitoring/detail/zone/:zoneId'
            },
            torquemonitoring : {
                default:  '/sps/torquemonitoring',
                allmonitoring: '/sps/torquemonitoring/torqueallmonitoring',
            },
            review :        '/sps/review',
            diagnostics : {
                default :           '/sps/diagnostics',
                predict :           '/sps/diagnostics/predict',
                torquedata :        '/sps/diagnostics/torquedata',
                atomizerdata :      '/sps/diagnostics/atomizerdata',
                alarmstatistics :   '/sps/diagnostics/alarmstatistics',
                torquerange :       '/sps/diagnostics/torquerange',
                torquesimilarity :  '/sps/diagnostics/torquesimilarity',
                torqueloadfactor :  '/sps/diagnostics/torqueloadfactor',
                torquetemperature : '/sps/diagnostics/torquetemperature',
                report : '/sps/diagnostics/report',
                statistics: '/sps/diagnostics/statistics'
            },
            realtime : '/sps/realtime/torque',
            maintenance :   '/sps/maintenance',
            alarm : {
                default : '/sps/alarm',
                alarmview : '/sps/alarm/alarmview',
                alarminfos: '/sps/alarm/alarminfos',
                alarmmanual : '/sps/alarm/alarmmanual'
            },
            posthistory :   '/sps/posthistory',
            sparepart :     '/sps/sparepart',
            backupview :    '/sps/backupview',
            reportview :     '/sps/reportview',
            reportresult:   '/sps/reportresult',
            extra: {
                manual: '/sps/extra/manual',
                production: '/sps/extra/production',
                vinNo: '/sps/extra/vin-no-production-history',
                backup: '/sps/extra/backup'
            }
        }
    }
    constructor() {
    }

    loginURL() {
        return this.url.login;
    }
    homeURL() {
        return this.url.root.home;
    }
    monitoringURL() {
        return this.url.root.monitoring;
    }
    lineMonitoringURL() {
        return this.url.root.monitoring.line;
    }
    detailMonitoringURL() {
        return this.url.root.monitoring.detail;
    }
    allMonitoringURL() {
        return this.url.root.monitoring.allmonitoring;
    }
    torqueMonitoringURL() {
        return this.url.root.torquemonitoring;
    }
    torqueAllMonitoringURL() {
        return this.url.root.torquemonitoring.allmonitoring;
    }
    zoneMonitoringURL() {
        return this.url.root.monitoring.zonemonitoring;
    }
    robotMonitoringURL() {
        return this.url.root.monitoring.robotdetail;
    }
    reviewURL() {
        return this.url.root.review;
    }
    diagnosticsPredictURL() {
        return this.url.root.diagnostics.predict;
    }
    diagnosticsTorquedataURL() {
        return this.url.root.diagnostics.torquedata;
    }
    diagnosticsAtomizerdataURL() {
        return this.url.root.diagnostics.atomizerdata;
    }
    diagnosticsAlarmstatisticsURL() {
        return this.url.root.diagnostics.alarmstatistics;
    }
    diagnosticsTorquerangeURL() {
        return this.url.root.diagnostics.torquerange;
    }
    diagnosticsTorquesimilarityURL() {
        return this.url.root.diagnostics.torquesimilarity;
    }
    diagnosticsTorqueloadfactorURL() {
        return this.url.root.diagnostics.torqueloadfactor;
    }
    diagnosticsTorquetemperatureURL() {
        return this.url.root.diagnostics.torquetemperature;
    }
    diagnosticsReportURL() {
        return this.url.root.diagnostics.report;
    }
    diagnosticsStatisticsURL() {
        return this.url.root.diagnostics.statistics;
    }
    realtimeURL() {
        return this.url.root.realtime;
    }
    maintenanceURL() {
        return this.url.root.maintenance;
    }
    alarmViewURL() {
        return this.url.root.alarm.alarmview;
    }
    alarmInfosURL() {
        return this.url.root.alarm.alarminfos;
    }
    alarmManualURL() {
        return this.url.root.alarm.alarmmanual;
    }
    alarmSettingURL() {
        return this.url.root.alarm.alarmsetting;
    }
    posthistoryURL() {
        return this.url.root.posthistory;
    }
    sparepartURL() {
        return this.url.root.sparepart;
    }
    backupviewURL() {
        return this.url.root.backupview;
    }
    reportviewURL() {
        return this.url.root.reportview;
    }
    reportresultURL() {
        return this.url.root.reportresult;
    }
    extraManualURL() {
        return this.url.root.extra.manual;
    }
    extraProductionURL() {
        return this.url.root.extra.production;
    }
    extraVinNoURL() {
        return this.url.root.extra.vinNo;
    }
    extraBackupURL() {
        return this.url.root.extra.backup;
    }
}
const router = new routerStructure();

function redirectURL(request, response) {
    if (commonModule.sess.requestAuth(request.session.spsid)) {
        response.sendFile('/index.html', { root: './public' });
    }
    else {
        let domain = request.ip;
        if (domain.match('127.0.0.1')) {
            domain = 'localhost';
        }
        else {
            domain = ip.address();
        }
        response.redirect(request.protocol + '://' + domain + ':' + ((request.protocol == 'http') ? 8000 : 5000));
    }
}

rerender.get(router.loginURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.homeURL(), function (req, res) {
    redirectURL(req, res);
})

rerender.get(router.monitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.lineMonitoringURL(), (req, res) => {
    redirectURL(req,res);
})

rerender.get(router.detailMonitoringURL(), (req, res) => {
    redirectURL(req,res);
})

rerender.get(router.allMonitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.zoneMonitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.robotMonitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.torqueMonitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.torqueAllMonitoringURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsPredictURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsTorquedataURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsAtomizerdataURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsAlarmstatisticsURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsTorquerangeURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsTorquesimilarityURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsTorqueloadfactorURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsTorquetemperatureURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsStatisticsURL(), function(req, res)  {
    redirectURL(req, res);
})

rerender.get(router.realtimeURL(), (req, res) => {
    redirectURL(req, res);
})

rerender.get(router.maintenanceURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.alarmViewURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.alarmInfosURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.alarmManualURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.posthistoryURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.sparepartURL(), function(req, res) {
    redirectURL(req, res);
})


rerender.get(router.backupviewURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.diagnosticsReportURL(), function(req, res) {
    redirectURL(req, res)
})
rerender.get(router.reportviewURL(), function(req, res) {
    redirectURL(req, res);
})
rerender.get(router.reportresultURL(), function(req, res) {
    redirectURL(req, res);
})

rerender.get(router.extraManualURL(), (req, res) => {
    redirectURL(req, res);
})

rerender.get(router.extraProductionURL(), (req, res) => {
    redirectURL(req, res);
})

rerender.get(router.extraVinNoURL(), (req, res) => {
    redirectURL(req, res);
})

rerender.get(router.extraBackupURL(), (req, res) => {
    redirectURL(req, res);
})
export { rerender }