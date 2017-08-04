function connectSocket() {
  var a = document.createElement('a');
  a.href = window.location;
  var url = `ws://` + a.host + '/ws' + a.pathname;
  return new WebSocket(url);
}

function sendMessage(message) {
	var jsonMessage = JSON.stringify(message);
	console.log('SEND ', jsonMessage);
	ws.send(jsonMessage);
}

function onIceCandidate(candidate) {
  sendMessage({
    action : 'iceCandidate',
    candidate : candidate
  });
}

function handleError(error) {
	console.error(error);
}

function createWebRTCPeer(options) {
  webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, function(error) {
    if(error) return handleError(error);
    this.generateOffer(function(error, sdpOffer) {
      if(error) return handleError(error);
      sendMessage({
        action : 'offer',
        offer : sdpOffer
      })
    });
  });
}

var ws = connectSocket();
var webRtcPeer;

window.onbeforeunload = function() {
	ws.close();
  webRtcPeer && webRtcPeer.dispose();
}

ws.onmessage = function(evt) {
	var message = JSON.parse(evt.data);
	console.info('RECV: ' + evt.data);

	if(message.action === 'iceCandidate') {
		webRtcPeer.addIceCandidate(message.candidate);
  } else if(message.action === 'answer') {
  	webRtcPeer.processAnswer(message.answer);
  } else {
		handleError('Unrecognized message: ' + message.data);
	}
}
