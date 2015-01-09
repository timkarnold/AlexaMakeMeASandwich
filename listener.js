function determineIfWantSandwich(command) {
    if ($.inArray(command.toLowerCase(), triggerPhrases) >= 0) {
        console.log('determineIfWantSandwich desire triggered!', command);
        order();
    } else {
        console.info('command did not request order', command);
    }
}

// listener stuff
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "alexaActivity")) {
    if (event.data.ret && event.data.ret.activity) {
        var activity = event.data.ret.activity;
        console.log("Content script received", activity);
        var command;
        if (activity.description) {
            command = JSON.parse(activity.description).summary;
            determineIfWantSandwich(command);
        }
    }
  }
}, false);

// get around the sandbox so we can hook in
function injectPushListener() {
    var seD = document.createElement('script');
    seD.type = 'text/javascript';
    seD.text = 'function onPushActivity (c) { var b = c.key.registeredUserId + "#" + c.key.entryId; var url = "https://pitangui.amazon.com/api/activities/"+ encodeURIComponent(b); $.get(url, function(ret){ window.postMessage({ type: "alexaActivity", ret: ret }, "*"); });}';
    seD.text += 'var e = require("collections/cardstream/card-collection").getInstance();\r';
    seD.text += 'e.listenTo(e, "pushMessage", function(c){ onPushActivity(c); });';
    var sD = document.getElementsByTagName('script')[0];
    sD.parentNode.insertBefore(seD, sD);
}