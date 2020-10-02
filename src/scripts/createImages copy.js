const fs = require("fs");
const path = require("path");
const recursive = require("recursive-readdir");
const sharp = require("sharp");
const syncRequest = require("sync-request");

const convertImages = function (basePath, store) {
  const storePath = path.resolve(basePath, store);
  const inputPath = path.resolve(storePath, "imagenes-productos");
  const outputPath = path.resolve(storePath, "images", "products");

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  recursive(inputPath, [], function (err, files) {
    const processedFiles = [];

    if (files) {
      for (const file of files) {
        const inputFilename = path.basename(file, path.extname(file));
        const filename = encodeURIComponent(inputFilename);

        const outputFilename = `${inputFilename}.jpeg`;
        const encodedFilename = `${filename}.jpeg`;

        if (checkFileExistsInBucket(store, encodedFilename)) {
          processedFiles.push(filename);
          continue;
        }

        const outputFilePath = path.resolve(outputPath, outputFilename);
        const data = fs.readFileSync(file);
        sharp(data)
          .flatten({ background: "white" })
          //.resize(300, 300, { fit: "contain", background: "white" })
          .jpeg()
          .toFile(outputFilePath);

        processedFiles.push(filename);
        console.log(`Created file: ${outputFilePath}`);
      }
    }

    const filesJsonPath = path.resolve(storePath, "images.json");
    fs.writeFileSync(filesJsonPath, JSON.stringify(processedFiles, null, 2));
  });
};

const checkFileExistsInBucket = function (store, fileName) {
  const url = `https://pedidos.fooddy.io/data/${store}/images/products/${fileName}`;
  console.log(`Checking image in bucket: ${url}`);
  try {
    var res = syncRequest("HEAD", url);
    return res.statusCode === 200;
  } catch {
    return false;
  }
};

const buildData = function () {
  const basePath = "./src/data";

  fs.readdirSync(basePath, { withFileTypes: true })
    .filter((node) => node.isDirectory())
    .map((store) => convertImages(basePath, store.name));
};

buildData();
