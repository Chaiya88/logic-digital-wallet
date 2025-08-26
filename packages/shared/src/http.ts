import { AppError, isAppError } from './errors';
import { createLogger } from './logger';
export type Handler<Env = any> = (ctx: Context<Env>) => Promise<Response> | Response;
export interface Context<Env>{
  env: Env; req: Request; url: URL; params: Record<string,string>;
  log: ReturnType<typeof createLogger>; waitUntil: (p: Promise<any>) => void;
}
interface Route<Env>{ method:string; pattern:RegExp; keys:string[]; handler:Handler<Env>; }
export class Router<Env = any>{
  private routes: Route<Env>[] = [];
  constructor(private baseLogger = createLogger('info', { svc: 'router' })) {}
  on(method:string, path:string, handler:Handler<Env>){
    const { regex, keys } = compilePath(path);
    this.routes.push({ method:method.toUpperCase(), pattern:regex, keys, handler });
    return this;
  }
  get(p:string,h:Handler<Env>){ return this.on('GET',p,h); }
  post(p:string,h:Handler<Env>){ return this.on('POST',p,h); }
  put(p:string,h:Handler<Env>){ return this.on('PUT',p,h); }
  delete(p:string,h:Handler<Env>){ return this.on('DELETE',p,h); }
  async handle(req:Request, env:Env, ctx:ExecutionContext):Promise<Response>{
    const url = new URL(req.url); const method=req.method.toUpperCase();
    for(const r of this.routes){
      if(r.method!==method) continue;
      const m = r.pattern.exec(url.pathname);
      if(m){
        const params:Record<string,string> = {};
        r.keys.forEach((k,i)=>params[k]=decodeURIComponent(m[i+1]??''));
        const log = this.baseLogger.child({ path:url.pathname, method });
        try{
          return await r.handler({ env, req, url, params, log, waitUntil:(p)=>ctx.waitUntil(p) });
        }catch(e:any){
          return errorResponse(e, log);
        }
      }
    }
    return json({ error:'Not Found' },404);
  }
}
function compilePath(path:string):{regex:RegExp; keys:string[]}{
  const keys:string[]=[];
  const pattern = path.replace(/\/+$/,'').replace(/\/:([^/]+)/g,(_m,key)=>{
    keys.push(key); return '/([^/]+)';
  });
  const regex = new RegExp(`^${pattern || '/'}\/?$`);
  return { regex, keys };
}
export function json(data:any,status=200,init:ResponseInit={}){
  return new Response(JSON.stringify(data), {
    status,
    headers:{ 'content-type':'application/json; charset=utf-8', ...init.headers },
    ...init
  });
}
export async function readJson<T=any>(req:Request):Promise<T>{ return await req.json(); }
function errorResponse(e:any, log:ReturnType<typeof createLogger>){
  if(isAppError(e)){
    log.warn('app_error',{ kind:e.kind, status:e.status, details:e.details });
    return json({ error:e.kind, message:e.message, details:e.details }, e.status);
  }
  log.error('unhandled_error',{ message:e?.message, stack:e?.stack });
  return json({ error:'INTERNAL', message:'Internal Server Error' },500);
}
