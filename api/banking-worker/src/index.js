export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Internal-API',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }
    
    // Authentication check
    const apiKey = request.headers.get('X-Internal-API');
    if (apiKey !== env.INTERNAL_API_KEY) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Invalid or missing internal API key',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    try {
      switch (url.pathname) {
        case '/':
          return new Response(JSON.stringify({
            service: 'Security Worker',
            version: '1.0.0',
            status: 'operational',
            environment: env.ENVIRONMENT || 'production',
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        case '/health':
          return new Response(JSON.stringify({
            status: 'healthy',
            service: 'Security Worker',
            timestamp: new Date().toISOString(),
            security_systems: 'operational'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        case '/api/analyze':
          return new Response(JSON.stringify({
            service: 'Security Analysis',
            status: 'ready',
            message: 'Security analysis endpoint operational',
            timestamp: new Date().toISOString()
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
          
        default:
          return new Response(JSON.stringify({
            error: 'Not Found',
            service: 'Security Worker',
            available_endpoints: ['/', '/health', '/api/analyze']
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