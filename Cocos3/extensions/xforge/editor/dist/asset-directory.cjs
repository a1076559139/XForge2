"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fs = require("fs");
const path = require("path");
const $ = {
  "code": "#code",
  "section": "#section"
};
const template = `
<ui-section id="section" header="文件夹说明" expand>
    <ui-code id="code"></ui-code>
</ui-section>
`;
function update(assetList, metaList) {
  this.assetList = assetList;
  this.metaList = metaList;
  if (assetList.length === 0) {
    this.$.code.innerHTML = "";
  } else {
    this.$.code.innerHTML = assetList.filter((asset) => {
      const mdFile = path.join(asset.file, `.${asset.name}.md`);
      return fs.existsSync(mdFile);
    }).map((asset) => {
      const mdFile = path.join(asset.file, `.${asset.name}.md`);
      const mdStr = fs.readFileSync(mdFile, "utf-8");
      return assetList.length > 1 ? `${asset.url}:
 ${mdStr}` : mdStr;
    }).join("\n") || "";
  }
  if (this.$.code.innerHTML === "") {
    this.$.section.hidden = true;
  } else {
    this.$.section.hidden = false;
  }
}
function ready() {
}
function close() {
}
exports.$ = $;
exports.close = close;
exports.ready = ready;
exports.template = template;
exports.update = update;
