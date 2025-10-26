"use strict";
const electron = require("electron");
const electronAPI = {
  auth: {
    login: (credentials) => electron.ipcRenderer.invoke("auth:login", credentials),
    logout: () => electron.ipcRenderer.invoke("auth:logout"),
    refreshToken: (token) => electron.ipcRenderer.invoke("auth:refresh", token)
  },
  users: {
    getAll: () => electron.ipcRenderer.invoke("users:getAll"),
    getById: (id) => electron.ipcRenderer.invoke("users:getById", id),
    create: (data) => electron.ipcRenderer.invoke("users:create", data),
    update: (id, data) => electron.ipcRenderer.invoke("users:update", id, data),
    delete: (id) => electron.ipcRenderer.invoke("users:delete", id)
  },
  files: {
    save: (path, content) => electron.ipcRenderer.invoke("files:save", path, content),
    read: (path) => electron.ipcRenderer.invoke("files:read", path)
  },
  agent: {
    start: () => electron.ipcRenderer.invoke("agent:start"),
    stop: () => electron.ipcRenderer.invoke("agent:stop"),
    getStatus: () => electron.ipcRenderer.invoke("agent:getStatus"),
    getPrinters: () => electron.ipcRenderer.invoke("agent:getPrinters"),
    discoverPrinters: () => electron.ipcRenderer.invoke("agent:discoverPrinters"),
    printFile: (printerName, filePath, options) => electron.ipcRenderer.invoke("agent:printFile", printerName, filePath, options),
    testPrint: (printerName, filePath) => electron.ipcRenderer.invoke("agent:testPrint", printerName, filePath),
    isRunning: () => electron.ipcRenderer.invoke("agent:isRunning")
  }
};
electron.contextBridge.exposeInMainWorld("electron", electronAPI);
