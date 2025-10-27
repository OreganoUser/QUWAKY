import { q } from '../db.js';

export default async function (app) {
  app.get('/', async () => q('SELECT id, slug, name, country, length_km, laps FROM circuits ORDER BY name'));

  app.get('/:id', async (req, reply) => {
    const { id } = req.params;
    const c = (await q('SELECT * FROM circuits WHERE id=$1', [id]))[0];
    if (!c) return reply.code(404).send({ error: 'Circuit not found' });

    const events = await q(`
      SELECT e.id, e.round, e.gp_name, s.year
      FROM events e JOIN seasons s ON s.id=e.season_id
      WHERE e.circuit_id=$1
      ORDER BY s.year DESC, e.round ASC
    `,[id]);
    return { ...c, events };
  });
}
