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
  if (request.action == "show_page_action") {
  	chrome.pageAction.show(sender.tab.id);
  } else if (request.action == "set_jj_settings") {
  	localStorage.setItem('jj_email', request.email);
  	localStorage.setItem('jj_pass', request.pass);
  	sendResponse({ success: true });
  } else if (request.action == "get_jj_settings") {
  	sendResponse({
        email: localStorage.getItem('jj_email'),
        pass: localStorage.getItem('jj_pass')
    });
  }
});