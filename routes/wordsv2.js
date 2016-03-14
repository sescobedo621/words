var express = require('express');
var router = express.Router();
var sqlite3 = require('sqlite3');
var db = new sqlite3.Database('databases/words.sqlite');
var Twitter = require("twitter");
var credentials = require("../.credentials.js");
var twitParams = credentials.twitParams;
var twitClient = new Twitter(credentials.twitCredentials);

var bodyParser = require("body-parser");
router.use(bodyParser.json());	
db.run("PRAGMA case_sensitive_like = true");
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
	var caseSensitive = req.query.caseSensitive;
	var alen = abbrev.length;
	var dataArray = [];
	var likeQuery = "WHERE LOWER(word) LIKE LOWER('"+abbrev+"%')";
	if(caseSensitive === "true"){
		likeQuery = "WHERE word LIKE '"+abbrev + "%'";
	}
	var sql = "SELECT substr(word,1," + alen + "+1) AS abbr, "+" count(*) AS wordcount FROM words " +likeQuery+" GROUP BY substr(word,1," + alen + "+1)"
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
	var caseSensitive = req.query.caseSensitive;
	if(threshold && abbrev.length < Number(threshold)){
		res.status(204).send();
		return;
	}
	var likeQuery = "WHERE LOWER(word) LIKE LOWER('" + abbrev + "%')";
	if(caseSensitive === "true"){
		likeQuery = "WHERE word LIKE '" + abbrev + "%'";
	}
	var query = "SELECT id, word FROM words "+likeQuery+" ORDER BY word ";

	db.all(query, function(err,data){
		if(err){
			res.status(500).send("Database Error");
		}
		else{
			res.status(200).json(data);
		}
	});
});

router.get('/dictionary/:id', function(req, res, next){
	console.log("first route");
	var wordId = req.params.id;

	var query = "SELECT id, word from words WHERE id = " + wordId;
	db.get(query, function(err, data){
		if(err){
			res.status(404).send("Not Found");
		}else{
			//res.status(200).json(data);
			res.wordData = data;
			next();
		}
	});
});

router.get('/dictionary/:id', function(req, res, next){
	var word = res.wordData.word;
	res.wordData.twitter = {};
	var twitSearch ="https://api.twitter.com/1.1/search/tweets.json?";
	twitSearch +="q=";
	twitSearch += "lang%3Aen%20"
	twitSearch += "%23" + word;
	twitSearch +="&result_type=recent";
	twitClient.get(twitSearch, twitterParams, function(error, tweets, response){
		if(error){
			console.error("Twitter FAIL WHALE");
			console.error(error);
		}
		else{
			console.log("in the second get else");
			console.log(tweets);
			res.wordData.twitter = tweets;

		}
		console.log(res.wordData);
		res.status(200).json(res.wordData);
	});
	
})

router.delete('/dictionary/:id', function(req, res, next){
	var wordId = req.params.id;
	var query = "DELETE FROM words WHERE id = "+wordId;
	db.run(query, function(err, data){
		if(err){
			res.status(500).send("Database Error");
		}else{
			res.status(202).send();
		}
	});
});

router.put('/dictionary/:id', function(req,res,next){
	var wordId = req.params.id;
	var word = req.query.word;
	query = "UPDATE words SET word ='"+ word +"' WHERE id=" + wordId;
	db.run(query, function(err, data){
		if(err){
			res.status(409).send("Conflict");
		}
		else{
			res.status(200).send("Sent");
		}
	});
});

router.post('/dictionary', function(req, res, next){

	var word = req.query.word;
	var wordObj = {};
	wordObj.word = word;
	var query = "INSERT INTO words(word) VALUES ('" + word + "')";

	db.run(query, function(err,data){
		if(err){
			res.status(500).send("Database Error");
		}
		else{
			wordObj.id = this.lastID;
			var newUrl = req.baseUrl + "/dictionary/" + wordObj.id;
			res.set("Location", newUrl);
			res.status(201).json(wordObj);
		}
	});
});
module.exports = router;