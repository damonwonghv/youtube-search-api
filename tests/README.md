# YouTube Search API Test Documentation

This directory contains the complete test suite for the YouTube Search API, including unit tests and integration tests.

## Test Structure

```
tests/
├── setup.ts                    # Test environment setup
├── unit/                       # Unit tests
│   ├── VideoRender.test.ts     # Video renderer tests
│   ├── compactVideoRenderer.test.ts  # Compact video renderer tests
│   └── types.test.ts           # Type definition tests
└── integration/                # Integration tests
    ├── GetListByKeyword.test.ts    # Keyword search tests
    ├── GetVideoDetails.test.ts     # Video details tests
    ├── GetPlaylistData.test.ts     # Playlist data tests
    └── GetShortVideo.test.ts       # Shorts video tests
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Specific Test Types

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run tests with file watching
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

### Unit Tests

- **VideoRender**: Tests video data parsing logic
- **compactVideoRenderer**: Tests compact video renderer logic
- **Type Definitions**: Validates correctness of all interfaces and type definitions

### Integration Tests

- **GetListByKeyword**: Tests keyword search functionality
- **GetVideoDetails**: Tests video details retrieval
- **GetPlaylistData**: Tests playlist data retrieval
- **GetShortVideo**: Tests Shorts video retrieval

## Test Features

### 1. Mock Network Requests

Uses the `nock` library to mock HTTP requests, avoiding actual YouTube API calls during testing.

### 2. Error Handling Tests

Each test includes error scenario handling to ensure the API responds correctly when encountering issues.

### 3. Type Safety

All tests use TypeScript to ensure correctness of type definitions.

### 4. Chinese Test Cases

All test cases use Chinese descriptions to meet project requirements.

## Test Case Descriptions

### Unit Test Cases

#### VideoRender.test.ts

- Correctly parses video renderer data
- Identifies live videos
- Handles missing optional fields
- Handles playlist video renderers
- Handles invalid input data
- Handles live indicators in thumbnail overlays

#### compactVideoRenderer.test.ts

- Correctly parses compact video renderer data
- Identifies live compact videos
- Handles videos missing length text
- Handles complex thumbnail arrays
- Handles multiple badges
- Handles invalid badge data

#### types.test.ts

- Validates all interface definitions
- Tests type compatibility
- Ensures optional properties are handled correctly

### Integration Test Cases

#### GetListByKeyword.test.ts

- Successfully searches for videos and returns results
- Handles video search options
- Handles channel search options
- Handles playlist search options
- Handles result count limits
- Handles network errors
- Handles invalid YouTube responses
- Handles live video identification

#### GetVideoDetails.test.ts

- Successfully retrieves video details
- Correctly identifies live videos
- Handles missing author information
- Handles multiple suggested videos
- Handles network errors
- Handles invalid video page responses
- Handles missing player responses

#### GetPlaylistData.test.ts

- Successfully retrieves playlist data
- Handles result count limits
- Handles empty playlists
- Handles live videos in playlists
- Handles network errors
- Handles invalid playlist responses
- Handles invalid playlist structures

#### GetShortVideo.test.ts

- Successfully retrieves Shorts videos
- Handles empty Shorts results
- Handles Shorts missing inlinePlaybackEndpoint
- Handles complex thumbnail structures
- Filters non-Shorts content
- Handles network errors
- Handles invalid YouTube responses
- Handles missing Shorts sections

## Test Configuration

### Jest Configuration (jest.config.js)

- Uses `ts-jest` preset to support TypeScript
- Sets test timeout to 30 seconds
- Configures coverage reporting
- Sets test file patterns

### Test Environment Setup (setup.ts)

- Uses `nock` to mock network requests
- Sets global test timeout
- Handles console.error output

## Continuous Integration

These tests can be easily integrated into CI/CD workflows:

```yaml
# GitHub Actions Example
- name: Run tests
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Maintenance Guide

### Adding Tests

1. Create new test files in the appropriate directory
2. Use descriptive test case names
3. Ensure tests cover both normal and error scenarios
4. Update this documentation to reflect new tests

### Updating Tests

When API functionality changes:

1. Update relevant test cases
2. Ensure all tests still pass
3. Update mock data to reflect new API response formats

### Testing Best Practices

- Each test should focus on a single functionality
- Use descriptive test names
- Ensure tests are independent and don't rely on other tests
- Appropriately use `beforeEach` and `afterEach` to clean up test state
