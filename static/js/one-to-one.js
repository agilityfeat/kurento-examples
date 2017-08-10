document.addEventListener('DOMContentLoaded', function(evt) {
  console.log('Creating WebRtcPeer and generating local sdp offer ...');

  setTimeout(function () {
    createWebRTCPeer({
      localVideo: document.querySelector('#my-video'),
      remoteVideo: document.querySelector('#other-video'),
      onicecandidate : onIceCandidate,
    });
  }, 500);
});
