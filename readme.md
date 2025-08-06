# Youtube Search API

Youtube Search API is an API for getting Youtube search results.

## Installation

```bash
npm install youtube-search-api
```

## Usage (import)

```node
const youtubesearchapi = require("youtube-search-api");
```

```node
import youtubesearchapi from "youtube-search-api";
```

## GetListByKeywords (Promise)

```node
youtubesearchapi.GetListByKeyword("<keywords>",[playlist boolean],[limit number],[options JSONArray])
```

GetListByKeywords Result

```node
{items:[],nextPage:{nextPageToken:"xxxxxxxx",nextPageContext:{}}}
```

"items" is the array from youtube, "nextPage" needs to pass when going to the next page. If playlist arg is true, will return `type:'playlist'` but the `videos:[]` property will not return the whole videos in the list, need to call `GetPlaylistData` to get real playlist's videos. Item with Video type will return `isLive=[true/false]` to identify live video or not.

Options added, this version only support return result type, e.g. `[{type:'video'}]`.

### Parameters

| Parameter | Type       | Value                                   |
| --------- | ---------- | --------------------------------------- |
| keywords  | String     | up to you                               |
| playlist  | boolean    | true/false                              |
| limit     | number     | integer                                 |
| options   | JSON Array | [{type:"video/channel/playlist/movie"}] |

## NextPage (Promise)

```node
youtubesearchapi.NextPage(<nextPage from GetListByKeywords result>,[playlist boolean],[limit number])
```

NextPage Result

```node
{items:[],nextPage:{nextPageToken:"xxxxxxxx",nextPageContext:{}}}
```

Item with Video type will return `isLive=[true/false]` to identify live video or not.

## Playlist with ID (Promise)

```node
youtubesearchapi.GetPlaylistData(<Playlist Id>,[limit number])
```

Playlist Result

```node
{items:[],metadata:{}}
```

## Get Suggest Data (Promise)

```node
youtubesearchapi.GetSuggestData([limit number])
```

Suggest Data Result

```node
{
  items: [];
}
```

Item with Video type will return `isLive=[true/false]` to identify live video or not.

## Get Channel by channel Id (Promise)

```node
youtubesearchapi.GetChannelById(<channel ID>)
```

Channel Data Results

```node
[[{ title: "[title]", content: [Object] }]];
```

Will return tabs in array format.

## Get Video Details with suggestion

GetVideoDetails

```node
youtubesearchapi.GetVideoDetails(<video ID>)

```

Get Video Details Results

```node
{
  id:"",
  title: "",
  thumbnail:[],
  isLive: [true/false],
  channel: "",
  channelId:"",
  description: "",
  keywords:[],
  suggestion: [
    {id: "",
      type: 'video',
      thumbnail: [],
      title: "",
      channelTitle: "",
      shortBylineText: "",
      length: [Object],
      isLive: [true/false]
    } ...
  ]
}
```

Will return video details in Json format.

## Get Short Video List (Beta)

Only return short video from suggestion.

GetShortVideo

```node
youtubesearchapi.GetShortVideo();
```

Get Short Video List Results

```node
[
  {
    id: "",
    type: "reel",
    thumbnail: {
      url: "",
      width: 405, //only return 405
      height: 720, //only return 720
    },
    title: "",
    inlinePlaybackEndpoint: {}, //may not return all the time
  },
];
```

Will return Short Video list in Json Array format.

### Limitation:

1. Only return short video from suggestion.
2. inlinePlaybackEndpoint facing async issue.
3. Only return first page of short video.

## Error Handling

The library provides comprehensive error handling with custom error classes and error codes.

For detailed information about error messages and their translations, see [ERROR_MESSAGES.md](./ERROR_MESSAGES.md).

### Error Classes

```node
const {
  YouTubeAPIError,
  ErrorHandler,
  ErrorCodes,
} = require("youtube-search-api");
```

### Error Codes

| Error Code           | Description                            |
| -------------------- | -------------------------------------- |
| `NETWORK_ERROR`      | Network connection issues              |
| `INIT_DATA_ERROR`    | Cannot get YouTube initialization data |
| `PLAYER_DATA_ERROR`  | Cannot get YouTube player data         |
| `INVALID_PLAYLIST`   | Invalid playlist ID                    |
| `INVALID_VIDEO_ID`   | Invalid video ID                       |
| `INVALID_CHANNEL_ID` | Invalid channel ID                     |
| `RATE_LIMIT_ERROR`   | Rate limit exceeded                    |
| `PARSE_ERROR`        | Data parsing error                     |
| `UNKNOWN_ERROR`      | Unknown error                          |

### Basic Error Handling

```node
try {
  const result = await youtubesearchapi.GetVideoDetails("invalid_video_id");
} catch (error) {
  if (error instanceof YouTubeAPIError) {
    console.log(`Error Code: ${error.code}`);
    console.log(`Error Message: ${error.message}`);
    console.log(`Status Code: ${error.statusCode}`);
  }
}
```

### Custom Error Logger

```node
const errorHandler = ErrorHandler.getInstance();
errorHandler.setErrorLogger((error) => {
  console.log(`[${new Date().toISOString()}] ${error.code}: ${error.message}`);
  // Send to your logging service
});
```

### Error Handling Examples

```node
// Handle specific error types
try {
  await youtubesearchapi.GetPlaylistData("invalid_playlist");
} catch (error) {
  if (error instanceof YouTubeAPIError) {
    switch (error.code) {
      case ErrorCodes.INVALID_PLAYLIST:
        console.log("Please check the playlist ID");
        break;
      case ErrorCodes.NETWORK_ERROR:
        console.log("Please check your internet connection");
        break;
      case ErrorCodes.RATE_LIMIT_ERROR:
        console.log("Please try again later");
        break;
      default:
        console.log("An unknown error occurred");
    }
  }
}
```

See `example/error-handling-example.js` for more detailed examples.

### Docker:

[Docker Image](https://hub.docker.com/r/damonwong/youtube-search-api-docker)

## Message

If you want to work with me to fix bug or implement new idea. You are available to send me some new idea of this project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## TODO

1. Web app with show case
2. Support front-end (Vue, React) (Still on going ...)

## Bug fixed

## Update

1. Search for shorts (Limitation)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support me

https://www.buymeacoffee.com/damonwcw

## Contact me

damonwcw@outlook.com
