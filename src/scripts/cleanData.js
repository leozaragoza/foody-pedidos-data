const rimraf = require("rimraf");

const cleanData = function () {
  const basePath = "./src/output/";
  rimraf.sync(basePath);
};

cleanData();
