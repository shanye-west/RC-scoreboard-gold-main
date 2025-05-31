/**
 * Test script to verify match status calculation functionality
 */

const API_BASE = 'http://localhost:5001/api';

async function testMatchStatusCalculation() {
  console.log('🧪 Testing match status calculation functionality...\n');

  try {
    // 1. Get match 4 data
    console.log('📋 Fetching match data...');
    const matchResponse = await fetch(`${API_BASE}/matches/4`);
    const match = await matchResponse.json();
    console.log(`✅ Match: ${match.name} (ID: ${match.id})`);

    // 2. Get match participants
    console.log('\n👥 Fetching match participants...');
    const participantsResponse = await fetch(`${API_BASE}/match-players?matchId=${match.id}`);
    const participants = await participantsResponse.json();
    console.log(`✅ Found ${participants.length} participants`);

    // 3. Get existing player scores
    console.log('\n📊 Fetching player scores...');
    const scoresResponse = await fetch(`${API_BASE}/player-scores?matchId=${match.id}`);
    const playerScores = await scoresResponse.json();
    console.log(`📊 Found ${playerScores.length} player scores`);

    // 4. Simulate match status calculation for hole 1
    if (playerScores.length > 0) {
      console.log('\n🎯 Simulating match status calculation for hole 1...');
      
      // Group scores by team
      const aviatorScores = [];
      const producerScores = [];
      
      playerScores.forEach(score => {
        if (score.holeNumber === 1 && score.score !== null) {
          const participant = participants.find(p => p.playerId === score.playerId);
          if (participant) {
            const netScore = score.score; // Simplified for testing
            if (participant.team === 'aviators') {
              aviatorScores.push(netScore);
            } else if (participant.team === 'producers') {
              producerScores.push(netScore);
            }
          }
        }
      });
      
      console.log(`Aviator scores for hole 1: [${aviatorScores.join(', ')}]`);
      console.log(`Producer scores for hole 1: [${producerScores.join(', ')}]`);
      
      // Calculate best ball scores
      const aviatorBest = aviatorScores.length > 0 ? Math.min(...aviatorScores) : null;
      const producerBest = producerScores.length > 0 ? Math.min(...producerScores) : null;
      
      console.log(`\n🏆 Best ball scores for hole 1:`);
      console.log(`Aviators: ${aviatorBest}`);
      console.log(`Producers: ${producerBest}`);
      
      // Calculate match status
      if (aviatorBest !== null && producerBest !== null) {
        let matchStatus;
        if (aviatorBest < producerBest) {
          matchStatus = "A1 (Aviators up 1)";
        } else if (producerBest < aviatorBest) {
          matchStatus = "P1 (Producers up 1)";
        } else {
          matchStatus = "AS (All Square)";
        }
        console.log(`\n📊 Match status after hole 1: ${matchStatus}`);
      } else {
        console.log(`\n📊 Match status: Hole not completed`);
      }
    }

    console.log('\n✅ Match status calculation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMatchStatusCalculation();
