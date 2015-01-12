chrome.runtime.onInstalled.addListener(function(details) {
    var thisVersion = chrome.runtime.getManifest().version;
    if (details.reason == 'install') {
    	chrome.tabs.create({
            url: 'http://echo.amazon.com'
        }, function(tab) {
            //
        });
	} else if (details.reason == 'update') {
		//
	}
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.action){
    case "is_first_launch":
     var hasLaunched = localStorage.getItem('artisan_welcome_displayed');
     if (hasLaunched){
      sendResponse({isFirstLaunch: false});
     } else {
      sendResponse({isFirstLaunch: true});
      localStorage.setItem('artisan_welcome_displayed', true);
     }
     break;

    case "show_page_action":
  	 chrome.pageAction.show(sender.tab.id);
     break;

    case "set_jj_settings":
  	 localStorage.setItem('jj_email', request.email);
  	 localStorage.setItem('jj_pass', request.pass);
  	 sendResponse({ success: true });
     break;

    case "get_jj_settings":
    	sendResponse({
        email: localStorage.getItem('jj_email'),
        pass: localStorage.getItem('jj_pass')
      });
      break;

    case "is_ordering_enabled":
      if (localStorage.getItem('jj_ordering_enabled')) {
        sendResponse({enabled: true});
      } else {
        sendResponse({enabled: false});
      }
      break;

    case "enable_ordering":
      localStorage.setItem('jj_ordering_enabled', true);
      sendResponse({success: true});
      break;
  }
});