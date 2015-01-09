// CONFIG
var triggerPhrases = [
    "pseudo make me a sandwich",
];

function init() {
    JimmyJohns.init().then(function(){
        // success
        console.log("JimmyJohns.init() success");
        injectPushListener(); // listen for voice command
        chrome.runtime.sendMessage(chrome.runtime.id, {action: "show_page_action"}); // show icon in omnibox
        updateOrderStatus("init", "Alexa is ready to make sandwiches");
    }, function(){
        // login not set
        console.error("JimmyJohns.init() failed");
        showLoginWindow();
    });
}

function order() {
    JimmyJohns.orderSandwich();
}

function showLoginWindow(){
    $('html').append('<div id="artisanAlexaLogin"></div>');
    $.get(chrome.extension.getURL('/login.html'), function(data) {
        $('#artisanAlexaLogin').html(data);
        $('#artisanAlexaLogin button').one('click', function(e) {
            JimmyJohns.saveCredentials({
            email: $('#artisanAlexaLogin input[name="email"]').val(),
            pass: $('#artisanAlexaLogin input[name="pass"]').val()
            }).then(function(){
                console.info("New credentials saved, re-initializing");
                $('#artisanAlexaLogin').remove();
                init();
            });
        });
    });
}

function updateOrderStatus(state, text){
    if (state == "init") {
        $('html').append('<div id="artisanAlexaStatus"></div>');
        $('#artisanAlexaStatus').text(text);
        setTimeout(function(){
            $('#artisanAlexaStatus').fadeOut();
        }, 5000);
    } else if (state == "loading") {
        $('#artisanAlexaStatus').show().text(text);
    } else if (state == "success") {
        $('#artisanAlexaStatus').addClass('success').text(text);
        setTimeout(function(){
            $('#artisanAlexaStatus').fadeOut();
        }, 7500);
    }
}


init();
