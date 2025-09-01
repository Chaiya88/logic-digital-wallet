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
          
        case '/api/info':
          return await handleAPIInfo(env, corsHeaders);
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            service: 'Digital Wallet API',
            endpoints: ['/health', '/api/status', '/internal/audit', '/api/info'],
            documentation: 'Available endpoints with their descriptions'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        timestamp: new Date().toISOString()
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
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token required'
    }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const token = authHeader.substring(7);
  if (token !== env.AUDIT_SHARED_KEY) {
    return new Response(JSON.stringify({ 
      error: 'Forbidden',
      message: 'Invalid audit shared key'
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
  
  const body = await request.json();
  const { event_type, user, metadata } = body;
  
  if (!event_type || !user) {
    return new Response(JSON.stringify({ 
      error: 'Missing required fields',
      required: ['event_type', 'user'],
      optional: ['metadata']
    }), {
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
  
  try {
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
      audit_id: auditRecord.id,
      timestamp: auditRecord.timestamp,
      message: 'Audit event recorded successfully'
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (dbError) {
    return new Response(JSON.stringify({
      error: 'Database Error',
      message: 'Failed to record audit event',
      details: dbError.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleHealthCheck(env, corsHeaders) {
  try {
    let dbStatus = 'unknown';
    let dbLatency = null;
    
    if (env.DATABASE) {
      const startTime = Date.now();
      const stmt = env.DATABASE.prepare('SELECT 1 as test');
      await stmt.first();
      dbLatency = Date.now() - startTime;
      dbStatus = 'connected';
    }
    
    const healthData = {
      status: 'healthy',
      service: 'Digital Wallet API',
      version: '1.0.0',
      database: {
        status: dbStatus,
        latency_ms: dbLatency
      },
      environment: env.ENVIRONMENT || 'production',
      timestamp: new Date().toISOString(),
      uptime: 'Available'
    };
    
    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      service: 'Digital Wallet API',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleStatusCheck(env, corsHeaders) {
  const statusData = {
    status: 'operational',
    service: 'Digital Wallet API',
    version: '1.0.0',
    environment: env.ENVIRONMENT || 'production',
    features: {
      wallet_management: 'enabled',
      transaction_processing: 'enabled',
      audit_logging: 'enabled',
      health_monitoring: 'enabled'
    },
    last_deployment: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(statusData), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleAPIInfo(env, corsHeaders) {
  const apiInfo = {
    service: 'Digital Wallet API',
    version: '1.0.0',
    description: 'Comprehensive digital wallet API with security features',
    endpoints: {
      '/health': {
        method: 'GET',
        description: 'System health check with database connectivity',
        authentication: 'none'
      },
      '/api/status': {
        method: 'GET', 
        description: 'Service operational status and feature availability',
        authentication: 'none'
      },
      '/internal/audit': {
        methods: ['GET', 'POST'],
        description: 'Audit logging for security events',
        authentication: 'Bearer token required',
        note: 'GET shows documentation, POST creates audit logs'
      },
      '/api/info': {
        method: 'GET',
        description: 'API documentation and endpoint information',
        authentication: 'none'
      }
    },
    integration: {
      banking_worker: env.BANKING_WORKER_URL || 'not_configured',
      security_worker: env.SECURITY_WORKER_URL || 'not_configured',
      internal_api_configured: !!env.INTERNAL_API_KEY
    },
    timestamp: new Date().toISOString()
  };
  
  return new Response(JSON.stringify(apiInfo, null, 2), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}