export interface LogMeta { context?: string; [k: string]: any; }
type Level = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<Level, number> = { debug:10, info:20, warn:30, error:40 };
export interface Logger {
  debug(msg: string, meta?: LogMeta): void;
  info(msg: string, meta?: LogMeta): void;
  warn(msg: string, meta?: LogMeta): void;
  error(msg: string, meta?: LogMeta): void;
  child(meta: LogMeta): Logger;
}
export function createLogger(level: Level = 'info', base: LogMeta = {}): Logger {
  function log(l: Level, msg: string, meta?: LogMeta){
    if(LEVEL_ORDER[l] < LEVEL_ORDER[level]) return;
    const payload = { level: l, msg, ts: new Date().toISOString(), ...base, ...meta };
    switch(l){
      case 'debug': console.debug(JSON.stringify(payload)); break;
      case 'info': console.log(JSON.stringify(payload)); break;
      case 'warn': console.warn(JSON.stringify(payload)); break;
      case 'error': console.error(JSON.stringify(payload)); break;
    }
  }
  return {
    debug:(m,meta)=>log('debug',m,meta),
    info:(m,meta)=>log('info',m,meta),
    warn:(m,meta)=>log('warn',m,meta),
    error:(m,meta)=>log('error',m,meta),
    child(meta){ return createLogger(level, { ...base, ...meta }); }
  };
}
