import {
  Router, json, newId, z, parseOrThrow, SecurityEnv
} from '@logic/shared';

const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email().optional()
});

const router = new Router<SecurityEnv>();

router.get('/health', () => json({
  worker: 'logic-security-worker',
  status: 'healthy',
  ts: new Date().toISOString()
}));

router.get('/users', async ({ env }) => {
  const res = await env.DB_MAIN.prepare(
    'SELECT id, username, email, status, created_at FROM users LIMIT 100'
  ).all();
  return json({ items: res.results });
});

router.post('/users', async ({ req, env }) => {
  const data = parseOrThrow(CreateUserSchema, await req.json());
  const id = newId('usr');
  await env.DB_MAIN.prepare(
    `INSERT INTO users (id, username, email, status)
     VALUES (?, ?, ?, 'active')`
  ).bind(id, data.username, data.email ?? null).run();
  return json({ id, ...data });
});

export default {
  async fetch(req: Request, env: SecurityEnv, ctx: ExecutionContext): Promise<Response> {
    return router.handle(req, env, ctx);
  }
};
