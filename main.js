const electron = require("electron");
const url = require("url");
const path = require("path");
const dialog = electron.dialog;
const ipcMain = electron.ipcMain;
const { app, BrowserWindow } = electron;
const isDev = require('electron-is-dev');
var mainWindow;
const { shell } = require("electron");

app.on("ready", function() {
    //create new window
    mainWindow = new BrowserWindow({
        width: 950,
        minHeight: 850,
        height: 850,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.openDevTools();
    mainWindow.removeMenu()
        // load html
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file",
            slashes: true
        })
    );

    mainWindow.webContents.on("did-finish-load", () => {
        let appVersion = ``;
        if (isDev) {
            appVersion = `v${app.getVersion()}`;
        } else {
            appVersion = "vvvv"
        }
        console.log(appVersion)
        mainWindow.webContents.send('_version', appVersion);

    });
});


ipcMain.on('downloaded', (info) => {
    //  mainWindow.webContents.send('download-success', "Successfully Downloaded!");
    dialog.showMessageBox(mainWindow, {
        title: 'Update Available',
        type: 'question',
        message: 'A new version of app is available. Do you want to update now?',
        buttons: ['Yes', 'No']
    }, function(index) {
        console.log(index)
        mainWindow.webContents.send('user-response', index); //send user response to renderer 0 or 1
    })
});

ipcMain.on('close-app', () => {
    app.quit()
});

ipcMain.on('chooseFile-dialog', (info) => {
    console.log("received")
})