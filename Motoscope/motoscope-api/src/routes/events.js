import { q } from '../db.js';

export default async function (app) {
  app.get('/', async (req) => {
    const { year } = req.query;
    const rows = await q(`
      SELECT e.id, e.round, e.gp_name, e.start_date, e.end_date,
             s.year, c.name AS circuit, c.country
      FROM events e
      JOIN seasons s ON s.id=e.season_id
      JOIN circuits c ON c.id=e.circuit_id
      WHERE ($1::int IS NULL OR s.year=$1)
      ORDER BY s.year DESC, e.round ASC
    `, [year || null]);
    return rows;
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params;
    const ev = (await q(`
      SELECT e.*, c.name AS circuit_name, c.country, c.length_km, c.laps
      FROM events e JOIN circuits c ON c.id=e.circuit_id
      WHERE e.id=$1
    `,[id]))[0];
    if (!ev) return reply.code(404).send({ error: 'Event not found' });

    const sessions = await q('SELECT * FROM sessions WHERE event_id=$1 ORDER BY start_time', [id]);
    return { ...ev, sessions };
  });
}
