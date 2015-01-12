// CONFIG
var triggerPhrases = [
    "pseudo make me a sandwich",
];

var isTutorialMode = false;

function init() {
    JimmyJohns.init().then(function(){
        // success
        console.log("JimmyJohns.init() success");
        injectPushListener(); // listen for voice command
        chrome.runtime.sendMessage(chrome.runtime.id, {action: "show_page_action"}); // show icon in omnibox
        updateOrderStatus("init", "Alexa is ready to make sandwiches");
    }, function(){
        // login not set or failed
        chrome.runtime.sendMessage(chrome.runtime.id, {action: "is_first_launch"}, function(ret){
            if (ret.isFirstLaunch){
                blurPage();
                firstLaunch();
            } else {
                console.error("JimmyJohns.init() failed");
                blurPage();
                showLoginWindow();
            }
        });
    });
}

function order() {
    chrome.runtime.sendMessage(chrome.runtime.id, {action: "is_ordering_enabled"}, function(ret){
        if (ret.enabled === true) {
            JimmyJohns.orderSandwich();
        } else {
            $('#artisanLaunchLogo').addClass('artisanOrderingDemo');
            $('#artisanEnableOrdering').fadeIn();
            setTimeout(function(){
                $('#artisanLaunchLogo').removeClass('artisanOrderingDemo');
            }, 2500);
        }
    });
}

function tutorialOrderPhraseFailed(){
    $('#artisanLaunchLogo').addClass('shake');
    setTimeout(function(){
        $('#artisanLaunchLogo').removeClass('shake');
    }, 500);
}

function firstLaunch(){
    $('html').append('<div id="artisanWelcome" class="artisanDialog"></div>');
    $.get(chrome.extension.getURL('/welcome.html'), function(data) {
        $('#artisanWelcome').html(data);
          $('#artisanTermsAccepted').one('click', function(){
            $('#artisanWelcome').remove();
            showLoginWindow();
        });
    });
}

function showLoginWindow(){
    $('html').append('<div id="artisanAlexaLogin" class="artisanDialog"></div>');
    $.get(chrome.extension.getURL('/login.html'), function(data) {
        $('#artisanAlexaLogin').html(data);
        $('#artisanAlexaLogin button').on('click', function(e) {
            $('#artisanAlexaLogin button').attr('disabled', 'disabled');
            var credentials = {
                email: $('#artisanAlexaLogin input[name="email"]').val(),
                pass: $('#artisanAlexaLogin input[name="pass"]').val()
            };
            testLogin(credentials);
        });
        $("#artisanAlexaLogin input").keyup(function(event){
            if(event.keyCode == 13){
                $("#artisanAlexaLogin button").click();
            }
        });
    });
}

function testLogin(credentials){
    // reset ui from previous login trys
    $('#artisanLoginTestResult').hide().html('');
    $('#artisanJJLoginTests .success, #artisanJJLoginTests .fail').removeClass('success').removeClass('fail');

    // test credentials and show each test results if login is fine
    JimmyJohns.testLogin(credentials, function(result){
        if (result.test == "login" && result.result == "success"){
            $('#artisanJJLoginTests').show();
            $('#artisanRegisterNote').hide();
        }

        $('#artisanTest-'+result.test).addClass(result.result);
        console.info('testLogin result', result);
    }).then(function(){
        // all tests completed successfully, save login and start normal flow
        JimmyJohns.saveCredentials(credentials).then(function(){
            console.info("New credentials saved, re-initializing");
            $('#artisanLoginTestResult').css('color', 'green').html('You\'re in! Legit!').show();
            $('#artisanLaunchTutorial').show();
            $('#artisanLaunchTutorial').on('click', function(e) {
                $('#artisanAlexaLogin').remove();
                tutorial();
            });
        });
    }, function(err){
        var errHtml;
        if (err.hasOwnProperty('url') && err.hasOwnProperty('errorText')){
            errHtml = err.errorText+' - <a href="'+err.url+'" target="_blank">Open Page</a>';
        } else {
            errHtml = err;
        }
        $('#artisanLoginTestResult').css('color', 'red').html(errHtml).show();
        $('#artisanAlexaLogin button').removeAttr('disabled');
    });
}

function tutorial(){
    isTutorialMode = true;
    $('html').append('<div id="artisanTutorial" class="artisanDialog"></div>');
    $.get(chrome.extension.getURL('/tutorial.html'), function(data) {
        $('#artisanTutorial').html(data);

        // command trigger display in tutorial - locked to first phrase until more phrases are required
        $('#artisanTriggerPhrase').text('Alexa, '+triggerPhrases[0]);

        injectPushListener(); // listen for voice command

        $('#artisanEnableOrdering').on('click', function(e) {
            enableOrdering(function(){
                $('#artisanTutorial').remove();
                isTutorialMode = false;
                removeBlurPage();
                init();
            });
        });
    });
}

function enableOrdering(callback){
    chrome.runtime.sendMessage(chrome.runtime.id, {action: "enable_ordering"}, callback);
}

function updateOrderStatus(state, text){
    if (state == "init") {
        $('html').append('<div id="artisanAlexaStatusWrap"><div id="artisanStatusLogo"></div><div id="artisanAlexaStatus"></div></div>');
        $('#artisanAlexaStatus').text(text);
        setTimeout(function(){
            $('#artisanAlexaStatusWrap').fadeOut();
        }, 5000);
    } else if (state == "loading") {
        $('#artisanAlexaStatusWrap').show();
        $('#artisanAlexaStatus').text(text);
    } else if (state == "success") {
        $('#artisanAlexaStatus').addClass('success').text(text);
        setTimeout(function(){
            $('#artisanAlexaStatusWrap').fadeOut();
        }, 7500);
    }
}

function blurPage() {
    $('body').css('-webkit-filter', 'blur(2.5px)');
    $('body').prepend('<div id="overlay"></div>');
}
function removeBlurPage() {
    $('body').css('-webkit-filter', '');
    $('#overlay').fadeOut();
}

init();
