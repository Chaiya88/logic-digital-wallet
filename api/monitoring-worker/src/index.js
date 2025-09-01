export default {
  async scheduled(event, env, ctx) {
    await performHealthChecks(env);
  },
ECHO is off.
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
ECHO is off.
    switch (url.pathname) {
      case '/monitoring/status':
        return await getMonitoringStatus(env);
      case '/monitoring/metrics':
        return await getSystemMetrics(env);
      case '/monitoring/alerts':
        return await getActiveAlerts(env);
      default:
        return new Response('Wallet Monitoring Worker', { status: 200 });
    }
  }
};

async function performHealthChecks(env) {
  const timestamp = new Date().toISOString();
  const healthResults = {};
ECHO is off.
  // Check Main API
  try {
    const mainResponse = await fetch(`${env.MAIN_API_URL}/health`);
    const mainHealth = await mainResponse.json();
    healthResults.main_api = {
      status: mainResponse.ok ? 'healthy' : 'unhealthy',
      response_time: Date.now() - Date.now(),
      database_latency: mainHealth.database?.latency_ms
    };
  } catch (error) {
    healthResults.main_api = { status: 'error', error: error.message };
  }
ECHO is off.
  // Check Banking Worker
  try {
    const bankingResponse = await fetch(`${env.BANKING_API_URL}/health`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    healthResults.banking_worker = {
      status: bankingResponse.ok ? 'healthy' : 'unhealthy',
      response_time: Date.now() - Date.now()
    };
  } catch (error) {
    healthResults.banking_worker = { status: 'error', error: error.message };
  }
ECHO is off.
  // Check Security Worker
  try {
    const securityResponse = await fetch(`${env.SECURITY_API_URL}/health`, {
      headers: { 'X-Internal-API': env.INTERNAL_API_KEY }
    });
    healthResults.security_worker = {
      status: securityResponse.ok ? 'healthy' : 'unhealthy',
      response_time: Date.now() - Date.now()
    };
  } catch (error) {
    healthResults.security_worker = { status: 'error', error: error.message };
  }
ECHO is off.
  // Store monitoring data
  await env.MONITORING_DATA.put(
    `health_check_${Date.now()}`,
    JSON.stringify({ timestamp, results: healthResults }),
    { expirationTtl: 86400 * 7 }
  );
ECHO is off.
  // Check for alerts
  await checkForAlerts(healthResults, env);
}

async function getMonitoringStatus(env) {
  const latest = await env.MONITORING_DATA.list({ prefix: 'health_check_', limit: 1 });
ECHO is off.
  if (latest.keys.length === 0) {
    return new Response(JSON.stringify({ status: 'no_data' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
ECHO is off.
  const latestData = await env.MONITORING_DATA.get(latest.keys[0].name);
  return new Response(latestData, {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function checkForAlerts(healthResults, env) {
  for (const [service, health] of Object.entries(healthResults)) {
    if (health.status == 'healthy') {
      await createAlert(service, health, env);
    }
  }
}

async function createAlert(service, healthData, env) {
  const alert = {
    id: `alert_${Date.now()}`,
    service,
    severity: healthData.status === 'error' ? 'critical' : 'warning',
    message: `${service} health check failed`,
    details: healthData,
    created_at: new Date().toISOString(),
    resolved: false
  };
ECHO is off.
  await env.MONITORING_DATA.put(
    alert.id,
    JSON.stringify(alert),
    { expirationTtl: 86400 * 30 }
  );
}
