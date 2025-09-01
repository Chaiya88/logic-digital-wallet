
// Integration functions for inter-worker communication
async function callBankingWorker(endpoint, data, env) {
  try {
    const response = await fetch(`${env.BANKING_WORKER_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify(data)
    });
ECHO is off.
    return await response.json();
  } catch (error) {
    console.error('Banking Worker call failed:', error);
    return { error: 'Banking service unavailable' };
  }
}

async function callSecurityWorker(endpoint, data, env) {
  try {
    const response = await fetch(`${env.SECURITY_WORKER_URL}${endpoint}`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API': env.INTERNAL_API_KEY
      },
      body: JSON.stringify(data)
    });
ECHO is off.
    return await response.json();
  } catch (error) {
    console.error('Security Worker call failed:', error);
    return { error: 'Security service unavailable' };
  }
}

// Test endpoints for integration testing
async function handleBankingIntegrationTest(request, env, corsHeaders) {
  const testData = {
    test_type: 'integration_test',
    timestamp: new Date().toISOString(),
    source: 'main_api'
  };
ECHO is off.
  const result = await callBankingWorker('/test/ping', testData, env);
ECHO is off.
  return new Response(JSON.stringify({
    integration_test: 'banking_worker',
    result: result,
    status: result.error ? 'failed' : 'success'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function handleSecurityIntegrationTest(request, env, corsHeaders) {
  const testData = {
    test_type: 'integration_test',
    timestamp: new Date().toISOString(),
    source: 'main_api'
  };
ECHO is off.
  const result = await callSecurityWorker('/test/ping', testData, env);
ECHO is off.
  return new Response(JSON.stringify({
    integration_test: 'security_worker',
    result: result,
    status: result.error ? 'failed' : 'success'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
