const fs = require("fs");
const util = require("util");
var readlineSync = require("readline-sync");

let wordsTable = new Map();

function charsInAlphaOrder(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .split("")
    .sort();
}

const allFileContents = fs.readFileSync("br-utf8.txt", "utf-8");
allFileContents.split(/\r?\n/).forEach((line) => {
  const word = line.trim();

  if (word.length < 4) return;

  const key = charsInAlphaOrder(word);
  if (!wordsTable.has(key)) {
    wordsTable.set(key, [word]);
  } else {
    wordsTable.get(key).push(word);
  }
});

let wordsKeys = Array.from(wordsTable.keys());

while (true) {
  let word = readlineSync.question("Enter a word: ");
  const newKey = charsInAlphaOrder(word);

  let allWords = [];

  for (let idx = 0; idx < wordsKeys.length; idx++) {
    dictKey = wordsKeys[idx];
    let idx1 = 0;
    let idx2 = 0;

    let found = false;
    while (true) {
      if (idx2 == dictKey.length) {
        found = true;
        break;
      }

      if (idx1 == newKey.length) {
        break;
      }

      if (newKey[idx1] == dictKey[idx2]) {
        idx1++;
        idx2++;
      } else if (newKey[idx1] < dictKey[idx2]) {
        idx1++;
      } else {
        found = false;
        break;
      }
    }

    if (found) {
      allWords = allWords.concat(wordsTable.get(dictKey));
    }
  }

  allWords.sort(function (a, b) {
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    return b.length - a.length;
  });

  var result = Object.values(
    allWords.reduce((a, curr) => {
      (a[curr.length] = a[curr.length] || []).push(curr);
      return a;
    }, {})
  );

  process.stdout.write("\033c");
  console.log("Word: " + word.toUpperCase() + "\n");

  result.forEach((element) => {
    console.log("Word size: " + element[0].length);
    console.log(util.inspect(element, { colors: true, maxArrayLength: null }));
  });
}
