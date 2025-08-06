const { GetVideoDetails, ErrorHandler, ErrorCodes, YouTubeAPIError } = require('../dist/index');

// Test English error messages
async function testEnglishErrorMessages() {
  console.log('=== Testing English Error Messages ===\n');

  // Test 1: Invalid video ID
  console.log('1. Testing invalid video ID error:');
  try {
    await GetVideoDetails('invalid_video_id_12345');
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`   Error Code: ${error.code}`);
      console.log(`   Error Message: ${error.message}`);
      console.log(`   Status Code: ${error.statusCode || 'N/A'}`);
    }
  }

  // Test 2: Custom error creation
  console.log('\n2. Testing custom error creation:');
  const errorHandler = ErrorHandler.getInstance();
  const customError = errorHandler.createError(
    'This is a custom error message',
    ErrorCodes.INVALID_VIDEO_ID,
    400
  );
  console.log(`   Custom Error Code: ${customError.code}`);
  console.log(`   Custom Error Message: ${customError.message}`);
  console.log(`   Custom Status Code: ${customError.statusCode}`);

  // Test 3: Error message format
  console.log('\n3. Testing error message format:');
  const testError = new Error('Test error');
  try {
    errorHandler.handleError(testError, 'Test context', ErrorCodes.NETWORK_ERROR);
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`   Formatted Error: ${error.message}`);
      console.log(`   Contains context: ${error.message.includes('Test context')}`);
    }
  }

  // Test 4: All error codes
  console.log('\n4. Testing all error codes:');
  const allErrorCodes = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.INIT_DATA_ERROR,
    ErrorCodes.PLAYER_DATA_ERROR,
    ErrorCodes.INVALID_PLAYLIST,
    ErrorCodes.INVALID_VIDEO_ID,
    ErrorCodes.INVALID_CHANNEL_ID,
    ErrorCodes.RATE_LIMIT_ERROR,
    ErrorCodes.PARSE_ERROR,
    ErrorCodes.UNKNOWN_ERROR
  ];

  allErrorCodes.forEach((code, index) => {
    const testError = errorHandler.createError(
      `Test error ${index + 1}`,
      code,
      500
    );
    console.log(`   ${code}: ${testError.message}`);
  });

  console.log('\n=== English Error Messages Test Complete ===');
}

// Run the test
testEnglishErrorMessages().catch(console.error); 