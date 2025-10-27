import fp from 'fastify-plugin';
import { getKeyRecord } from '../auth.js';

export default fp(async function (fastify, opts) {
  fastify.decorateRequest('apiKeyRecord', null);

  fastify.addHook('preHandler', async (request, reply) => {
    // allow public health or docs endpoints without key
    if (request.routerPath === '/health' || request.routerPath?.startsWith('/docs')) return;

    const key = request.headers['x-api-key'] || request.query.api_key;
    if (!key) {
      reply.code(401).send({ error: 'Missing API key' });
      return;
    }

    const rec = await getKeyRecord(key);
    if (!rec) {
      reply.code(403).send({ error: 'Invalid API key' });
      return;
    }
    // attach
    request.apiKeyRecord = rec;
    // you can also check per-key quota here (or in Redis)
  });
});
