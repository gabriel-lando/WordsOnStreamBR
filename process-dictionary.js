const fs = require('fs');
const path = require('path');

/**
 * Process a Portuguese dictionary file according to specific rules:
 * 1. Read a .txt file where each line is a single word
 * 2. Ignore words with 3 or less characters
 * 3. Ignore words containing "-" character
 * 4. Convert words to lowercase
 * 5. Remove repeated words
 * 6. Print counter of remaining words
 * 7. Save the processed dictionary to a new file
 */
function processDictionary(inputFileName, outputFileName = 'processed-dictionary.txt') {
  try {
    // Step 1: Read the text file
    console.log(`Reading file: ${inputFileName}`);

    if (!fs.existsSync(inputFileName)) {
      console.error(`Error: File '${inputFileName}' not found!`);
      process.exit(1);
    }

    const fileContent = fs.readFileSync(inputFileName, 'utf-8');
    const allWords = fileContent.split(/\r?\n/);

    console.log(`Total words in file: ${allWords.length}`);

    // Step 2, 3, 4, 5: Process words (filter length, filter hyphens, lowercase, remove duplicates)
    const processedWords = new Set();

    allWords.forEach((line) => {
      const word = line.trim();

      // Step 2: Ignore words with 3 or less characters, or with "-"
      if (word.length <= 3 || word.includes('-')) {
        return;
      }

      // Step 3: Convert to lowercase
      const lowerCaseWord = word.toLowerCase();

      // Step 4: Add to Set (automatically removes duplicates)
      processedWords.add(lowerCaseWord);
    });

    // Convert Set back to Array and sort alphabetically
    const finalWordList = Array.from(processedWords).sort();

    // Step 5: Print counter of remaining words
    console.log(`Words after filtering (length > 3): ${finalWordList.length}`);
    console.log(`Duplicate words removed: ${allWords.filter((w) => w.trim().length > 3).length - finalWordList.length}`);

    // Step 6: Create and save the new dictionary file
    const outputContent = finalWordList.join('\n');
    fs.writeFileSync(outputFileName, outputContent, 'utf-8');

    console.log(`✅ Processed dictionary saved to: ${outputFileName}`);
    console.log(`📊 Final word count: ${finalWordList.length}`);

    // Optional: Show first 10 words as preview
    console.log('\n📝 Preview (first 10 words):');
    finalWordList.slice(0, 10).forEach((word, index) => {
      console.log(`${index + 1}. ${word}`);
    });

    if (finalWordList.length > 10) {
      console.log('...');
    }
  } catch (error) {
    console.error('Error processing dictionary:', error.message);
    process.exit(1);
  }
}

// Get input file from command line argument or use default
const inputFile = process.argv[2] || 'palavras.txt';
const outputFile = process.argv[3] || 'processed-dictionary.txt';

console.log('🔄 Starting dictionary processing...\n');
processDictionary(inputFile, outputFile);
