const fs = require("fs");
const { parse } = require("csv-parse");
const axios = require('axios');
require('dotenv').config()

const googleApiKey = process.env.GOOGLE_API_KEY;
if (!googleApiKey) {
  console.log('Invalid API Key')
  process.exit(1)
}

const readFile = (path) => new Promise((resolve, reject) => {
  const dataReader = [];
  fs.createReadStream(path)
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", async function (row) {
      const isbn = getFixISBN(row[1]);
      dataReader.push({
        isbn: isbn,
        judulBuku: row[3],
      })
    })
    .on("end", function () {
      resolve(dataReader);
    })
    .on("error", function (error) {
      reject(error);
    });
});

async function main() {
  console.time('running fetch data');
  const resultReadCVS = await readFile("./Copy of ISO NON LAI FINAL (1) baru .xlsx - COMM, TEO, TAF, KAM, DLL.csv");
  console.log('total resultReadCVS: ', resultReadCVS.length)
  const resultFetchBooks = await fetchBooks(resultReadCVS)
  console.log('total resultFetchBooks', resultFetchBooks.length)
  await saveToJSONFile(resultFetchBooks, 'data.json');
  console.timeEnd('running fetch data');
}

main()

const getFixISBN = (isbn) => {
  let fixIsbn = isbn ? isbn : '';
  if (typeof (fixIsbn) !== 'string') {
    fixIsbn = ''
  }
  // remove -
  fixIsbn = fixIsbn.replace(/-/g, "");
  // remove space tabs
  fixIsbn = fixIsbn.replace(/ /g, "");

  return fixIsbn;
}

const fetchBooks = (data) => new Promise(async (resolve, reject) => {
  const resultData = []
  for (i = 0; i < data.length; i++) {
    if (data[i].isbn) {
      console.log(`find isbn: ${data[i].isbn}`)
      const res = await axios(`https://www.googleapis.com/books/v1/volumes?q=isbn:${data[i].isbn}`);
      if (res.status === 200) {
        resultData.push({
          ...data[i],
          data: res.data,
          status: 'success',
          message: '-'
        })
      } else {
        resultData.push({
          ...data[i],
          data: null,
          status: 'error',
          message: res.err.message
        })
      }
    }
  }
  resolve(resultData);
});

const saveToJSONFile = (data, filename) => new Promise(async (resolve, reject) => {
  fs.writeFile(filename, JSON.stringify({ data: data }), { overwrite: true }, function (err) {
    if (err) {
      console.log('error save file')
      console.log(err)
      resolve(false)
    }
    console.log('It\'s saved!');
    resolve(true)
  });

})
