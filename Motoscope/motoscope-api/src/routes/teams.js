import { q } from '../db.js';

export default async function (app) {
  app.get('/', async () => q('SELECT id, slug, name, manufacturer, country FROM teams ORDER BY name'));

  app.get('/:id', async (req, reply) => {
    const { id } = req.params;
    const team = (await q('SELECT * FROM teams WHERE id=$1', [id]))[0];
    if (!team) return reply.code(404).send({ error: 'Team not found' });

    const staff = await q('SELECT id, role, first_name, last_name, birth_date FROM staff WHERE team_id=$1', [id]);
    return { ...team, staff };
  });
}
