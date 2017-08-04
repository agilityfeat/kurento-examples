import Kurento      from 'kurento-client';
import EventEmitter from 'events';
import _            from 'lodash';

const IceCandidate = Kurento.getComplexType('IceCandidate');

export default class BaseHandler extends EventEmitter {

  constructor(kurento, id) {
    super();
    this.id = id;
    this.kurento = kurento;
    this.candidates = {};
    this.offers = {};
    this.clients = [];
    this.pipeline = null;
  }

  async init() {
    this.pipeline = await this.kurento.create('MediaPipeline');
  }

  addIceCandidate(id, _candidate) {
    let candidate = IceCandidate(_candidate);
    let client = _.find(this.clients, {id});
    if(client && client.endpoint) {
      client.endpoint.addIceCandidate(candidate);
    } else {
      this.candidates[id] = this.candidates[id] || [];
      this.candidates[id].push(candidate);
    }
  }

  async _addClient(id, params, channel) {
    let client = {
      id, params, channel
    };
    this.clients.push(client);
    let webRtc = await this.pipeline.create('WebRtcEndpoint');
    client.endpoint = webRtc;
    webRtc.on('OnIceCandidate', event => {
      let candidate = IceCandidate(event.candidate);
      channel({
          action : 'iceCandidate',
          candidate : candidate
      });
    });

    webRtc.on('MediaStateChanged', evt => console.log(`MediaState: ${evt.oldState} => ${evt.newState}`));
    webRtc.on('ConnectionStateChanged', evt => console.log(`Connection: ${evt.oldState} => ${evt.newState}`));
    webRtc.on('OnIceComponentStateChanged', evt => console.log(`ICE: ${evt.state}`));
    webRtc.on('MediaFlowInStateChange', evt => console.log(`Media.In: ${evt.state}`));
    webRtc.on('MediaFlowOutStateChange', evt => console.log(`Media.Out: ${evt.state}`));

    _.map(this.candidates[id], candidate => webRtc.addIceCandidate(candidate));
  }

  _processOffer(client, offer) {
    client.endpoint.processOffer(offer).then(answer => {
      client.endpoint.gatherCandidates();
      client.channel({
        action: 'answer',
        answer
      })
    });
  }

  _removeClient(client) {
    let id = client.id;
    client.endpoint && client.endpoint.release();

    this.clients = _.reject(this.clients, {id});
    delete this.candidates[id];
    delete this.offers[id];

    if(_.size(this.clients) === 0) {
      this.pipeline && this.pipeline.release();
      this.emit('shutdown');
      console.log(`Shutdown ${this.id}`)
    }
  }

  receiveOffer(id, offer) {
    let client = _.find(this.clients, {id});
    if(client && client.endpoint) {
      this._processOffer(client, offer);
    } else {
      this.offers[id] = offer;
    }
  }

}
