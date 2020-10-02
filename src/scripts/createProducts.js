const fs = require("fs");
const path = require("path");
const xlsx = require("node-xlsx");
const csvToJson = require("convert-csv-to-json");

csvToJson.fieldDelimiter("|");

const processProducts = function (baseInputPath, store, baseOutputPath) {
  const storeInputPath = path.resolve(baseInputPath, store);
  const storeOutputPath = path.resolve(baseOutputPath, "s", store);
  const xlsxPath = path.resolve(storeInputPath, "download.xlsx");
  const csvPath = path.resolve(storeOutputPath, "products.csv");
  const jsonPath = path.resolve(storeOutputPath, "products.json");
  const imagesJsonPath = path.resolve(storeOutputPath, "i", "l", "images.json");

  if (!fs.existsSync(xlsxPath)) {
    return;
  }

  const textContent = readProductsSheetAsCsv(xlsxPath);
  fs.writeFile(csvPath, textContent, () => {
    console.log(`Created file: ${csvPath}`);

    const data = extractProductsAndCategories(
      csvPath,
      imagesJsonPath,
      store,
      baseOutputPath
    );

    const productsData = JSON.stringify(data, null, 2);
    fs.writeFileSync(jsonPath, productsData);
    console.log(`Created file: ${jsonPath}`);
  });
};

const getImagePath = function (images, productId, store, baseOutputPath) {
  if (!productId) {
    return null;
  }

  const encodedProductId = encodeURIComponent(productId.trim());
  if (images.indexOf(encodedProductId) > -1) {
    const imagePath = path.resolve(
      baseOutputPath,
      "s",
      store,
      "i",
      "l",
      `${encodedProductId}.jpeg`
    );
    return path.relative(baseOutputPath, imagePath);
  }

  return null;
};

const extractProductsAndCategories = function (
  inputFile,
  imagesJsonPath,
  store,
  baseOutputPath
) {
  const productsInput = csvToJson.getJsonFromCsv(inputFile);

  const images = JSON.parse(fs.readFileSync(imagesJsonPath));

  const products = [];
  const categories = [];

  for (let index = 0; index < productsInput.length && index < 10500; index++) {
    const product = productsInput[index];

    const productIndex = products.findIndex((p) => p.id == product.id);

    if (productIndex < 0 && product.price) {
      const id = product.id ? product.id.trim() : `${index + 1}`;

      products.push({
        id,
        name: product.name.trim(),
        detail: product.detail && product.detail.trim(),
        price: Number(product.price),
        category: product.category && product.category.trim(),
        image: getImagePath(images, id, store, baseOutputPath),
      });

      if (product.category && categories.indexOf(product.category.trim()) < 0) {
        categories.push(product.category.trim());
      }
    }
  }

  return { categories, products };
};

const readProductsSheetAsCsv = function (inputFile) {
  const spreadsheet = xlsx.parse(inputFile);
  let writeStr = "id|name|category|detail|price\n";

  const sheet = spreadsheet[0]; // can loop through spreadsheet.length for other sheets
  for (let l = 1; l < sheet["data"].length; l++) {
    const line = sheet["data"][l];
    if (line.length) {
      writeStr += line.join("|").split("\n").join("&nbsp;") + "\n";
    }
  }

  return writeStr;
};

const buildData = function () {
  const baseInputPath = "./src/data";
  const baseOutputPath = "./src/output";

  fs.readdirSync(baseInputPath, { withFileTypes: true })
    .filter((node) => node.isDirectory())
    .map((store) => processProducts(baseInputPath, store.name, baseOutputPath));
};

buildData();
