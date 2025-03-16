/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { Menu } from 'electron';
import { resolveHtmlPath } from './util';
import puppeteer from 'puppeteer';
import { MigloPage } from '../puppeteer/MigloPage';
let isRunning = false;
let intervalId: NodeJS.Timeout | string | number | undefined;
let seleniumInterval: undefined | NodeJS.Timeout = undefined;
let browser: any;
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});
function delay(time: any) {
  return new Promise(function (resolve) {
    setTimeout(resolve, time);
  });
}
ipcMain.on(
  'start-selenium',
  async (event, { email, password }, words, selectedOption) => {
    console.log('Start');
    const appPath = path.dirname(process.execPath);

    // Ścieżka do pliku chrome.exe w zainstalowanej aplikacji
    const chromiumPath =
      process.env.NODE_ENV === 'production'
        ? path.join(
            appPath,
            'resources',
            'release',
            'app',
            'chromium',
            'chrome.exe',
          )
        : puppeteer.executablePath(); // Launch the browser and open a new blank page
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: selectedOption,
    });
    const page = await browser.newPage();
    const miglo = await new MigloPage(page);
    // Navigate the page to a URL.
    // Set screen size.
    await miglo.goToPage();
    await miglo.login(email, password);
    await delay(5000);
    isRunning = true;
    intervalId = setInterval(async () => {
      if (isRunning) {
        console.log('Performing actions...');
        await miglo.addMatchingProductsToCart(words);
        await delay(5000);
        await miglo.buy();
        await delay(5000);
        await page.reload();
        await delay(5000);
      } else {
        clearInterval(intervalId);
        console.log('Stopped Selenium actions.');
      }
    }, 25000);

    console.log('Start Selenium - end');
  },
);

ipcMain.on('stop-selenium', async (event, arg) => {
  console.log('Stop Selenium');
  isRunning = false;
  await browser.close();
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
