/* eslint-disable import/prefer-default-export */
/* eslint linebreak-style: ["error", "windows"] */
const siteInfo = function siteInfo() {
  this.factoryid = '';
  this.fieldid = '';
  this.boothid = '';
  this.zoneid = '';
  this.robotid = '';
};
export { siteInfo };

siteInfo.prototype.getFactoryID = function getFactoryID() {
  return this.factoryid;
};

siteInfo.prototype.setFactoryID = function setFactoryID(id) {
  this.factoryid = id;
};

siteInfo.prototype.getFieldID = function getFieldID() {
  return this.fieldid;
};

siteInfo.prototype.setFieldID = function setFieldID(id) {
  this.fieldid = id;
};

siteInfo.prototype.getBoothID = function getBoothID() {
  return this.boothid;
};

siteInfo.prototype.setBoothID = function setBoothID(id) {
  this.boothid = id;
};

siteInfo.prototype.getZoneID = function getZoneID() {
  return this.zoneid;
};

siteInfo.prototype.setZoneID = function setZoneID(id) {
  this.zoneid = id;
};

siteInfo.prototype.getRobotID = function getRobotID() {
  return this.robotid;
};

siteInfo.prototype.setRobotID = function setRobotID(id) {
  this.robotid = id;
};
