const mammoth = require('mammoth');
const path = require('path');

const readDocxFile = (filePath) => {
  return new Promise((resolve, reject) => {
    mammoth.extractRawText({ path: filePath })
      .then(result => resolve(result.value))
      .catch(err => reject(err));
  });
};

module.exports = {
  readDocxFile
};
