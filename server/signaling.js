import url          from 'url';
import WebSocket    from 'ws';
import Kurento      from 'kurento-client';
import uuidv4       from 'uuid/v4';

import OneToOneHandler from './one_to_one_handler';
import FourWayHandler from './four_way_handler';
import ConferenceHandler from './conference_handler';

const kurentoUrl = process.env.KURENTO_URL;
let kurentoClient = null;

getKurentoClient();

export const AVAILABLE_HANDLERS = {
  'one-to-one' : OneToOneHandler,
  'four-way'   : FourWayHandler,
  'conference' : ConferenceHandler
};

const sessions = {};
for(var handler in AVAILABLE_HANDLERS) {
  sessions[handler] = {};
}

function stop(ws) {
  if(ws.readyState === WebSocket.OPEN) {
    ws.close();
  }
}

function stopWithError(ws, error) {
  console.error(error);
  stop(ws);
}

async function getKurentoClient() {
  if(kurentoClient === null) {
    kurentoClient = await Kurento(kurentoUrl);
    console.log('Connected to Kurento');
  }
  return kurentoClient;
}

export function enableSignaling(server, kurentoServer) {
  const wss = new WebSocket.Server({
    server: server
  });

  wss.on('connection', async (ws) => {
    let parsedUrl = url.parse(ws.upgradeReq.url);

    // /:handlerName/:id[/params...]
    let urlSegments = parsedUrl.pathname.split('/').filter(s => s.length);
    urlSegments.shift(); // Drop /ws
    if(urlSegments.length > 1) {
      let handlerName = urlSegments.shift();
      let sessionId = urlSegments.shift();
      let handler = AVAILABLE_HANDLERS[handlerName];
      if(handler === undefined) {
        console.error(`Unknown handler ${handlerName}`);
        ws.close();
        return
      }
      let session = sessions[handlerName][sessionId];

      if(!session) {
        session = new handler(await getKurentoClient(kurentoUrl), sessionId);
        await session.init();
        session.on('shutdown', () => {
          delete sessions[handlerName][sessionId];
        });
        sessions[handlerName][sessionId] = session;
      }

      let clientId = uuidv4();

      let addSuccess = session.addClient(clientId, urlSegments, message => {
        console.log('SEND', message.action);
        ws.send(JSON.stringify(message));
      });

      if(!addSuccess) {
        stopWithError(ws, `Participant limit reached for session of type ${handlerName}`);
        return;
      }

      ws.on('error', error => {
        session.removeClient(clientId);
        stopWithError(ws, error);
      })

      ws.on('close', _ => {
        session.removeClient(clientId);
        stop(ws);
      });

      ws.on('message', _message => {
        let message = JSON.parse(_message);
        console.log('RECV', message.action)
        if(message.action === 'iceCandidate') {
          session.addIceCandidate(clientId, message.candidate);
        } else if(message.action === 'offer') {
          session.receiveOffer(clientId, message.offer);
        } else {
          session.removeClient(clientId);
          stopWithError(ws, `Unhandled message '${message.action}'`);
        }
      });
    } else {
      stopWithError(ws, `Invalid path ${parsedUrl.pathname}`);
    }
  });
}
