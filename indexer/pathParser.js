const path = require('path');
//const a = "$([MSBuild]::GetDirectoryNameOfFileAbove('$(MSBuildThisFileDirectory)../', 'Intercom.sln'))\\ExpressV2\\project\\import.proj"
const b = "$(MSBuildExtensionsPath)\\$(MSBuildToolsVersion)\\Microsoft.Common.props"
const c = "$([MSBuild]::GetDirectoryNameOfFileAbove('$(MSBuildThisFileDirectory)../', 'Intercom.sln'))\\CommonTargets\\Intercom.shared.targets"

const func = {
  "[MSBuild]::GetDirectoryNameOfFileAbove": (...pathToken) => {
    console.log(pathToken);
    console.log('拼接pathtoken然后算出文件夹路径')
    return `Dir path of path.resolve(${pathToken})`;
  },
  "F": (...pathToken) => {
    console.log(pathToken);
    console.log('拼接pathtoken然后算出文件夹路径')
    return `Dir path of path.resolve(${pathToken})`;
  },
}

const findVariable = (name) => {
  return 'TOKEN/'
}

const getEnvironmentVariable = (name) => {
  let variable = ""
  switch (name) {
    case "MSBuildThisFileDirectory":
      variable = "project path directory";
      break;
    case "MSBuildExtensionsPath":
      variable = "MSBuildExtensionsPath";
      break;
    case "MSBuildToolsVersion":
      variable = "Microsoft.Common.props";
      break;
  }
  return variable;
}

const tokens = c.split('\\');
const token = tokens[0];
let constString = [];
let variableType = ""; // variable $() , function $(functionname()) , append ''
let operationName = [];
let operationType = [];
let name = '';
let isPair = true;
let isFunctionEnding = false;
//保存当前操作类型 遇到新的操作符时将当前的入栈，遇到)或'表示当前的操作结束需要出栈
for (let i = 0; i < token.length; i++) {
  const c = token[i]
  if (token[i] === '$' && token[i + 1] === '(') {
    if (variableType) {
      operationName.push(name);
      operationType.push(variableType);
      constString.push('#')
    }
    name = '';
    variableType = "variable";
    i++;
  } else if (token[i] === "'") {
    isPair = !isPair;
    if (!isPair) {// 第1个' 
      if (variableType) {
        operationName.push(name);
        operationType.push(variableType);
        constString.push('#')
      }
      name = '';
      variableType = 'append';
    } else { // 第2个' 开始计算拼接
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
  } else if (token[i] === '(') {
    if (variableType === 'variable') { //更新当前操作符
      variableType = "function";
    }
  } else if (token[i] === ')') {
    if (isFunctionEnding) {
      isFunctionEnding = false;
    } else if (variableType === 'function') { //当前为函数结束的)
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
    } else if (variableType === 'variable') {//当前为变量结束的符号)
      const can = findVariable(name);
      constString.push(can);
      name = operationName.pop();
      variableType = operationType.pop();
    }

  } else if (token[i] === "," || token[i] === " ") {

  } else {
    name += token[i];
  }
}

console.log(constString);