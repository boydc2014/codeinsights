const express = require('express');
const serveIndex = require('serve-index')
const app = express();
const port = 3000;
app.use(express.static('public'), serveIndex('public', {'icons': true}));

  
app.listen(port, () => {
    console.log(`Data visualize app listening at http://localhost:${port}`)
})