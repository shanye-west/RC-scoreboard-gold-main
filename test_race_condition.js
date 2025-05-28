// Test script to reproduce primary key constraint violations with race conditions
async function testRaceCondition() {
  const baseUrl = 'http://localhost:5001';
  const matchId = 3;
  const holeNumber = 10; // Use a hole that doesn't exist yet
  
  console.log('Testing race condition for constraint violations...');
  
  // Create multiple concurrent requests to the same hole
  const promises = [];
  for (let i = 0; i < 5; i++) {
    const scoreData = {
      matchId: matchId,
      holeNumber: holeNumber,
      aviatorScore: 4 + i,
      producerScore: 3 + i
    };
    
    const promise = fetch(`${baseUrl}/api/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(scoreData)
    }).then(async response => {
      const result = await response.text();
      return {
        status: response.status,
        ok: response.ok,
        body: result,
        request: i
      };
    }).catch(error => ({
      error: error.message,
      request: i
    }));
    
    promises.push(promise);
  }
  
  console.log('Sending 5 concurrent requests to create score for hole', holeNumber);
  
  try {
    console.log('Waiting for responses...');
    const results = await Promise.all(promises);
    console.log('All responses received');
    
    console.log('\nResults:');
    results.forEach((result, index) => {
      console.log(`Request ${index}:`, result.ok ? 'SUCCESS' : 'FAILED', 
                  result.status || 'ERROR', 
                  result.error || (result.body.length > 100 ? result.body.substring(0, 100) + '...' : result.body));
    });
    
    // Check how many succeeded
    const successes = results.filter(r => r.ok).length;
    const failures = results.filter(r => !r.ok).length;
    
    console.log(`\nSummary: ${successes} succeeded, ${failures} failed`);
    
    if (failures > 0) {
      console.log('✅ Race condition reproduced - some requests failed as expected');
      
      // Check for constraint violation errors
      const constraintErrors = results.filter(r => 
        r.body && (r.body.includes('constraint') || r.body.includes('duplicate') || r.body.includes('unique'))
      );
      
      if (constraintErrors.length > 0) {
        console.log('🔍 Found constraint violation errors:');
        constraintErrors.forEach((error, index) => {
          console.log(`  Error ${index}:`, error.body.substring(0, 200));
        });
      }
    } else {
      console.log('⚠️  All requests succeeded - race condition not reproduced');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testRaceCondition();
