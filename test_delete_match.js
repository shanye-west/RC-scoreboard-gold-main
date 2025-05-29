// Test script to verify delete match functionality
const API_BASE = 'http://localhost:5001';

async function testDeleteMatch() {
  console.log('🧪 Testing delete match functionality...\n');

  try {
    // First, let's get all matches to see which ones exist
    console.log('📋 Fetching all matches...');
    const matchesResponse = await fetch(`${API_BASE}/api/matches`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!matchesResponse.ok) {
      throw new Error(`HTTP ${matchesResponse.status}: ${matchesResponse.statusText}`);
    }
    
    const matches = await matchesResponse.json();
    console.log(`✅ Found ${matches.length} matches`);
    
    // Find a 2-man Team Best Ball match
    const bestBallMatch = matches.find(match => 
      match.matchType && match.matchType.toLowerCase().includes('best ball')
    );
    
    if (!bestBallMatch) {
      console.log('❌ No best ball match found to test deletion');
      return;
    }
    
    console.log(`✅ Found best ball match to test: ${bestBallMatch.name} (ID: ${bestBallMatch.id})`);
    
    // Check if match has best_ball_player_scores
    console.log('\n📊 Checking for best ball player scores...');
    const scoresResponse = await fetch(`${API_BASE}/api/best-ball-scores?matchId=${bestBallMatch.id}`, {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (scoresResponse.ok) {
      const scores = await scoresResponse.json();
      console.log(`✅ Found ${scores.length} best ball player scores for this match`);
    } else {
      console.log('ℹ️  No best ball player scores found (or endpoint not available)');
    }
    
    // Now try to delete the match
    console.log(`\n🗑️  Attempting to delete match ${bestBallMatch.id}...`);
    const deleteResponse = await fetch(`${API_BASE}/api/matches/${bestBallMatch.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    });
    
    if (deleteResponse.ok) {
      console.log('✅ SUCCESS: Match deleted successfully!');
      console.log('✅ Foreign key constraint issue has been resolved');
    } else {
      const error = await deleteResponse.text();
      console.log(`❌ FAILED: Delete failed with status ${deleteResponse.status}`);
      console.log(`Error details: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
  
  console.log('\n🧪 Delete match test completed!');
}

// Run the test
testDeleteMatch().catch(console.error);
