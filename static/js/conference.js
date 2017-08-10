document.addEventListener('DOMContentLoaded', function(evt) {
  console.log('Creating WebRtcPeer and generating local sdp offer ...');

  var type = window.location.pathname.split('/').pop();

  setTimeout(function () {
    createWebRTCPeer({
      localVideo: document.querySelector('#my-video'),
      remoteVideo: document.querySelector('#other-video'),
      onicecandidate : onIceCandidate,
      type: type,
      mode: type === 'presenter' ? 'Sendonly' : 'Recvonly'
    });
  }, 500);
});
