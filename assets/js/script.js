$(document).ready(function() {

	// Credentials
    // si apagar
    var userId = '114696'
    var roomId = '110736'
    var baseUrl = "https://e7e74264.ngrok.io";
    var createThoughtsEndpoint = `/app:mammut-1/graph/user:${userId}/create`
    var getThoughtsEndpoint = `/app:mammut-1/graph/room:{roomId}/with:=thought?creation-date.last(10)`
    var locahostMock = 'http://localhost:3000/objects/create_thought'
    var locahostMockThoughtsResponse = 'http://localhost:3000/objects/get_thoughts/'

	//---------------------------------- Add dynamic html bot content(Widget style) ----------------------------
	// You can also add the html content in html page and still it will work!
	var mybot = '<div class="chatCont" id="chatCont">'+
								'<div class="bot_profile">'+
									'<img src="assets/img/bot.png" class="bot_p_img">'+
									'<div class="close">'+
										'<i class="fa fa-times" aria-hidden="true"></i>'+
									'</div>'+
								'</div><!--bot_profile end-->'+
								'<div id="result_div" class="resultDiv"></div>'+
								'<div class="chatForm" id="chat-div">'+
									'<div class="spinner">'+
										'<div class="bounce1"></div>'+
										'<div class="bounce2"></div>'+
										'<div class="bounce3"></div>'+
									'</div>'+
									'<input type="text" id="chat-input" autocomplete="off" placeholder="Try typing here"'+ 'class="form-control bot-txt"/>'+
								'</div>'+
							'</div><!--chatCont end-->'+

							'<div class="profile_div">'+
								'<div class="row">'+
									'<div class="col-hgt">'+
										'<img src="assets/img/bot.png" class="img-circle img-profile">'+
									'</div><!--col-hgt end-->'+
									'<div class="col-hgt">'+
										'<div class="chat-txt">'+
											'Chat with us now!'+
										'</div>'+
									'</div><!--col-hgt end-->'+
								'</div><!--row end-->'+
							'</div><!--profile_div end-->';

	$("mybot").html(mybot);

	// ------------------------------------------ Toggle chatbot -----------------------------------------------
	$('.profile_div').click(function() {
		$('.profile_div').toggle();
		$('.chatCont').toggle();
		$('.bot_profile').toggle();
		$('.chatForm').toggle();
		document.getElementById('chat-input').focus();
	});

	$('.close').click(function() {
		$('.profile_div').toggle();
		$('.chatCont').toggle();
		$('.bot_profile').toggle();
		$('.chatForm').toggle();
	});


	// Session Init (is important so that each user interaction is unique)--------------------------------------
	var session = function() {
		// Retrieve the object from storage
		if(sessionStorage.getItem('session')) {
			var retrievedSession = sessionStorage.getItem('session');
		} else {
			// Random Number Generator
			var randomNo = Math.floor((Math.random() * 1000) + 1);
			// get Timestamp
			var timestamp = Date.now();
			// get Day
			var date = new Date();
			var weekday = new Array(7);
			weekday[0] = "Sunday";
			weekday[1] = "Monday";
			weekday[2] = "Tuesday";
			weekday[3] = "Wednesday";
			weekday[4] = "Thursday";
			weekday[5] = "Friday";
			weekday[6] = "Saturday";
			var day = weekday[date.getDay()];
			// Join random number+day+timestamp
			var session_id = randomNo+day+timestamp;
			// Put the object into storage
			sessionStorage.setItem('session', session_id);
			var retrievedSession = sessionStorage.getItem('session');
		}
		return retrievedSession;
		// console.log('session: ', retrievedSession);
	}

	// Call Session init
	var mysession = session();


	// on input/text enter--------------------------------------------------------------------------------------
	$('#chat-input').on('keyup keypress', function(e) {
		var keyCode = e.keyCode || e.which;
		var text = $("#chat-input").val();
		if (keyCode === 13) {
			if(text == "" ||  $.trim(text) == '') {
				e.preventDefault();
				return false;
			} else {
				$("#chat-input").blur();
				setUserResponse(text);
				send(text);
				e.preventDefault();
				return false;
			}
		}
	});


	//------------------------------------------- Send request to mammut_api ---------------------------------------
	function send(text) {
		$.ajax({
			type: "POST",
            //url: baseUrl+createThoughtsEndpoint,
            url: locahostMock,
			contentType: "application/json",
			dataType: "json",
            crossDomain: true,
			headers: {
                //"Authorization": "Bearer " + accessToken
                "Access-Control-Allow-Origin":"http://localhost:8080"
			},
            //TODO: sacar de algun lado la fecha, ver como se hace en las primeras lineas de este archivo
			data: JSON.stringify({"text": text,"creation-date": "20160402-155100","in@room": {"id":{roomId}}}),
			success: function(response) {
                if (response.status === "Success"){
                    console.log(response);
                    fetchThoughtResponse(response, text);
                    //main(data);
                }
			},
			error: function(e) {
				console.log (e);
			}
		});
	}


	//------------------------------------------- fetch response function ------------------------------------------------
    //TODO:que debe reecibir esta funcion???debve ser la que hace el polling?
    //TODO: hacer el polling aqui?? de alguna manera chequear el ultimo estado y si cambia actualizarlo?
    function fetchThoughtResponse(createResponse, text){// TODO:text no se utiliza, solo para tener todos los tipos de respuesta que se aceptan, harcode
		$.ajax({
			type: "GET",
            //url: baseUrl+getThoughtsEndpoint,
            url: locahostMockThoughtsResponse+text,
			contentType: "application/json",
			dataType: "json",
            crossDomain: true,
			headers: {
                //"Authorization": "Bearer " + accessToken
			},
			success: function(data) {
                console.log('api response, before processing',data);
                main(data);
			},
			error: function(e) {
				console.log (e);
                setBotResponse('');
			}
		});
    }

	//------------------------------------------- Main function ------------------------------------------------
    //TODO: toma en cuenta que otra funcion hara el polling, y esta funcion main u otra sera quien procesara un(1) resutado o thought, puede recibir como parametro un thought, revisar cuales son los parametros que incluye un thpug??como parseo esos que vienen con foto??preguntarle a mariale
	function main(data) {
        if (data.message.quick_replies){
            var action = 'quick_replies';
            var replies = data.message.quick_replies;
            var title = data.message.text;
            console.log('replies', replies)
        }else if(data.message.text){
            var action = 'text';
            var speech = data.message.text;
            console.log('speech', speech);
        }else if(data.message.attachment.type === 'image'){
            var action = data.message.attachment.type;
            var image = data.message.attachment.payload.url;
            console.log('speech', speech);
        }else if(data.message.attachment.type === 'template'){
            if (data.message.attachment.payload.template_type === 'generic'){
                var action = data.message.attachment.payload.template_type;
                var elements = data.message.attachment.payload.elements;
            }else if(data.message.attachment.payload.template_type === 'button'){
                var action = data.message.attachment.payload.template_type;
                var text = data.message.attachment.payload.text;
                var elements = [data.message.attachment.payload];
            }
        }

        //TODO: estoy redundando?dejar o switch o if's!!
		switch(action) {
			// case 'your.action': // set in api
			case 'quick_replies': // set in api.ai
				addSuggestion(title, replies);
				break;
			case 'text': // set in api.ai
				setBotResponse(speech);
				break;
            case 'image': 
                setBotImageResponse(image);
				break;
            case 'generic': 
                setGenericResponses(elements);
				break;
            case 'button': 
                setGenericResponses(elements);
				break;
			default:
				setBotResponse(speech);
				if(suggestions) { // check if quick replies are there in api.ai
					addSuggestion(suggestions);
				}
				break;
		}
	}


	//------------------------------------ Set bot response in result_div -------------------------------------
	function setBotResponse(val) {
        console.log(val);
		setTimeout(function(){
			if($.trim(val) == '') {
				val = 'I couldn\'t get that. Let\' try something else!'
				var BotResponse = '<p class="botResult">'+val+'</p><div class="clearfix"></div>';
				$(BotResponse).appendTo('#result_div');
			} else {
				val = val.replace(new RegExp('\r?\n','g'), '<br />');
				var BotResponse = '<p class="botResult">'+val+'</p><div class="clearfix"></div>';
                console.log(BotResponse);
				$(BotResponse).appendTo('#result_div');
			}
			scrollToBottomOfResults();
			hideSpinner();
		}, 500);
	}

	//------------------------------------ Get title html element -------------------------------------
    function getTitleElement(title) {
        return '<div class="generic-title">'+title+' </div>';
    }

	//------------------------------------ Get image html element -------------------------------------
    function getImageElement(imageUrl) {
        return '<img src="'+imageUrl+'" alt="Image Not Found" style="width:318px;height:318px;">';
    }

	//------------------------------------ Set bot image responses in result_div -------------------------------------
	function setBotImageResponse(val) {
        var image = getImageElement(val)
        setBotResponse(image);
	}

	//------------------------------------ Set bot generic response in result_div -------------------------------------
	function setGenericResponses(values) {
        var BotResponse = '<p class="generic"></p><div class="clearfix"></div>';
        $(BotResponse).appendTo('#result_div');
        //botones prev y next con handlers
        if (values.length !== 1){
            $('<a class="prev-button" href="#prev">P</a>').appendTo($('.generic').last());
            $('<a class="next-button" href="#next">N</a>').appendTo($('.generic').last());
            $('.next-button').on("click", nextElement)
            $('.prev-button').on("click", prevElement)
        }
        values.forEach(setGenericResponse);
    }

    //------------------------------------ Set bot generic response in result_div/ works for template_type = button -------------------------------------
	function setGenericResponse(val, index) {
        console.log('index', index)
        var title = val.title || val.text;
        var image = val.image_url;
        var buttons = val.buttons;
		setTimeout(function(){
            if (index === 0){
                var BotResponseElement = '<div id="'+ index+'" class="generic-element active"></div>';
            }else{
                var BotResponseElement = '<div id="'+ index+'" class="generic-element"></div>';
            }
            $(BotResponseElement).appendTo($('.generic').last());
            $(getTitleElement(title)).appendTo($('.generic-element').last());
            if (image){
                $(getImageElement(image)).appendTo($('.generic-element').last());
            }
            addButtons(buttons);
			scrollToBottomOfResults();
            hideSpinner();
		}, 500);
	}

    function nextElement(){
        console.log('next element function')
        var $activeElement = $('.active')
        var $nextActiveElement = $activeElement.next('.generic-element')
        if ($nextActiveElement.length !== 0){
            console.log('current element', $activeElement)
            console.log('next element', $activeElement.next())
            $nextActiveElement.addClass('active')
            $activeElement.removeClass('active')
        }
    }

    function prevElement(){
        console.log('prev element function')
        var $activeElement = $('.active')
        var $prevActiveElement = $activeElement.prev('.generic-element')
        if ($prevActiveElement.length !== 0){
            console.log('current element', $activeElement)
            console.log('prev element', $activeElement.prev())
            $prevActiveElement.addClass('active')
            $activeElement.removeClass('active')
        }
    }


	//------------------------------------- Set user response in result_div ------------------------------------
	function setUserResponse(val) {
		var UserResponse = '<p class="userEnteredText">'+val+'</p><div class="clearfix"></div>';
		$(UserResponse).appendTo('#result_div');
		$("#chat-input").val('');
		scrollToBottomOfResults();
		showSpinner();
		$('.suggestion').remove();
	}

	//---------------------------------- Scroll to the bottom of the results div -------------------------------
    //TODO: revisar esto, el problema de que se esconde el input ocurre cuando se ejecuta este metodo
	function scrollToBottomOfResults() {
		var terminalResultsDiv = $('#chatCont')[0];
        console.log(terminalResultsDiv.scrollTop)
		terminalResultsDiv.scrollTop = terminalResultsDiv.scrollHeight;
        console.log(terminalResultsDiv.scrollTop)
	}


	//---------------------------------------- Ascii Spinner ---------------------------------------------------
	function showSpinner() {
		$('.spinner').show();
	}
	function hideSpinner() {
		$('.spinner').hide();
	}

	//------------------------------------------- Add buttons --------------------------------------------------
	function addButtons(textToAdd) {
        console.log(textToAdd)
        var buttons = textToAdd;
        var buttonsLength = textToAdd.length;
        $('<div class="generic-buttons-container"></div>').appendTo($('.generic-element').last());
        // Loop through buttons
        for(i=0;i<buttonsLength;i++) {
            if(buttons[i].type === "web_url"){
                $('<a class="button-options" target="_blank" href="'+buttons[i].url+'">'+buttons[i].title+'</a>').appendTo($('.generic-buttons-container').last());
            }
        }
	}

	//------------------------------------------- Suggestions --------------------------------------------------
	function addSuggestion(suggestionQuestion, textToAdd) {
        setBotResponse(suggestionQuestion);
		setTimeout(function() {
			var suggestions = textToAdd;
			var suggLength = textToAdd.length;
			$('<p class="suggestion"></p>').appendTo('#result_div');
            //$('<div class="sugg-title">'+ title + ': </div>').appendTo('.suggestion');
			// Loop through suggestions
			for(i=0;i<suggLength;i++) {
				$('<span class="sugg-options">'+suggestions[i].title+'</span>').appendTo('.suggestion');
			}
			scrollToBottomOfResults();
		}, 1000);
	}

	// on click of suggestions get value and send to API.AI
	$(document).on("click", ".suggestion span", function() {
		var text = this.innerText;
		setUserResponse(text);
		send(text);
		$('.suggestion').remove();
	});
	// Suggestions end -----------------------------------------------------------------------------------------

});// Doc.ready close
