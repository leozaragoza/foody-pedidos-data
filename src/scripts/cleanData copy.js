const fs = require("fs");
const path = require("path");

const cleanStore = function (basePath, store) {
  console.log(`========== Started cleaning store: ${store} ==========`);

  const storePath = path.resolve(basePath, store);
  const imagesPath = path.resolve(storePath, "images", "products");
  const configPath = path.resolve(storePath, "config.json");
  const productsCsvPath = path.resolve(storePath, "products.csv");
  const productsJsonPath = path.resolve(storePath, "products.json");
  const imagesJsonPath = path.resolve(storePath, "images.json");
  const categoriesJsonPath = path.resolve(storePath, "product-categories.json");

  if (fs.existsSync(imagesPath)) fs.rmdirSync(imagesPath, { recursive: true });
  if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
  if (fs.existsSync(productsCsvPath)) fs.unlinkSync(productsCsvPath);
  if (fs.existsSync(productsJsonPath)) fs.unlinkSync(productsJsonPath);
  if (fs.existsSync(imagesJsonPath)) fs.unlinkSync(imagesJsonPath);
  if (fs.existsSync(categoriesJsonPath)) fs.unlinkSync(categoriesJsonPath);

  console.log(`========== Finished cleaning store: ${store} ==========`);
};

const cleanData = function () {
  const basePath = "./src/data";
  fs.readdirSync(basePath, { withFileTypes: true })
    .filter((node) => node.isDirectory())
    .map((directory) => cleanStore(basePath, directory.name));

  const directoryPath = path.resolve(basePath, "directory.json");
  const storesCsvPath = path.resolve(basePath, "stores.csv");

  if (fs.existsSync(directoryPath)) fs.unlinkSync(directoryPath);
  if (fs.existsSync(storesCsvPath)) fs.unlinkSync(storesCsvPath);
};

cleanData();
