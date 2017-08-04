document.addEventListener('DOMContentLoaded', function(evt) {
	console.log('Creating WebRtcPeer and generating local sdp offer ...');

	setTimeout(function () {
	  createWebRTCPeer({
	    localVideo: document.querySelector('#my-video'),
	    remoteVideo: document.querySelector('#other-video'),
	    onicecandidate : onIceCandidate,
			configuration: {
				iceServers: [{
					"urls":"stun:stun.l.google.com:19302"},{"urls":"stun:stun1.l.google.com:19302"
				}, {
					"urls" : "turn:34.199.5.161", "username":"ubuntu", "credential":"kurentoserverpass"
				}]
			}
	  });
	}, 500);
});
