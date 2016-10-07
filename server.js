var express = require('express');
var app = express();
var port = process.env.PORT||8000;
var mongoose = require('mongoose');
var imgur_client_id = process.env.CLIENT_ID;
var requestApi = require('request');
var History = require('./app/models/history');
var db_uri = process.env.MONGOLAB_URI;

mongoose.connect(db_uri);

app.use(express.static('public'));

app.get('/imagesearch',function(request, response){
	response.json({error: 'Please enter a search parameter'});
});

//Get search history
app.get('/latest/imagesearch',function(request, response){
	History.find().select('-_id term when').sort({'when':-1}).limit(10).exec(function(err,logs){
		if(err) response.send(err);

		response.json(logs);
	});
});

//Execute image search
app.get('/imagesearch/:search',function(request,response){
	var search = request.params.search;
	var page = Number(request.query.offset)||1;

	var options = {
		url: 'https://api.imgur.com/3/gallery/search/top/' + page + '?q=' + search + ' ext:jpg OR png OR gif OR anigif NOT album',
		headers: {
			'Authorization': 'Client-ID ' + imgur_client_id
		}
	};

	requestApi(options, function(err, apiRes, body){
		if(err) response.send(err);

		//Log search information
		var history = new History();

		history.when = new Date().toISOString();
		history.term = search;
		
		history.save(function(err){
			if(err) response.send(err);
		});
		
		//Display results
		if(apiRes.statusCode===200){
			var json = JSON.parse(body);
			var searchResults = [];

			json.data.forEach(function(item){
				var searchResult = {
					image_url: item.link,
					alt_text: item.title,
					page_url: 'http://imgur.com/gallery/' + item.id
				};

				searchResults.push(searchResult);
			});

			response.json(searchResults);
		}else{
			response.send(apiRes);
		}
	});
});

app.listen(port);