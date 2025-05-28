/**
 * Test TwoManTeamBestBallScorecard workflow simulation
 */

async function testBestBallWorkflow() {
  console.log('🧪 Testing TwoManTeamBestBallScorecard workflow...\n');

  try {
    const API_BASE = 'http://localhost:5001/api';
    const matchId = 3;
    
    // Simulate the data structure that TwoManTeamBestBallScorecard sends to debouncedSaveBestBallScores
    const playerScores = [
      {
        playerId: 1,
        playerName: "Player 1",
        teamId: 1, // Aviators
        scores: [4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        netScores: [4, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        isBestBall: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        handicapStrokes: Array(18).fill(0)
      },
      {
        playerId: 2,
        playerName: "Player 2", 
        teamId: 1, // Aviators
        scores: [5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        netScores: [5, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        isBestBall: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        handicapStrokes: Array(18).fill(0)
      },
      {
        playerId: 3,
        playerName: "Player 3",
        teamId: 2, // Producers  
        scores: [3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        netScores: [3, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        isBestBall: [true, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        handicapStrokes: Array(18).fill(0)
      },
      {
        playerId: 4,
        playerName: "Player 4",
        teamId: 2, // Producers
        scores: [6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        netScores: [6, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        isBestBall: [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false],
        handicapStrokes: Array(18).fill(0)
      }
    ];

    console.log('📊 Simulating player scores:');
    console.log('Aviators: Player 1 (4), Player 2 (5) → Best ball: 4');
    console.log('Producers: Player 3 (3), Player 4 (6) → Best ball: 3\n');

    // Simulate debouncedSaveBestBallScores logic
    const aviatorTeamId = 1;
    const producerTeamId = 2;
    
    const aviatorPlayers = playerScores.filter(p => p.teamId === aviatorTeamId);
    const producerPlayers = playerScores.filter(p => p.teamId === producerTeamId);
    
    const holeIndex = 0;
    const aviatorNetScores = aviatorPlayers
      .map(p => p.netScores[holeIndex])
      .filter(score => score !== null && score !== undefined);
    
    const producerNetScores = producerPlayers  
      .map(p => p.netScores[holeIndex])
      .filter(score => score !== null && score !== undefined);
    
    const aviatorBestScore = aviatorNetScores.length > 0 ? Math.min(...aviatorNetScores) : null;
    const producerBestScore = producerNetScores.length > 0 ? Math.min(...producerNetScores) : null;
    
    console.log(`🎯 Calculated best scores for hole 1:`);
    console.log(`   Aviators: ${aviatorBestScore}`);
    console.log(`   Producers: ${producerBestScore}`);
    
    // Save team score
    if (aviatorBestScore !== null || producerBestScore !== null) {
      const scoreData = {
        matchId: matchId,
        holeNumber: 1,
        aviatorScore: aviatorBestScore,
        producerScore: producerBestScore,
      };
      
      console.log('\n💾 Saving team score:', scoreData);
      
      const response = await fetch(`${API_BASE}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreData)
      });
      
      if (response.ok) {
        const savedScore = await response.json();
        console.log('✅ Team score saved successfully!', savedScore);
        
        // Verify
        const verifyResponse = await fetch(`${API_BASE}/scores?matchId=${matchId}`);
        const teamScores = await verifyResponse.json();
        console.log('📊 All team scores:', teamScores);
        
        const hole1Score = teamScores.find(score => score.holeNumber === 1);
        if (hole1Score) {
          console.log('✅ SUCCESS! Hole 1 team scores saved correctly');
          console.log(`   Aviators: ${hole1Score.aviatorScore}, Producers: ${hole1Score.producerScore}`);
        }
      } else {
        console.log('❌ Failed to save team score:', await response.text());
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBestBallWorkflow();
