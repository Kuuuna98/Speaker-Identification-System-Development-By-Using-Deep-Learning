
const express = require('express')
const app = express()
const port = 3000;
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
var fs = require('fs');
var mysql = require("mysql");
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var JSZip = require('jszip');

mysqlConfig = {
    host: "168.188.126.212",
    port: 3306,
    user: "root",
    password: "kjn",
    database: "main",
    multipleStatements: true
};

app.use(bodyParser.json({ limit: '1000mb'}));
app.use(fileUpload());
app.use(express.json())

app.post('/upload/:id', function(req,res,next){
	
	var obj = req.body;
	var fileName = obj.fileName+".zip";
	var str = obj.file;
	console.log(obj);
	
	if(str == null) return res.status(500).json({ result: "ERROR"});
	
	fs.writeFile(__dirname+"/zipfiles/"+fileName, str, {encoding:'base64'}, function(err){
		if(err) {
			console.error(err);
			return res.status(500).json({ result : "ERROR", err : err});
		}
		console.log("File Created");
		
		var t = new Date().getTime();
		console.log("Time : "+t);

    		var label_num;
		var c = mysql.createConnection(mysqlConfig);
        
        	c.query("SELECT label_num FROM zipfiles ORDER BY label_num DESC LIMIT 1",
			function(mysqlerr, row){
				c.end();
				if(mysqlerr){
					console.error(mysqlerr);
					return res.status(500).json({ result: "ERROR", err: mysqlerr});
            			}
            
            			label_num = row[0];
            			label_num *= 1;
			});
        
        	c.query("INSERT INTO zipfiles (key, userName, path, label_num) VALUES ( ?, ?, ?, ?)",
			[obj.fileName, obj.userName, __dirname+"/zipfiles/"+fileName, label_num],
			function(mysqlerr, mysqlres){
				c.end();
				if(mysqlerr){
					console.error(mysqlerr);
					return res.status(500).json({ result: "ERROR", err: mysqlerr});
				}
				io.emit('message', JSON.stringify( [ obj.fileName, 
				JSON.stringify({ headers:req.headers, body: req.body})]));
				return res.json({ result : "OK"});
		});

	});
	
});

app.get('/', (req, res) => {
  console.log('web server sending');
  res.sendFile(__dirname+'/index.html');
  
})
io.sockets.on('connection', function(socket){
 console.log('user Connected');
});
server.listen(port);
/*app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})*/
