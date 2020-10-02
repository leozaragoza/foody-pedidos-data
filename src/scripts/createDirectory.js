const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");
const xlsx = require("node-xlsx");
const csvToJson = require("convert-csv-to-json");

csvToJson.fieldDelimiter("|");

const readStoresSheetAsCsv = function (storesXlsxPath) {
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

const extractStoreConfigurations = function (storesCsvPath) {
  const storesInput = csvToJson.getJsonFromCsv(storesCsvPath);

  const directory = [];
  for (const store of storesInput) {
    if (!store.url || store.showInDirectory !== "true") {
      continue;
    }

    const config = {
      slug: store.url.trim(),
      name: store.businessName.trim(),
      category: store.businessActivity.trim(),
      description: store.businessDescription.trim(),
      address: store.address.trim(),
      city: `${store.city.trim()}`,
      province: `${store.province.trim()}`,
      whatsappNumber: `+54${store.phone.trim()}`,
    };

    directory.push(config);
  }

  return directory;
};

const buildData = function () {
  const baseInputPath = "./src/data";
  const baseOutputPath = "./src/output";
  const storesXlsxPath = path.resolve(baseInputPath, "stores.xlsx");
  const directoryPath = path.resolve(baseOutputPath, "d");
  const storesPath = path.resolve(baseOutputPath, "s");
  const storesCsvPath = path.resolve(directoryPath, "stores.csv");

  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  const textContent = readStoresSheetAsCsv(storesXlsxPath);

  fs.writeFile(storesCsvPath, textContent, () => {
    console.log(`Created file: ${storesCsvPath}`);

    const directory = extractStoreConfigurations(storesCsvPath);

    console.log(directory);

    for (const store of directory) {
      const storePath = path.resolve(storesPath, store.slug);
      if (!fs.existsSync(storePath)) {
        fs.mkdirSync(storePath, { recursive: true });
      }

      const configPath = path.resolve(storePath, "config.json");
      fs.writeFileSync(configPath, JSON.stringify(store, null, 2));
      console.log(`Created file: ${configPath}`);

      const storeDirectoryPath = path.resolve(directoryPath, store.slug);
      if (!fs.existsSync(storeDirectoryPath)) {
        fs.mkdirSync(storeDirectoryPath, { recursive: true });
      }

      const configDirectoryPath = path.resolve(
        storeDirectoryPath,
        "config.json"
      );
      fs.writeFileSync(configDirectoryPath, JSON.stringify(store, null, 2));
      console.log(`Created file: ${configDirectoryPath}`);
    }

    const directoryFilePath = path.resolve(directoryPath, "directory.json");
    fs.writeFileSync(directoryFilePath, JSON.stringify(directory, null, 2));
    console.log(`Created file: ${directoryFilePath}`);
  });
};

buildData();
