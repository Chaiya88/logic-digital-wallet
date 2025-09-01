export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    try {
      switch (url.pathname) {
        case '/internal/audit':
          if (request.method === 'POST') {
            return await handleAuditLog(request, env, corsHeaders);
          }
          break;
          
        case '/health':
          return await handleHealthCheck(env, corsHeaders);
          
        case '/api/status':
          return await handleStatusCheck(env, corsHeaders);
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            service: 'Digital Wallet API',
            endpoints: ['/health', '/api/status', '/internal/audit']
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function handleAuditLog(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== env.AUDIT_SHARED_KEY) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const { event_type, user, metadata } = body;
  
  if (!event_type || !user) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const auditRecord = {
    id: crypto.randomUUID(),
    event_type,
    user,
    metadata: JSON.stringify(metadata || {}),
    timestamp: new Date().toISOString(),
    ip_address: request.headers.get('CF-Connecting-IP') || 'unknown'
  };
  
  if (env.DATABASE) {
    const stmt = env.DATABASE.prepare(`
      INSERT INTO audit_events (id, event_type, user, metadata, timestamp, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    await stmt.bind(
      auditRecord.id,
      auditRecord.event_type,
      auditRecord.user,
      auditRecord.metadata,
      auditRecord.timestamp,
      auditRecord.ip_address
    ).run();
  }
  
  return new Response(JSON.stringify({
    success: true,
    audit_id: auditRecord.id
  }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleHealthCheck(env, corsHeaders) {
  try {
    let dbStatus = 'unknown';
    if (env.DATABASE) {
      const stmt = env.DATABASE.prepare('SELECT 1 as test');
      await stmt.first();
      dbStatus = 'connected';
    }
    
    return new Response(JSON.stringify({
      status: 'healthy',
      service: 'Digital Wallet API',
      database: dbStatus,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: error.message
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleStatusCheck(env, corsHeaders) {
  return new Response(JSON.stringify({
    status: 'operational',
    service: 'Digital Wallet API',
    timestamp: new Date().toISOString()
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}