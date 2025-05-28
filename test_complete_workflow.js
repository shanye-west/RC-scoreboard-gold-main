const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testCompleteWorkflow() {
    console.log('🧪 Testing Complete Score Workflow...\n');
    
    try {
        // 1. Get match 2 participants (should have players)
        console.log('1. Getting match 2 participants...');
        const participantsResponse = await axios.get(`${BASE_URL}/match-players?matchId=2`);
        console.log(`   Found ${participantsResponse.data.length} participants:`);
        participantsResponse.data.forEach(p => {
            console.log(`   - ${p.name} (Player ID: ${p.player_id}, Team: ${p.team_name})`);
        });
        
        // 2. Check existing scores for match 2
        console.log('\n2. Checking existing scores for match 2...');
        const existingScoresResponse = await axios.get(`${BASE_URL}/scores?matchId=2`);
        console.log(`   Found ${existingScoresResponse.data.length} existing scores:`);
        existingScoresResponse.data.forEach(score => {
            console.log(`   - Player ${score.player_id}, Hole ${score.hole}: ${score.score} strokes`);
        });
        
        // 3. Create new test scores
        console.log('\n3. Creating new test scores...');
        const testScores = [
            { match_id: 2, player_id: 1, hole: 10, score: 4 },
            { match_id: 2, player_id: 2, hole: 10, score: 3 },
            { match_id: 2, player_id: 3, hole: 10, score: 5 },
            { match_id: 2, player_id: 4, hole: 10, score: 4 }
        ];
        
        for (const score of testScores) {
            try {
                const response = await axios.post(`${BASE_URL}/scores`, score);
                console.log(`   ✅ Created score for Player ${score.player_id}, Hole ${score.hole}: ${score.score}`);
            } catch (error) {
                if (error.response?.status === 409) {
                    console.log(`   ⚠️  Score already exists for Player ${score.player_id}, Hole ${score.hole}`);
                } else {
                    console.log(`   ❌ Error creating score: ${error.message}`);
                }
            }
        }
        
        // 4. Update existing scores
        console.log('\n4. Testing score updates...');
        const updatedScoresResponse = await axios.get(`${BASE_URL}/scores?matchId=2`);
        if (updatedScoresResponse.data.length > 0) {
            const scoreToUpdate = updatedScoresResponse.data[0];
            const newScore = scoreToUpdate.score + 1;
            
            try {
                await axios.put(`${BASE_URL}/scores/${scoreToUpdate.id}`, {
                    score: newScore
                });
                console.log(`   ✅ Updated score ID ${scoreToUpdate.id} from ${scoreToUpdate.score} to ${newScore}`);
            } catch (error) {
                console.log(`   ❌ Error updating score: ${error.message}`);
            }
        }
        
        // 5. Verify final state
        console.log('\n5. Verifying final scores...');
        const finalScoresResponse = await axios.get(`${BASE_URL}/scores?matchId=2`);
        console.log(`   Total scores in database: ${finalScoresResponse.data.length}`);
        
        // Group by hole for easier reading
        const scoresByHole = finalScoresResponse.data.reduce((acc, score) => {
            if (!acc[score.hole]) acc[score.hole] = [];
            acc[score.hole].push(score);
            return acc;
        }, {});
        
        Object.keys(scoresByHole).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hole => {
            console.log(`   Hole ${hole}:`);
            scoresByHole[hole].forEach(score => {
                console.log(`     - Player ${score.player_id}: ${score.score} strokes`);
            });
        });
        
        console.log('\n✅ Complete workflow test successful!');
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

testCompleteWorkflow();
