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

// Pre-compute character frequencies for faster matching
function getCharFrequency(charArray) {
  const freq = new Map();
  for (let char of charArray) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }
  return freq;
}

// Check if source has enough characters to form target
function canFormWord(sourceFreq, targetKey) {
  for (let i = 0; i < targetKey.length; i++) {
    const char = targetKey[i];
    // Count occurrences in target
    let count = 1;
    while (i + 1 < targetKey.length && targetKey[i + 1] === char) {
      count++;
      i++;
    }
    // Check if source has enough of this character
    if (!sourceFreq.has(char) || sourceFreq.get(char) < count) {
      return false;
    }
  }
  return true;
}

// Check if a word matches the pattern with wildcards
function matchesWildcardPattern(word, pattern) {
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

  // Get known characters (non-wildcard) from pattern
  const knownChars = [];
  const wildcardCount = (normalizedPattern.match(/\*/g) || []).length;

  for (let i = 0; i < normalizedPattern.length; i++) {
    if (normalizedPattern[i] !== '*') {
      knownChars.push(normalizedPattern[i]);
    }
  }

  // Check if word has all the required known characters
  const wordChars = normalizedWord.split('');
  const knownCharsCopy = [...knownChars];

  // Remove known characters from word chars
  for (let i = 0; i < knownCharsCopy.length; i++) {
    const charIndex = wordChars.indexOf(knownCharsCopy[i]);
    if (charIndex === -1) {
      return false; // Required character not found
    }
    wordChars.splice(charIndex, 1); // Remove the found character
  }

  // Remaining characters should equal the number of wildcards
  return wordChars.length === wildcardCount;
}

// Check if input has wildcards and needs pattern matching
function hasWildcards(str) {
  return str.includes('*');
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
  let word = readlineSync.question('\n\nEnter a word (use * for wildcards): ');

  let allWords = [];

  if (hasWildcards(word)) {
    // Wildcard matching: search through all words in dictionary
    for (let idx = 0; idx < wordsKeys.length; idx++) {
      const dictKey = wordsKeys[idx];
      const words = wordsTable.get(dictKey);

      for (let i = 0; i < words.length; i++) {
        if (matchesWildcardPattern(words[i], word)) {
          allWords.push(words[i]);
        }
      }
    }
  } else {
    // Original anagram logic
    const newKey = charsInAlphaOrder(word);
    const sourceFreq = getCharFrequency(newKey);

    // Optimized search with early rejection
    for (let idx = 0; idx < wordsKeys.length; idx++) {
      const dictKey = wordsKeys[idx];

      // Early rejection: if dictionary word is longer than input, skip
      if (dictKey.length > newKey.length) {
        continue;
      }

      // Fast character frequency check
      if (!canFormWord(sourceFreq, dictKey)) {
        continue;
      }

      // If passed frequency check, add all words with this pattern
      const words = wordsTable.get(dictKey);
      for (let i = 0; i < words.length; i++) {
        allWords.push(words[i]);
      }
    }
  }

  // Sort by length (ascending)
  allWords.sort((a, b) => a.length - b.length);

  // Group by length
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
  console.log('Word: ' + word.toUpperCase());
  console.log(`Found ${allWords.length} word(s)`);

  result.forEach((element) => {
    console.log('\nWord size: ' + element[0].length);
    console.log(util.inspect(element, { colors: true, maxArrayLength: null }));
  });
}
