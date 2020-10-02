const fs = require("fs");
const path = require("path");
const xlsx = require("node-xlsx");
const csvToJson = require("convert-csv-to-json");

csvToJson.fieldDelimiter("|");

const processProducts = function (basePath, store) {
  const storePath = path.resolve(basePath, store);
  const xlsxPath = path.resolve(storePath, "download.xlsx");
  const csvPath = path.resolve(storePath, "products.csv");
  const jsonPath = path.resolve(storePath, "products.json");
  const categoriesPath = path.resolve(storePath, "product-categories.json");

  if (!fs.existsSync(xlsxPath)) {
    return;
  }

  const textContent = readProductsSheetAsCsv(xlsxPath);
  fs.writeFile(csvPath, textContent, () => {
    console.log(`Created file: ${csvPath}`);

    const { products, categories } = extractProductsAndCategories(
      csvPath,
      storePath
    );

    const productsData = JSON.stringify(products, null, 2);
    fs.writeFileSync(jsonPath, productsData);
    console.log(`Created file: ${jsonPath}`);

    const categoriesData = JSON.stringify(categories, null, 2);
    fs.writeFileSync(categoriesPath, categoriesData);
    console.log(`Created file: ${categoriesPath}`);
  });
};

const getImagePath = function (images, productId, storePath) {
  if (!productId) {
    return null;
  }

  const encodedProductId = encodeURIComponent(productId.trim());
  if (images.indexOf(encodedProductId) > -1) {
    const imagePath = path.resolve(
      storePath,
      "images",
      "products",
      `${encodedProductId}.jpeg`
    );
    return path.relative(storePath, imagePath);
  }

  return null;
};

const extractProductsAndCategories = function (inputFile, storePath) {
  const productsInput = csvToJson.getJsonFromCsv(inputFile);

  const imagesPath = path.resolve(storePath, "images.json");
  const images = JSON.parse(fs.readFileSync(imagesPath));

  const products = [];
  const categories = [];

  for (let index = 0; index < productsInput.length && index < 10500; index++) {
    const product = productsInput[index];

    const productIndex = products.findIndex(
      (p) => p.id == product.id || p.description == product.description
    );

    if (productIndex < 0 && product.price) {
      const id = product.id ? product.id.trim() : `${index + 1}`;

      products.push({
        id,
        name: product.name ? product.name.trim() : product.description.trim(),
        description: product.name
          ? product.name.trim()
          : product.description.trim(),
        detail: product.detail && product.detail.trim(),
        price: Number(product.price),
        category: product.category && product.category.trim(),
        image: getImagePath(images, id, storePath),
      });

      if (product.category && categories.indexOf(product.category.trim()) < 0) {
        categories.push(product.category.trim());
      }
    }
  }

  return { products, categories };
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
  const basePath = "./src/data";

  fs.readdirSync(basePath, { withFileTypes: true })
    .filter((node) => node.isDirectory())
    .map((store) => processProducts(basePath, store.name));
};

buildData();
