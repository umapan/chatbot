var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'user',
  password : 'blocktrade001'
});

connection.query('SELECT 1', function(err, rows) {

if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
console.log('connected!');

});