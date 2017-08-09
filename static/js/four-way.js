document.addEventListener('DOMContentLoaded', function(evt) {
  console.log('Creating WebRtcPeer and generating local sdp offer ...');

  setTimeout(function () {
    createWebRTCPeer({
      localVideo: document.querySelector('#my-video'),
      remoteVideo: document.querySelector('#other-video'),
      onicecandidate : onIceCandidate,
      configuration: {
	iceServers: [{"urls":"stun:stun.l.google.com:19302"}, {
	      "urls" : "turn:111.222.333.444", "username":"youruser", "credential":"yourpass"}]
      }
    });
  }, 500);
});
