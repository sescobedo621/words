var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('databases/words.sqlite');
db.run("PRAGMA case_sensitive_lie = true");
router.get('/', function(req, res, next){
	var count = 0;
	db.get("SELECT COUNT(*) AS tot FROM WORDS", function(err, row){
		var respText = "Words API: " + row.tot + " words online.";
		res.send(respText);
	});
});
router.get('/count/:abbrev', function(req, res, next){
	 
	// var data = {};
	// var sql = "SELECT COUNT(*) AS wordcount FROM words WHERE word LIKE '" + abbrev +"%'";
	// db.get(sql, function(err, row){
	// 	data.abbrev = abbrev
	// 	data.count = row.wordcount;
	// 	res.send(data);
	// });
	var abbrev = req.params.abbrev;
	var alen = abbrev.length;
	var dataArray = [];
	var sql = "SELECT substr(word,1," + alen + "+1) AS abbr, "+" count(*) AS wordcount FROM words " +" WHERE word LIKE '" + abbrev + "%'"+" GROUP BY substr(word,1," + alen + "+1)"
	db.all(sql, function(err,rows){
		for (var i=0;i<rows.length;i++) {
			dataArray[i] = { abbrev: rows[i].abbr, count: rows[i].wordcount } 
		}
		res.send(dataArray); //Express will stringify data, set Content-type 
	});
});
router.get('/search/:abbrev', function(req, res, next){
	var abbrev = req.params.abbrev;
	var threshold = req.query.threshold;
	if(threshold && abbrev.length <Number(threshold)){
		res.status(204).send();
		return;
	}
	console.log(abbrev);
	var query = ("SELECT id, word FROM words WHERE word LIKE '" + abbrev + "%' ORDER BY word ");
	db.all(query, function(err,data){
		if(err){
			res.status(500).send("Database Error");
		}
		else{
			res.status(200).json(data);
		}
	});
});


module.exports = router;