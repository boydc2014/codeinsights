const { path } = require('../utils/pathUtil');
const { FileProcesser } = require('../utils/fileUtil');

const func = {
  "[MSBuild]::GetDirectoryNameOfFileAbove": (thePath, theFile) => {
    if (FileProcesser.statSync(thePath).isFile()) {
      thePath = path.dirname(thePath);
    }
    let prePath = '';
    let files = [];
    let realPath = ''
    while (prePath !== thePath) {
      files = FileProcesser.readdirSync(thePath);
      const index = files.findIndex((f) => f.endsWith(theFile));
      if (index > -1) {
        realPath = thePath;
        break;
      }
      prePath = thePath;
      thePath = path.dirname(thePath);
    }
    if (!realPath) {
      return 'failed to find the directory of the target file';
    }
    return realPath;
  },
}

//collect variable key words here for replacing
const getEnvironmentVariable = (name, currentFilePath) => {
  let variable = ""
  switch (name) {
    case "MSBuildThisFileDirectory":
      variable = path.dirname(currentFilePath);
      if (!variable.endsWith('/')) {
        variable += '/';
      }
      break;
    case "MSBuildToolsVersion":
      variable = "$(MSBuildToolsVersion)";
      break;
    case "MSBuildExtensionsPath":
      variable = "$(MSBuildExtensionsPath)";
      break;
    case "USERPROFILE":
      variable = process.env.HOME || process.env.USERPROFILE;
      break;
    default:
      variable = `$(${name})`; //add $() to show that it is still a variable
  }
  return variable;
}

const parse = (rawPath, currentFilePath) => {
  const tokens = rawPath.split('\\');

  let constString = [];
  let variableType = ""; // variable $() , function $(functionname()) , append ''
  let operationName = [];
  let operationType = [];
  let name = '';
  let isPair = true;
  let isFunctionEnding = false; 0
  //keep current operation type, 
  //when meeting a new operation, push the current one into stack
  //when meeting ) or ', pop operation out of stack
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.startsWith('$')) {
      constString.push(token);
      continue;
    }
    for (let j = 0; j < token.length; j++) {
      const c = token[j]
      if (token[j] === '$' && token[j + 1] === '(') {
        if (variableType) {
          operationName.push(name);
          operationType.push(variableType);
          constString.push('#')
        }
        name = '';
        variableType = "variable";
        j++;
      } else if (token[j] === "'") {
        isPair = !isPair;
        if (!isPair) {// process the first ' 
          if (variableType) {
            operationName.push(name);
            operationType.push(variableType);
            constString.push('#')
          }
          name = '';
          variableType = 'append';
        } else { // process the second ', start appending
          let p = '';
          while (true) {
            const c = constString.pop();
            if (c === '#') {
              break;
            } else {
              p += c;
            }
          }
          p += name;
          constString.push(p);
          name = operationName.pop();
          variableType = operationType.pop();
        }
      } else if (token[j] === '(') {
        if (variableType === 'variable') { // update current opertaion type
          variableType = "function";
        }
      } else if (token[j] === ')') {
        if (isFunctionEnding) {
          isFunctionEnding = false;
        } else if (variableType === 'function') { // this ) is the end of a function
          const arguments = [];
          while (true) {
            const c = constString.pop();
            if (c === '#') {
              break;
            } else {
              arguments.unshift(c);
            }
          }
          const p = func[name](...arguments);
          constString.push(p);
          isFunctionEnding = true;
        } else if (variableType === 'variable') {// this ) is the end of a variable
          const can = getEnvironmentVariable(name, currentFilePath);
          constString.push(can);
          name = operationName.pop();
          variableType = operationType.pop();
        }

      } else if (token[j] === "," || token[j] === " ") {
        continue;
      } else {
        name += token[j];
      }
    }
  }

  const realPath = constString.join('/').replace(/\/\//g, '/');

  return realPath;
}

module.exports = {
  parse,
}