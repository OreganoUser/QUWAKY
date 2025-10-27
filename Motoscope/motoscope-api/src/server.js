// src/server.js (ESM)
import Fastify from 'fastify';
import cors from '@fastify/cors';

import seasonsRoutes from './routes/seasons.js';
import eventsRoutes  from './routes/events.js';
import teamsRoutes   from './routes/teams.js';
import ridersRoutes  from './routes/riders.js';
import circuitsRoutes from './routes/circuits.js';
import sessionsRoutes from './routes/sessions.js';

const app = Fastify({ logger: true });

// CORS: allow your frontend during dev
await app.register(cors, { origin: true });

app.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }));

app.register(seasonsRoutes,  { prefix: '/v1/seasons' });
app.register(eventsRoutes,   { prefix: '/v1/events'  });
app.register(sessionsRoutes, { prefix: '/v1/sessions'});
app.register(teamsRoutes,    { prefix: '/v1/teams'   });
app.register(ridersRoutes,   { prefix: '/v1/riders'  });
app.register(circuitsRoutes, { prefix: '/v1/circuits'});

const port = process.env.PORT || 3000;
app.listen({ port, host: '0.0.0.0' });
