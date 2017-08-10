import BaseHandler from './base_handler';
import _           from 'lodash';
import fs          from 'fs';
import url         from 'url';

export default class ConferenceHandler extends BaseHandler {
  constructor(kurentoClient, id) {
    super(kurentoClient, id);
    this.presenter = null;
  }



  addClient(id, params, channel) {
    if(params[0] === 'presenter') {

      if(this.presenter) return false;
      this._addClient(id, params, channel).then(client => {
        this.presenter = client;
        _(this.clients)
          .filter(client => client.params[0] !== 'presenter')
          .each(viewer => viewer.endpoint && this.presenter.endpoint.connect(viewer.endpoint));
      });

    } else {
      this._addClient(id, params, channel).then(client => {
        this.connect(client);
      });
    }
    return true;
  }

  removeClient(id) {
    let client = _.find(this.clients, {id});
    if(client) {
      if(this.presenter && client.id === this.presenter.id) {
        this.presenter = null;
      }
      this._removeClient(client);
    }
  }

  async connect(client) {
    try {
      if(this.presenter) {
        await this.presenter.endpoint.connect(client.endpoint);
      }
    } catch(error) {
      console.log(error.message);
    }
  }
}
