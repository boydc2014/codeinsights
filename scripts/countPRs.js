const execSync = require('child_process').execSync;

if (!process.argv[2]) {
  throw Error('Usage: node index.js <absolute path to source repo> <from date> <to date> date format: 2021-10-09');
}

const formatDate = (date) => {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2)
    month = '0' + month;
  if (day.length < 2)
    day = '0' + day;

  return [year, month, day].join('-');
}

const projectPath = process.argv[2];
const fromDate = process.argv[3] ? process.argv[3] : formatDate(new Date());;
const toDate = process.argv[4] ? process.argv[4] : formatDate(new Date());


getRecentAuthor = (fromDate, toDate) => {
  console.log(`Pr count from ${fromDate} to ${toDate}`);
  let authors = execSync(`cd ${projectPath} && git log --since=${fromDate} --until=${toDate} --pretty=format:"%an%x09" .`).toString().trim();
  authors = authors.split('\t\n')
  return authors;
}

const authors = getRecentAuthor(fromDate, toDate);

const member = {
  'Jiaxu Wu': 0,
  'Lu Han': 0,
  'Alan Long': 0,
  'Ze Ye': 0,

  'Dong Lei': 0,
  'Leilei Zhang': 0,
  'Hongyang Du': 0,
  'Weitian Li': 0,
  'Zhixiang Zhan': 0,
  'Shuai Wang': 0,

  'Jing-Kane Li': 0,
  'Hualiang Xie': 0,
  'Yue Sun': 0,
  'Qiong Wu': 0,
  'Tianyu You': 0,
  'Shiyi Zheng': 0,
  'Zhipeng Wang': 0,
}

const total = authors.length;
let ourPr = 0;
for (let i = 0; i < total; i++) {
  if (member[authors[i]] != undefined) {
    member[authors[i]]++;
    ourPr++;
  }
}

console.log(`total: ${total}, our team: ${ourPr}`);
