#!/usr/bin/env node

// Test script to validate score saving functionality
async function testScoreFunctionality() {
  const baseUrl = 'http://localhost:5001';
  const matchId = 3;
  
  console.log('Testing score functionality for match', matchId);
  
  // 1. Get initial scores
  console.log('\n1. Getting initial scores...');
  let response = await fetch(`${baseUrl}/api/scores?matchId=${matchId}`);
  let initialScores = await response.json();
  console.log('Initial scores:', initialScores);
  
  // 2. Add a new score
  console.log('\n2. Adding new score for hole 3...');
  const newScore = {
    matchId: matchId,
    holeNumber: 3,
    aviatorScore: 6,
    producerScore: 5
  };
  
  response = await fetch(`${baseUrl}/api/scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newScore)
  });
  
  if (!response.ok) {
    console.error('Failed to create score:', response.status, response.statusText);
    return;
  }
  
  let createdScores = await response.json();
  console.log('Scores after creation:', createdScores);
  
  // 3. Verify the score was saved
  console.log('\n3. Verifying score was saved...');
  response = await fetch(`${baseUrl}/api/scores?matchId=${matchId}`);
  let finalScores = await response.json();
  console.log('Final scores:', finalScores);
  
  // Check if our new score exists
  const newScoreExists = finalScores.some(score => 
    score.holeNumber === 3 && 
    score.aviatorScore === 6 && 
    score.producerScore === 5
  );
  
  console.log('\n4. Test result:');
  if (newScoreExists) {
    console.log('✅ SUCCESS: Score was saved correctly!');
  } else {
    console.log('❌ FAILED: Score was not saved correctly!');
  }
  
  // 5. Test updating an existing score
  console.log('\n5. Testing score update...');
  const existingScore = finalScores.find(score => score.holeNumber === 3);
  if (existingScore) {
    const updateData = {
      matchId: matchId,
      holeNumber: 3,
      aviatorScore: 7, // Changed from 6 to 7
      producerScore: 4  // Changed from 5 to 4
    };
    
    response = await fetch(`${baseUrl}/api/scores/${existingScore.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      console.error('Failed to update score:', response.status, response.statusText);
    } else {
      console.log('Score updated successfully');
      
      // Verify update
      response = await fetch(`${baseUrl}/api/scores?matchId=${matchId}`);
      let updatedScores = await response.json();
      const updatedScore = updatedScores.find(score => score.holeNumber === 3);
      
      if (updatedScore && updatedScore.aviatorScore === 7 && updatedScore.producerScore === 4) {
        console.log('✅ SUCCESS: Score update worked correctly!');
      } else {
        console.log('❌ FAILED: Score update did not work correctly!');
        console.log('Expected: aviatorScore=7, producerScore=4');
        console.log('Actual:', updatedScore);
      }
    }
  }
  
  console.log('\nTest completed!');
}

// Run the test
testScoreFunctionality().catch(console.error);
