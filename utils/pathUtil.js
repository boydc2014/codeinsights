const path = require('path');

class PathHandler {
  resolve(...params) {
    const pathToTransform = path.join(...params);
    if (path.isAbsolute(pathToTransform)) {
      return pathToTransform.replace(/\\/g, '/');
    } else {
      return path.resolve(...params).replace(/\\/g, '/');
    }
  }
  relative(from, to) {
    return path.relative(from, to).replace(/\\/g, '/');
  }
  basename(param, ext) {
    return path.basename(param, ext).replace(/\\/g, '/');
  }
  dirname(param) {
    return path.dirname(param).replace(/\\/g, '/');
  }
  extname(param) {
    return path.extname(param).replace(/\\/g, '/');
  }
  join(...params) {
    return path.join(...params).replace(/\\/g, '/');
  }
  isAbsolute(param) {
    return path.isAbsolute(param);
  }

  normalize(param) {
    return path.normalize(param).replace(/\\/g, '/');
  }

  unify(fullPath) {
    return this.dirname(fullPath).toLowerCase() + "/" + this.basename(fullPath);
  }
}

module.exports = {
  path: new PathHandler(),
}