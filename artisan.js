// CONFIG
var triggerPhrases = [
    "pseudo make me a sandwich",
];

function init() {
    JimmyJohns.init().then(function(){
        // success
        console.log("JimmyJohns.init() success");
    }, function(){
        // login not set
        console.error("JimmyJohns.init() failed");
        JimmyJohns.saveCredentials({
            email: "",
            pass: ""
        }).then(function(){
            console.info("New credentials saved, re-initializing");
            init();
        });
    });

    injectPushListener(); // listen for voice command
    chrome.extension.sendRequest("show_page_action"); // show icon in omnibox
    updateOrderStatus("init", "Alexa is ready to make sandwiches");
}

function order() {
    JimmyJohns.orderSandwich();
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
