# Youtube Search API

Youtube Search API is an API for getting Youtube search results.

## Installation

```bash
npm install youtube-search-api
```

## Usage (import)

```node
var youtubesearchapi=require('youtube-search-api');
```
## GetListByKeywords (Promise)
```node
youtubesearchapi.GetListByKeyword("<keywords>")
```
GetListByKeywords Result
```node
{items:[],nextPage:{nextPageToken:"xxxxxxxx",nextPageContext:{}}}
```
"items" is the array from youtube, "nextPage" needs to pass when going to the next page.
## NextPage (Promise)
```node
youtubesearchapi.NextPage(<nextPage from GetListByKeywords result>)
```
NextPage Result
```node
{items:[],nextPage:{nextPageToken:"xxxxxxxx",nextPageContext:{}}}
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## TODO
1. Playlist support

## License
[MIT](https://choosealicense.com/licenses/mit/)