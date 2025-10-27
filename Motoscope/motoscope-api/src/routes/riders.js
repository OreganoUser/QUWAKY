import { q } from '../db.js';

export default async function (app) {
  app.get('/', async (req) => {
    const { q: search } = req.query;
    if (search) {
      return q(`SELECT id, slug, first_name, last_name, country
                FROM riders
                WHERE to_tsvector('simple', first_name || ' ' || last_name) @@ plainto_tsquery('simple', $1)
                ORDER BY last_name`, [search]);
    }
    return q('SELECT id, slug, first_name, last_name, country FROM riders ORDER BY last_name');
  });

  app.get('/:id', async (req, reply) => {
    const { id } = req.params;
    const r = (await q('SELECT * FROM riders WHERE id=$1', [id]))[0];
    if (!r) return reply.code(404).send({ error: 'Rider not found' });

    const career = (await q('SELECT * FROM rider_career_stats WHERE rider_id=$1', [id]))[0] || null;
    const seasons = await q(`
      SELECT rc.season_id, s.year, rc.class, rc.team_id, t.name as team_name, rc.number
      FROM rider_contracts rc
      JOIN seasons s ON s.id=rc.season_id
      JOIN teams t ON t.id=rc.team_id
      WHERE rc.rider_id=$1
      ORDER BY s.year DESC
    `,[id]);

    return { ...r, career, seasons };
  });
}
