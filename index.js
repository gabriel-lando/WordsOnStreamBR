const fs = require('fs');
const util = require('util');
var readlineSync = require('readline-sync');

const fileName = 'dicionario-br.txt';

if (!fs.existsSync(fileName)) {
  console.log('File not found!');
  process.exit(1);
}

let wordsTable = new Map();

function charsInAlphaOrder(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('')
    .sort();
}

function getCharFrequency(charArray) {
  const freq = new Map();
  for (let char of charArray) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}

function canFormWord(sourceFreq, targetKey) {
  for (let i = 0; i < targetKey.length; i++) {
    const char = targetKey[i];
    let count = 1;
    while (i + 1 < targetKey.length && targetKey[i + 1] === char) {
      count++;
      i++;
    }
    if (!sourceFreq.has(char) || sourceFreq.get(char) < count) {
      return false;
    }
  }
  return true;
}

function matchesHiddenPattern(word, pattern) {
  if (word.length !== pattern.length) {
    return false;
  }

  const normalizedWord = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const normalizedPattern = pattern
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const knownChars = [];
  const hiddenCount = (normalizedPattern.match(/\+/g) || []).length;

  for (let i = 0; i < normalizedPattern.length; i++) {
    if (normalizedPattern[i] !== '+') {
      knownChars.push(normalizedPattern[i]);
    }
  }

  const wordChars = normalizedWord.split('');
  const knownCharsCopy = [...knownChars];

  for (let i = 0; i < knownCharsCopy.length; i++) {
    const charIndex = wordChars.indexOf(knownCharsCopy[i]);
    if (charIndex === -1) {
      return false;
    }
    wordChars.splice(charIndex, 1);
  }

  return wordChars.length === hiddenCount;
}

function hasHidden(str) {
  return str.includes('+');
}

function parseFalseLetters(input) {
  const falseCount = (input.match(/-/g) || []).length;
  const cleanInput = input.replace(/-/g, '');
  return { cleanInput, falseCount };
}

function canFormWithHidden(word, knownLetters, hiddenCount, maxLength) {
  if (word.length > maxLength) return false;

  const normalizedWord = word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('');

  const normalizedKnown = knownLetters
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split('');

  let hiddenUsed = 0;
  for (const char of normalizedWord) {
    const idx = normalizedKnown.indexOf(char);
    if (idx !== -1) {
      normalizedKnown.splice(idx, 1);
    } else {
      hiddenUsed++;
      if (hiddenUsed > hiddenCount) return false;
    }
  }

  return true;
}

console.log('Loading dictionary...');
const allFileContents = fs.readFileSync(fileName, 'utf-8');
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
console.log(`Dictionary loaded: ${wordsKeys.length} unique word patterns`);

while (true) {
  let rawWord = readlineSync.question("\n\nEnter a word ('+' for hidden, '-' for false): ");
  const { cleanInput: word, falseCount } = parseFalseLetters(rawWord);
  const maxWordLength = word.length - falseCount;

  let allWords = [];

  if (hasHidden(word)) {
    const hiddenCount = (word.match(/\+/g) || []).length;
    const knownLetters = word.replace(/\+/g, '');

    if (falseCount > 0) {
      for (let idx = 0; idx < wordsKeys.length; idx++) {
        const words = wordsTable.get(wordsKeys[idx]);
        for (let i = 0; i < words.length; i++) {
          if (canFormWithHidden(words[i], knownLetters, hiddenCount, maxWordLength)) {
            allWords.push(words[i]);
          }
        }
      }
    } else {
      // Original exact pattern matching
      for (let idx = 0; idx < wordsKeys.length; idx++) {
        const dictKey = wordsKeys[idx];
        const words = wordsTable.get(dictKey);
        for (let i = 0; i < words.length; i++) {
          if (matchesHiddenPattern(words[i], word)) {
            allWords.push(words[i]);
          }
        }
      }
    }
  } else {
    const newKey = charsInAlphaOrder(word);
    const sourceFreq = getCharFrequency(newKey);

    for (let idx = 0; idx < wordsKeys.length; idx++) {
      const dictKey = wordsKeys[idx];

      if (dictKey.length > newKey.length) {
        continue;
      }

      if (falseCount > 0 && dictKey.length > maxWordLength) {
        continue;
      }

      if (!canFormWord(sourceFreq, dictKey)) {
        continue;
      }

      const words = wordsTable.get(dictKey);
      for (let i = 0; i < words.length; i++) {
        allWords.push(words[i]);
      }
    }
  }

  allWords.sort((a, b) => a.length - b.length);

  const result = [];
  let currentLength = -1;
  let currentGroup = [];

  for (let i = 0; i < allWords.length; i++) {
    if (allWords[i].length !== currentLength) {
      if (currentGroup.length > 0) {
        result.push(currentGroup);
      }
      currentLength = allWords[i].length;
      currentGroup = [allWords[i]];
    } else {
      currentGroup.push(allWords[i]);
    }
  }
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  console.clear();
  console.log('Word: ' + rawWord.toUpperCase());
  if (falseCount > 0) {
    console.log(`False letters: ${falseCount} | Max word length: ${maxWordLength}`);
  }
  console.log(`Found ${allWords.length} word(s)`);

  result.forEach((element) => {
    console.log('\nWord size: ' + element[0].length);
    console.log(util.inspect(element, { colors: true, maxArrayLength: null }));
  });
}
