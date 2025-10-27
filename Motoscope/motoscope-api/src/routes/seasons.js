import { q } from '../db.js';

export default async function (app) {
  app.get('/', async (req, reply) => {
    const rows = await q('SELECT id, year FROM seasons ORDER BY year DESC');
    return rows;
  });

  // /v1/seasons/:year/full → full tree (events + sessions + team entries + riders)
  app.get('/:year/full', async (req, reply) => {
    const { year } = req.params;
    const season = (await q('SELECT id, year FROM seasons WHERE year=$1', [year]))[0];
    if (!season) return reply.code(404).send({ error: 'Season not found' });

    const events = await q(`
      SELECT e.id, e.round, e.gp_name, e.start_date, e.end_date,
             c.id as circuit_id, c.name as circuit_name, c.country, c.length_km, c.laps
      FROM events e
      JOIN circuits c ON c.id=e.circuit_id
      WHERE e.season_id=$1
      ORDER BY e.round ASC
    `, [season.id]);

    const sessions = await q(`
      SELECT s.id, s.event_id, s.class, s.type, s.name, s.start_time, s.end_time
      FROM sessions s
      WHERE s.event_id = ANY($1::int[])
      ORDER BY s.start_time ASC
    `, [events.map(e => e.id)]);

    const entries = await q(`
      SELECT te.id, te.class, t.id as team_id, t.name as team_name, t.manufacturer
      FROM team_entries te
      JOIN teams t ON t.id=te.team_id
      WHERE te.season_id=$1
      ORDER BY t.name
    `, [season.id]);

    const contracts = await q(`
      SELECT rc.id, rc.class, rc.team_id, rc.rider_id, rc.number,
             r.first_name, r.last_name
      FROM rider_contracts rc
      JOIN riders r ON r.id=rc.rider_id
      WHERE rc.season_id=$1
    `, [season.id]);

    return { season, events, sessions, entries, contracts };
  });
}
