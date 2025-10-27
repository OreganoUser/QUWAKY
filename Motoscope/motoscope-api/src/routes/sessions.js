import { q } from '../db.js';

export default async function (app) {
  app.get('/', async (req) => {
    const { from, to, class: klass } = req.query;
    const rows = await q(`
      SELECT s.*, e.gp_name, e.season_id
      FROM sessions s
      JOIN events e ON e.id=s.event_id
      WHERE ($1::timestamptz IS NULL OR s.start_time >= $1)
        AND ($2::timestamptz IS NULL OR s.start_time <= $2)
        AND ($3::race_class IS NULL OR s.class = $3::race_class)
      ORDER BY s.start_time
    `, [from || null, to || null, klass || null]);
    return rows;
  });
}
