const fs = require('fs');
const Jimp = require("jimp");
const PDF2Pic = require("pdf2pic");
const Tesseract = require("node-tesseract-ocr");

// https://ai-facets.org/tesseract-ocr-best-practices/
const tesseractConfig = {
  lang: "jpn",
  oem: 1,
  psm: 1
};

const main = async () => {
  const calendarTexts = await getCalendarTexts(
    "./resources/deluxe1.pdf",
    "./resources/"
  );
  console.log(calendarTexts);
  fs.writeFileSync('./resources/output.json', JSON.stringify(calendarTexts, null , "\t"));
};

const getCalendarTexts = async (pdfPath, resourcesDir) => {
  let calendarTexts = {};

  const pdf2pic = new PDF2Pic({
    density: 100, // output pixels per inch
    savename: "deluxe", // output file name
    savedir: resourcesDir, // output file location
    format: "png", // output file format
    size: "2338x3307" // output size in pixels
  });
  const pdfImageInfo = await pdf2pic.convert(pdfPath);

  const marginX = 100;
  const marginY = 276;
  const width = 428;
  const height = 346;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
      const jimp = await Jimp.read(resourcesDir + pdfImageInfo.name);
      await jimp.crop(width * j + marginX, height * i + marginY, width, height);

      const imagePath = resourcesDir + "/clips/" + (i * 5 + j) + ".jpg";
      await jimp.write(imagePath);
      const result = await Tesseract.recognize(imagePath, tesseractConfig);
      const date = result.match(/^\d+月\d+日/);
      if (date) {
        calendarTexts[date[0]] = result.replace(date[0] + '\n', '').replace(/\n\n/g, '\n').trim();
        console.log(date[0]);
        console.log(calendarTexts[date[0]] + '\n');
      }
    }
  }
  return calendarTexts;
};

main();
