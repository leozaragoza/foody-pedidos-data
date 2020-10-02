const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");
const xlsx = require("node-xlsx");
const csvToJson = require("convert-csv-to-json");

csvToJson.fieldDelimiter("|");

const readStoresSheetAsCsv = function (basePath) {
  const storesXlsxPath = path.resolve(basePath, "stores.xlsx");
  const spreadsheet = xlsx.parse(storesXlsxPath);
  let writeStr =
    "date|email|ownerName|ownerSurname|country|province|city|address|phone|businessName|businessActivity|businessDescription|minimumShop|deliveryEnabled|deliveryArea|businessName2|url|showInDirectory\n";

  const formSheet = spreadsheet[0]; // can loop through spreadsheet.length for other sheets
  const extraData = spreadsheet[1];
  for (let l = 1; l < formSheet["data"].length; l++) {
    const line = formSheet["data"][l];
    if (line.length) {
      writeStr +=
        formSheet["data"][l].join("|") +
        "|" +
        extraData["data"][l].join("|") +
        "\n";
    }
  }

  return writeStr;
};

const extractStoreConfigurations = function (basePath, storesCsvPath) {
  const storesInput = csvToJson.getJsonFromCsv(storesCsvPath);

  const recentlyAddedBase = new Date();
  recentlyAddedBase.setDate(recentlyAddedBase.getDate() - 30);

  const directory = [];
  for (const store of storesInput) {
    if (!store.url) {
      continue;
    }

    const storePath = path.resolve(basePath, store.url);

    const categoriesPath = path.resolve(storePath, "product-categories.json");
    let categories = [];
    if (fs.existsSync(categoriesPath)) {
      categories = JSON.parse(fs.readFileSync(categoriesPath));
    }

    const productsPath = path.resolve(storePath, "products.json");
    let hasProducts = fs.existsSync(productsPath);

    const config = {
      name: store.businessName.trim(),
      slug: store.url.trim(),
      category: store.businessActivity.trim(),
      description: store.businessDescription.trim(),
      address: store.address.trim(),
      city: `${store.city.trim()}`,
      province: `${store.province.trim()}`,
      cityProvince: `${store.city.trim()}, ${store.province.trim()}`,
      whatsappNumber: `+54${store.phone.trim()}`,
      showInDirectory: store.showInDirectory === "true",
      deliveryInfo: {
        minAmount: Number(`${store.minimumShop.trim()}`),
      },
      labels: {
        recentlyAdded: ExcelDateToJSDate(store.date) > recentlyAddedBase,
        loadedProducts: hasProducts,
      },
      categories,
    };

    if (config.showInDirectory) {
      directory.push(config);
    }
  }
  return directory;
};

const processDirectory = function (basePath) {
  const textContent = readStoresSheetAsCsv(basePath);
  const storesCsvPath = path.resolve(basePath, "stores.csv");

  fs.writeFile(storesCsvPath, textContent, () => {
    console.log(`Created file: ${storesCsvPath}`);

    const directory = extractStoreConfigurations(basePath, storesCsvPath);

    for (const store of directory) {
      const storePath = path.resolve(basePath, store.slug);
      if (!fs.existsSync(storePath)) {
        fs.mkdirSync(storePath, { recursive: true });
      }

      const configPath = path.resolve(storePath, "config.json");
      fs.writeFileSync(configPath, JSON.stringify(store, null, 2));
      console.log(`Created file: ${configPath}`);
    }

    const directoryPath = path.resolve(basePath, "directory.json");
    fs.writeFileSync(directoryPath, JSON.stringify(directory, null, 2));
    console.log(`Created file: ${directoryPath}`);
  });
};

function ExcelDateToJSDate(serial) {
  var utc_days = Math.floor(serial - 25569);
  var utc_value = utc_days * 86400;
  var date_info = new Date(utc_value * 1000);

  var fractional_day = serial - Math.floor(serial) + 0.0000001;

  var total_seconds = Math.floor(86400 * fractional_day);

  var seconds = total_seconds % 60;

  total_seconds -= seconds;

  var hours = Math.floor(total_seconds / (60 * 60));
  var minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(
    date_info.getFullYear(),
    date_info.getMonth(),
    date_info.getDate(),
    hours,
    minutes,
    seconds
  );
}

const buildData = function () {
  const basePath = "./src/data";
  processDirectory(basePath);
};

buildData();
