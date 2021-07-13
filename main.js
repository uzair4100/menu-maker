const electron = require("electron");
const url = require("url");
const path = require("path");
const dialog = electron.dialog;
const ipc = electron.ipcMain;
const { app, BrowserWindow } = electron;
var mainWindow;
const { shell } = require("electron");

app.on("ready", function() {
    //create new window
    mainWindow = new BrowserWindow({
        minWidth: 1220,
        width: 1220,
        minHeight: 1030,
        height: 1030,
        webPreferences: {
            nodeIntegration: true
        }
    });
    //mainWindow.openDevTools();
    //mainWindow.autoHideMenuBar = true;
    // load html
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "index.html"),
            protocol: "file",
            slashes: true
        })
    );
});