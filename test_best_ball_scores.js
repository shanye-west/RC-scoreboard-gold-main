/**
 * Test script to verify TwoManTeamBestBallScorecard score saving functionality
 */

const API_BASE = 'http://localhost:5001/api';

async function testBestBallScoreSaving() {
  console.log('🧪 Testing TwoManTeamBestBallScorecard score saving...\n');

  try {
    // 1. First, get all matches to find a best ball match
    console.log('📋 Fetching matches...');
    const matchesResponse = await fetch(`${API_BASE}/matches`, { 
      timeout: 5000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!matchesResponse.ok) {
      throw new Error(`HTTP ${matchesResponse.status}: ${matchesResponse.statusText}`);
    }
    
    const matches = await matchesResponse.json();
    
    const bestBallMatch = matches.find(match => 
      match.matchType && match.matchType.toLowerCase().includes('best ball')
    );
    
    if (!bestBallMatch) {
      console.log('❌ No best ball match found. Creating test scenario...');
      return;
    }
    
    console.log(`✅ Found best ball match: ${bestBallMatch.name} (ID: ${bestBallMatch.id})`);
    
    // 2. Get match participants
    console.log('\n👥 Fetching match participants...');
    const participantsResponse = await fetch(`${API_BASE}/match-players?matchId=${bestBallMatch.id}`);
    const participants = await participantsResponse.json();
    console.log(`✅ Found ${participants.length} participants`);
    
    // 3. Get existing scores before testing
    console.log('\n📊 Fetching existing scores...');
    const scoresResponse = await fetch(`${API_BASE}/scores?matchId=${bestBallMatch.id}`);
    const existingScores = await scoresResponse.json();
    console.log(`📊 Found ${existingScores.length} existing team scores`);
    
    // 4. Get best ball player scores
    const bestBallResponse = await fetch(`${API_BASE}/best-ball-scores/${bestBallMatch.id}`);
    const bestBallScores = await bestBallResponse.json();
    console.log(`🎯 Found ${bestBallScores.length} existing best ball player scores`);
    
    // 5. Test score saving by simulating what TwoManTeamBestBallScorecard does
    if (participants.length >= 2) {
      const testPlayerId = participants[0].playerId;
      const testHole = 1;
      const testScore = 4;
      
      console.log(`\n🧪 Testing score save for Player ${testPlayerId}, Hole ${testHole}, Score ${testScore}`);
      
      // Save a test score to best_ball_player_scores table
      const saveResponse = await fetch(`${API_BASE}/best-ball-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          matchId: bestBallMatch.id,
          playerId: testPlayerId,
          holeNumber: testHole,
          score: testScore,
          handicapStrokes: 0,
          netScore: testScore
        })
      });
      
      if (saveResponse.ok) {
        console.log('✅ Best ball score saved successfully!');
        
        // Verify the save by fetching the scores again
        const verifyResponse = await fetch(`${API_BASE}/best-ball-scores/${bestBallMatch.id}`);
        const updatedBestBallScores = await verifyResponse.json();
        
        const savedScore = updatedBestBallScores.find(score => 
          score.playerId === testPlayerId && score.holeNumber === testHole
        );
        
        if (savedScore) {
          console.log('✅ Score successfully persisted to database');
          console.log(`   Player: ${testPlayerId}, Hole: ${testHole}, Score: ${savedScore.score}`);
        } else {
          console.log('❌ Score not found in database after save');
        }
      } else {
        console.log('❌ Failed to save best ball score');
        console.log('Response:', await saveResponse.text());
      }
    }
    
    console.log('\n🎯 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBestBallScoreSaving();
