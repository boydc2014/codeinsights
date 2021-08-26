const { index } = require('./indexer')
const { FileProcesser } = require('./utils/fileUtil');

const rootDir = process.argv[2];
if (!rootDir) {
  throw Error('format: node index.js {absolute project path}');
}

const data = index(rootDir);
let gitHead = FileProcesser.readFileLines(`${rootDir}/.git/HEAD`)[0].split(' ')[1];
let hash = FileProcesser.readFileLines(`${rootDir}/.git/${gitHead.substring(0, gitHead.length - 1)}`)[0];
hash = hash.substring(0, hash.length - 1);
FileProcesser.mkDirSync(`./indexes/${hash}`)
FileProcesser.writeFileSync(`./indexes/${hash}/repo.json`, data);
console.log(`json data write to: ${__dirname}\\indexes\\${hash}\\repo.json`)