/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable global-require */
/* eslint-disable no-underscore-dangle */
import { app, BrowserWindow } from 'electron';
const find = require('find-process');
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9080'
  : `file://${__dirname}/index.html`;

function getSPSSentinelProcess() {
  if (isDevelopment()) {
    return true;
  }
  return find('name', 'SPSSentinel', true).then((list) => {
    if (list[0].name === 'SPSSentinel.exe') {
      return true;
    }
  }).catch((error) => {
    app.quit();
    return false;
  });
}

function isDevelopment() {
  return (process.env.NODE_ENV === 'development') ? true : false;
}

function startServer() {
  const server = require('../routes/app');
}

async function createWindow() {
  if (await getSPSSentinelProcess()) {
    mainWindow = new BrowserWindow({
      height: 700,
      useContentSize: true,
      width: 1000,
    });
    mainWindow.loadURL(winURL);
    startServer();
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  } else {
    app.quit();
  }
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
