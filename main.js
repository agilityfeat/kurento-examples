import path    from 'path';
import express from 'express';
import http    from 'http';

import {
  enableSignaling,
  AVAILABLE_HANDLERS
} from './server/signaling';

const app = express();

app.set('view engine', 'pug');
app.set('views', './server/views');
app.use(express.static(path.join(__dirname, 'static')));

function httpHandler(name) {
  return (req, res) => res.render(name, req.params);
}

for(var name in AVAILABLE_HANDLERS) {
  app.get(`/${name}/:id/:param?`, httpHandler(name));
}

const server = http.createServer(app).listen(3000, function() {
    console.log('Kurento App. started');
});

enableSignaling(server);
