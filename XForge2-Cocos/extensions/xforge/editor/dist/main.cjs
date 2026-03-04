"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fs = require("fs");
const path = require("path");
const name = "xforge";
function getMainWebContents() {
  const windows = require("electron").BrowserWindow.getAllWindows();
  for (let i = 0; i < windows.length; i++) {
    const win = windows[i];
    if (win.webContents.getURL().includes("windows/main.html") || win.title && win.title.includes("Cocos Creator")) {
      return win.webContents;
    }
  }
  return;
}
function updateMark() {
  const webContents = getMainWebContents();
  if (webContents) {
    const hackCode = fs.readFileSync(path.join(__dirname, "../res/mark.js"), "utf-8");
    webContents.executeJavaScript(hackCode);
  }
}
const methods = {
  open() {
    Editor.Panel.open("xforge");
  },
  wiki() {
    const url = "https://gitee.com/cocos2d-zp/xforge2/wikis/pages";
    Editor.Message.send("program", "open-url", url);
  },
  issues() {
    const url = "https://gitee.com/cocos2d-zp/xforge2/issues";
    Editor.Message.send("program", "open-url", url);
  },
  store() {
    const url = "https://store.cocos.com/app/search?name=xforge";
    Editor.Message.send("program", "open-url", url);
  },
  "asset-db:ready"() {
    updateMark();
  }
};
function load() {
  console.log(`load ${name}`);
}
function unload() {
  console.log(`unload ${name}`);
}
exports.load = load;
exports.methods = methods;
exports.unload = unload;
