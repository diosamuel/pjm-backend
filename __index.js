var express = require('express');
var app = express();
// Routes
app.get('/api', function(req, res) {
res.send('Hello World, ini expressJS');
});
// Listen
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Listening on localhost:'+ port);