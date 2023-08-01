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
  title: "",
  isLive: [true/false],
  channel: ",
  description: ",
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
youtubesearchapi.GetShortVideo()

```

Get Short Video List Results

```node
[
  {
    id: "",
    type: "reel",
    thumbnail: {
      url: '',
      width: 405, //only return 405
      height: 720 //only return 720
    },
    title: '',
    inlinePlaybackEndpoint: {} //may not return all the time
  }
]
```

Will return Short Video list in Json Array format.

### Limitation:
1. Only return short video from suggestion.
2. inlinePlaybackEndpoint facing async issue.
3. Only return first page of short video.

## Message

If you want to work with me to fix bug or implement new idea. You are available to send me some new idea of this project.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## TODO

1. Web app with show case
2. Typescript version (Contributor is working on)
3. Support front-end (Vue, React) (Still on going ...)

## Bug fixed

## Update

1. Search for shorts (Limitation)

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Support me

https://www.buymeacoffee.com/damonwcw