import {
  Router, json, newId, z, parseOrThrow, BankingEnv
} from '@logic/shared';

const CreateAccountSchema = z.object({
  user_id: z.string().min(3),
  asset: z.string().min(2).max(10)
});

const router = new Router<BankingEnv>();

router.get('/health', () => json({
  worker: 'logic-banking-worker',
  status: 'healthy',
  ts: new Date().toISOString()
}));

router.get('/accounts/:userId', async ({ env, params }) => {
  const r = await env.DB_MAIN.prepare(
    `SELECT id, user_id, asset, balance, available, locked, status
     FROM accounts WHERE user_id = ?`
  ).bind(params.userId).all();
  return json({ items: r.results });
});

router.post('/accounts', async ({ req, env }) => {
  const data = parseOrThrow(CreateAccountSchema, await req.json());
  const id = newId('acct');
  await env.DB_MAIN.prepare(
    `INSERT INTO accounts (id, user_id, asset, balance, available, locked, status)
     VALUES (?, ?, ?, 0, 0, 0, 'active')`
  ).bind(id, data.user_id, data.asset).run();
  return json({ id, ...data });
});

export default {
  async fetch(req: Request, env: BankingEnv, ctx: ExecutionContext): Promise<Response> {
    return router.handle(req, env, ctx);
  }
};
