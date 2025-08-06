const {
  GetData,
  GetVideoDetails,
  GetPlaylistData,
  ErrorHandler,
  ErrorCodes,
  YouTubeAPIError,
} = require("../dist/index");

// Set up custom error logger
const errorHandler = ErrorHandler.getInstance();
errorHandler.setErrorLogger((error) => {
  console.log(
    `[${new Date().toISOString()}] Error: ${error.code} - ${error.message}`
  );
  if (error.statusCode) {
    console.log(`Status Code: ${error.statusCode}`);
  }
  if (error.originalError) {
    console.log(`Original Error: ${error.originalError.message}`);
  }
});

async function demonstrateErrorHandling() {
  console.log("=== YouTube API Error Handling Examples ===\n");

  // Example 1: Handle search errors
  console.log("1. Testing search error handling:");
  try {
    await GetData("", false, 10); // Empty keyword
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`  Error Code: ${error.code}`);
      console.log(`  Error Message: ${error.message}`);
    }
  }

  // Example 2: Handle invalid video ID
  console.log("\n2. Testing invalid video ID error handling:");
  try {
    await GetVideoDetails("invalid_video_id_12345");
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`  Error Code: ${error.code}`);
      console.log(`  Error Message: ${error.message}`);
    }
  }

  // Example 3: Handle invalid playlist ID
  console.log("\n3. Testing invalid playlist ID error handling:");
  try {
    await GetPlaylistData("invalid_playlist_id_12345");
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`  Error Code: ${error.code}`);
      console.log(`  Error Message: ${error.message}`);
    }
  }

  // Example 4: Custom error handling
  console.log("\n4. Custom error handling example:");
  try {
    // Simulate a custom error that needs special handling
    const customError = errorHandler.createError(
      "This is a custom error message",
      ErrorCodes.INVALID_VIDEO_ID,
      400
    );
    throw customError;
  } catch (error) {
    if (error instanceof YouTubeAPIError) {
      console.log(`  Custom Error Code: ${error.code}`);
      console.log(`  Custom Error Message: ${error.message}`);
      console.log(`  Status Code: ${error.statusCode}`);

      // Handle different error codes
      switch (error.code) {
        case ErrorCodes.INVALID_VIDEO_ID:
          console.log("  Action: Please check if the video ID is correct");
          break;
        case ErrorCodes.NETWORK_ERROR:
          console.log("  Action: Please check your network connection");
          break;
        case ErrorCodes.RATE_LIMIT_ERROR:
          console.log("  Action: Please try again later");
          break;
        default:
          console.log("  Action: Unknown error, please contact support");
      }
    }
  }

  // Example 5: Batch error handling
  console.log("\n5. Batch error handling example:");
  const testCases = [
    { type: "search", keyword: "test", description: "Normal search" },
    { type: "video", id: "dQw4w9WgXcQ", description: "Valid video ID" },
    { type: "video", id: "invalid_id", description: "Invalid video ID" },
    {
      type: "playlist",
      id: "invalid_playlist",
      description: "Invalid playlist",
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n  Test: ${testCase.description}`);

      switch (testCase.type) {
        case "search":
          await GetData(testCase.keyword, false, 5);
          console.log("  ✓ Search successful");
          break;
        case "video":
          await GetVideoDetails(testCase.id);
          console.log("  ✓ Video details retrieved successfully");
          break;
        case "playlist":
          await GetPlaylistData(testCase.id);
          console.log("  ✓ Playlist retrieved successfully");
          break;
      }
    } catch (error) {
      if (error instanceof YouTubeAPIError) {
        console.log(`  ✗ Error: ${error.code} - ${error.message}`);
      } else {
        console.log(`  ✗ Unknown error: ${error.message}`);
      }
    }
  }
}

// Run the example
demonstrateErrorHandling().catch(console.error);
