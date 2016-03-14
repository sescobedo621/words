window.addEventListener("load", function(){
	var countField = document.getElementById("countWord");
	var countDisplay = document.getElementById("displayCount");
	var countSensitive = document.getElementById("countSensitive");

	countField.addEventListener("keyup", function(evt){ 
		var abbrev = countField.value;
		var uri = "/wordsapi/v2/count/" + abbrev;
		if(countSensitive.checked){
			uri+="?caseSensitive=true";
		}
		var xhr = new XMLHttpRequest(); xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200){
				var resp = xhr.response;
				countDisplay.innerHTML = "";
				for (var i=0; i<resp.length; i++) {
						var item = document.createElement("li");
						item.innerHTML = resp[i].count + " words match " + resp[i].abbrev;
       					countDisplay.appendChild(item);
   				}
			}
		}
		xhr.open("GET", uri); 
		xhr.responseType = 'json';
		xhr.send(null);
	});
	var searchField = document.getElementById("searchWord");
	var searchList = document.getElementById("wordlist");
	var searchSensitive = document.getElementById("searchSensitive");
	searchField.addEventListener("keyup", function(evt){
		var abbrev = searchField.value;
		var params = [];
		var uri = "/wordsapi/v2/search/" + abbrev;
			var thresh = searchField.dataset.threshold; 
		if (thresh && Number(thresh) > 0) {
			params.push("threshold=" + Number(thresh) );
		}
			if(searchSensitive.checked){
				params.push("caseSensitive=true");
		}
		
		if(params.length){
			uri+= "?"+params.join("&");
		}
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 200){
				searchList.innerHTML = "";
				if(xhr.response.length){
					for(var i=0; i<xhr.response.length; i++){
					var opt = document.createElement("option");
					opt.value = xhr.response[i].id;
					opt.label = xhr.response[i].word;
					opt.innerHTML = xhr.response[i].word;
					searchList.appendChild(opt);
					}
				}
				else{
					if(!document.getElementById("add")){
						createAddButton();
					}
				}
			}
		}
		xhr.open("GET", uri);
		xhr.responseType = "json";
		xhr.send();
	});
	var wordDisplay = document.getElementById("wordDisplay");
	searchList.addEventListener("change", function(evt){
		searchField.value = searchList.options[searchList.selectedIndex].label;

		var id = searchList.options[searchList.selectedIndex].value;
		var uri = "/wordsapi/v2/dictionary/" + id;

		var xhr = new XMLHttpRequest();
		xhr.open('GET', uri);

		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 200){
				var textInput = document.createElement("input");
				textInput.setAttribute("id", "wordUpdate");
				textInput.type = "text";
				textInput.value = xhr.response.word;
				wordDisplay.appendChild(textInput);
				createDeleteButton(xhr.response);
				createUpdateButton(xhr.response);
				tweetsSearch(xhr.response.twitter);
			}else if(xhr.status == 404){
				//add a word here
			}

		} 
		xhr.responseType = "json";
		xhr.send();
	});
	
	
});

function createDeleteButton(word){
	var wordDisplay = document.getElementById("wordDisplay");
	var deleteButton = document.createElement("input");
	deleteButton.setAttribute("id", "delete");
	deleteButton.setAttribute("f_id", word.id);
	deleteButton.type = "button";
	deleteButton.value = "DELETE";
	wordDisplay.appendChild(deleteButton);

	deleteButton.addEventListener("click", function(event){
		var wordId = deleteButton.getAttribute("f_id");
		var uri = "/wordsapi/v2/dictionary/"+ wordId;
		var xhr = new XMLHttpRequest();
		
		xhr.open('DELETE', uri);
	

		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 202){
				wordDisplay.innerHTML =  word.word + " has been deleted";
			}
		}
		xhr.send(word);
	});
}

function createUpdateButton(word){
	var wordDisplay = document.getElementById("wordDisplay");
	var updateButton = document.createElement("input");
	updateButton.setAttribute("id", "update");
	updateButton.setAttribute("w_id", word.id);
	updateButton.type = "button";
	updateButton.value = "UPDATE";
	wordDisplay.appendChild(updateButton);
	var newWord = document.getElementById("wordUpdate");

	updateButton.addEventListener("click", function(event){
		var wordId = word.id;
		var xhr = new XMLHttpRequest();
		var newWordObject ={}
		newWordObject.id = wordId;
		newWordObject.word = newWord.value;
		var uri = "/wordsapi/v2/dictionary/" + wordId;
		uri += "?word=" + newWord.value;
		xhr.open('PUT', uri);

		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 200){
				wordDisplay.innerHTML = word.word+" has been updated to "+newWord.value;
			}

		}
		xhr.responseType = 'json';
 		xhr.setRequestHeader("Content-type", "application/json");
		xhr.send(newWordObject);

	});
}

function createAddButton(){
	var wordDisplay = document.getElementById("wordDisplay");
	var searchList = document.getElementById("wordsearch");
	var addButton = document.createElement("input");
	addButton.setAttribute("id", "add");
	addButton.type = "button";
	addButton.value = "ADD";
	searchList.appendChild(addButton);
	var word = document.getElementById("searchWord");
	addButton.addEventListener("click", function(event){
		var wordJSON = {};
		wordJSON.word = word.value;
		var uri = "/wordsapi/v2/dictionary?word="+word.value;

		var xhr = new XMLHttpRequest();
		xhr.open('POST', uri);

		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 201){
				wordDisplay.innerHTML = word.value + " has been added";
			}
		}
		xhr.responseType = 'json';
  		xhr.setRequestHeader("Content-type", "application/json");
		xhr.send(JSON.stringify(wordJSON));
	});

}

function tweetsSearch(tweets){
	//console.log(tweets);
	var wordInfo = document.getElementById("wordInfo");
	//console.log(tweets.statuses);
	var tweetList = tweets.statuses;
	//console.log(tweetList);
	wordInfo.innerHTML = "";
	for(var i = 0; i < tweetList.length; i++){
		var tweet = tweetList[i];
		var tweetDiv = document.createElement("div");
		tweetDiv.setAttribute("class", "tweet");
		tweetDiv.innerHTML = tweet.text + "<br>";
		wordInfo.appendChild(tweetDiv);
	}
}
function linkUrl(text){
	var pattern = "/(https?:\/\/\S+)/g";
	var newText = text.replace(pattern, "<a href='$1' target='_blank'>$1</a>");
	return newText;
}
function linkHashTags(text){
	var pattern ="/(#(\w+))/g";
	var newText = text.replace(pattern, "<a href='https://twitter.com.search?q=%23$2' target='_blank'>$1</a>");
}