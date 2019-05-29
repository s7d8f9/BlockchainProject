// 2_deploy_contracts.js
var Shop = artifacts.require("./Shop.sol");

module.exports = function(deployer) {
  deployer.deploy(Shop);
};
