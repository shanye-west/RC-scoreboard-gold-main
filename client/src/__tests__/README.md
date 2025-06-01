# Testing Setup for TwoManTeamBestBallScorecard

## Overview
This directory contains unit tests for the refactored TwoManTeamBestBallScorecard component and its associated custom hook.

## Test Files

### 1. `useBestBallScorecardLogic.test.ts`
Tests for the custom hook that handles all business logic:
- **Initialization**: Proper setup of player scores and team separation
- **Score Management**: Score updates, calculations, and persistence
- **Team Best Ball Logic**: Correct calculation of team best scores
- **Match Status**: Accurate match progression and result tracking
- **Helper Functions**: Handicap calculations and score validation

### 2. `TwoManTeamBestBallScorecard.test.tsx`
Tests for the React component UI and interactions:
- **Rendering**: Proper display of scorecard table, players, and holes
- **Interactivity**: Score input handling and state updates
- **Accessibility**: ARIA attributes and semantic HTML structure
- **Responsive Design**: CSS classes and layout structure

## Running the Tests

### Setup Test Environment (if not already configured)

1. **Install test dependencies:**
```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom
```

2. **Add test scripts to package.json:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

3. **Create vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

4. **Create test setup file (src/test-setup.ts):**
```typescript
import '@testing-library/jest-dom'
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- useBestBallScorecardLogic.test.ts
```

## Test Coverage Areas

### Custom Hook Tests (`useBestBallScorecardLogic.test.ts`)
- ✅ Player score initialization and updates
- ✅ Team separation (Aviator vs Producer)
- ✅ Gross and net score calculations
- ✅ Handicap stroke allocation
- ✅ Team best ball scoring logic
- ✅ Match status and progression tracking
- ✅ Total score calculations
- ✅ Helper function validation

### Component Tests (`TwoManTeamBestBallScorecard.test.tsx`)
- ✅ Table structure and accessibility
- ✅ Player and hole information display
- ✅ Score input interactions
- ✅ Locked/unlocked state handling
- ✅ Team color and styling application
- ✅ Responsive design classes
- ✅ Match status display

## Mock Data Structure

The tests use standardized mock data that matches the production interfaces:

```typescript
// Mock holes data
const mockHoles = [
  { id: 1, hole_number: 1, par: 4, handicap: 10 },
  { id: 2, hole_number: 2, par: 3, handicap: 18 },
  { id: 3, hole_number: 3, par: 5, handicap: 2 }
];

// Mock players data
const mockPlayers = [
  { id: 1, name: 'John Doe', team: 'aviator', courseHandicap: 10 },
  { id: 2, name: 'Jane Smith', team: 'aviator', courseHandicap: 8 },
  { id: 3, name: 'Bob Wilson', team: 'producer', courseHandicap: 12 },
  { id: 4, name: 'Alice Brown', team: 'producer', courseHandicap: 6 }
];
```

## Testing Best Practices Followed

### 1. Comprehensive Coverage
- **Unit tests** for individual functions and calculations
- **Integration tests** for component interactions
- **Accessibility tests** for proper ARIA attributes
- **Responsive design tests** for CSS class application

### 2. Realistic Test Scenarios
- **Real golf scoring scenarios** with proper handicap calculations
- **Team competition logic** with match play rules
- **User interaction patterns** for score input and editing
- **Edge cases** like tied scores and incomplete rounds

### 3. Maintainable Test Code
- **Descriptive test names** that explain the expected behavior
- **Organized test structure** with proper grouping and setup
- **Reusable mock data** that can be easily updated
- **Clear assertions** that make failures easy to debug

## Future Test Enhancements

### Additional Test Coverage
1. **Integration tests** with real API calls
2. **End-to-end tests** for complete user workflows
3. **Performance tests** for large datasets
4. **Visual regression tests** for UI consistency

### Advanced Testing Scenarios
1. **Multi-user concurrent editing** tests
2. **Network failure handling** tests
3. **Browser compatibility** tests
4. **Mobile device interaction** tests

## Contributing to Tests

When adding new features or modifying existing functionality:

1. **Add corresponding tests** for new business logic
2. **Update existing tests** when changing behavior
3. **Maintain test coverage** above 80% for critical paths
4. **Follow naming conventions** for consistency
5. **Include edge case testing** for robust validation

## Debugging Tests

### Common Issues and Solutions

1. **Mock not working**: Ensure mocks are properly scoped and cleared between tests
2. **Async operations**: Use `await` and `waitFor` for asynchronous state updates
3. **Component not rendering**: Check that all required props are provided
4. **Tests timing out**: Verify that all promises are resolved properly

### Useful Debug Commands

```bash
# Run single test with verbose output
npm test -- --reporter=verbose useBestBallScorecardLogic.test.ts

# Debug specific test case
npm test -- --grep "should calculate team best ball score"

# Run tests with browser debugging
npm test -- --inspect-brk
```
