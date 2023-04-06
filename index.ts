const youtubeEndpoint = `https://www.youtube.com`

// use native fetch instead of axios
namespace axios {
  export async function get(url: string) {
    let res = await fetch(url)
    let text = await res.text()
    try {
      let json = JSON.parse(text)
      return { data: json }
    } catch (error) {
      return { data: text }
    }
  }
  export async function post(url: string, body: any) {
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    let text = await res.text()
    try {
      let json = JSON.parse(text)
      return { data: json }
    } catch (error) {
      return { data: text }
    }
  }
}

const GetYoutubeInitData = async (url: string) => {
  var initdata: any = {}
  var apiToken = null
  var context = null
  console.log(encodeURI(url))
  const page = await axios.get(encodeURI(url))

  const ytInitData = page.data.split('var ytInitialData =')
  if (ytInitData && ytInitData.length > 1) {
    const data = ytInitData[1].split('</script>')[0].slice(0, -1)

    if (page.data.split('innertubeApiKey').length > 0) {
      apiToken = page.data
        .split('innertubeApiKey')[1]
        .trim()
        .split(',')[0]
        .split('"')[2]
    }

    if (page.data.split('INNERTUBE_CONTEXT').length > 0) {
      context = JSON.parse(
        page.data.split('INNERTUBE_CONTEXT')[1].trim().slice(2, -2),
      )
    }

    initdata = JSON.parse(data)
    return { initdata, apiToken, context }
  } else {
    return Promise.reject('cannot_get_init_data')
  }
}

export type GetDataOption = {
  type: 'video' | 'channel' | 'playlist' | 'movie'
}

type Thumbnail = {
  thumbnails: Array<{
    url: string
    width: number
    height: number
  }>
}

export type GetDataResult = {
  items: Array<ChannelItem | VideoItem | {}>
  nextPage: NextPageData
}

export type NextPageData = {
  nextPageToken: string
  nextPageContext: {
    context: {
      client: {
        hl: string
        gl: string
        remoteHost: string
        deviceMake: string
        deviceModel: string
        visitorData: string
        userAgent: string
        clientName: string
        clientVersion: string
        osVersion: string
        originalUrl: string
        platform: string
        clientFormFactor: string
        configInfo: {
          appInstallData: string
        }
        acceptHeader: string
        deviceExperimentId: string
      }
      user: {
        lockedSafetyMode: boolean
      }
      request: {
        useSsl: boolean
      }
      clickTracking: {
        clickTrackingParams: string
      }
    }
    continuation: string | {}
  }
}

export type ChannelItem = {
  id: string
  type: 'channel'
  thumbnail: Thumbnail
  title: string
}
export type VideoItem = {
  id: string
  type: 'video'
  thumbnail: Thumbnail
  title: string
  channelTitle: string
  shortBylineText: {
    runs: Array<{
      text: string
      navigationEndpoint: {
        clickTrackingParams: string
        commandMetadata: {
          webCommandMetadata: {
            url: string
            webPageType: string
            rootVe: number
            apiUrl: string
          }
        }
        browseEndpoint: {
          browseId: string
          canonicalBaseUrl: string
        }
      }
    }>
  }
  length: {
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
    simpleText: string
  }
  isLive: boolean
}

export type GetPlaylistDataResult = {
  items: Array<VideoItem | {}>
  metadata: object
}

export type GetSuggestDataResult = {
  items: Array<VideoItem | {}>
}

export const GetListByKeyword = async (
  keyword: string,
  withPlaylist = false,
  limit = 0,
  options: GetDataOption[] = [],
): Promise<GetDataResult> => {
  let endpoint = `${youtubeEndpoint}/results?search_query=${keyword}`
  if (Array.isArray(options) && options.length > 0) {
    const type = options.find(z => z.type)
    if (typeof type == 'object') {
      if (typeof type.type == 'string') {
        switch (type.type.toLowerCase()) {
          case 'video':
            endpoint = `${endpoint}&sp=EgIQAQ%3D%3D`
            break
          case 'channel':
            endpoint = `${endpoint}&sp=EgIQAg%3D%3D`
            break
          case 'playlist':
            endpoint = `${endpoint}&sp=EgIQAw%3D%3D`
            break
          case 'movie':
            endpoint = `${endpoint}&sp=EgIQBA%3D%3D`
            break
        }
      }
    }
  }
  console.log(endpoint)
  const page = await GetYoutubeInitData(endpoint)

  const sectionListRenderer =
    page.initdata.contents.twoColumnSearchResultsRenderer.primaryContents
      .sectionListRenderer

  let contToken = {}

  let items: GetDataResult['items'] = []

  sectionListRenderer.contents.forEach((content: any) => {
    if (content.continuationItemRenderer) {
      contToken =
        content.continuationItemRenderer.continuationEndpoint
          .continuationCommand.token
    } else if (content.itemSectionRenderer) {
      content.itemSectionRenderer.contents.forEach((item: any) => {
        if (item.channelRenderer) {
          let channelRenderer = item.channelRenderer
          items.push({
            id: channelRenderer.channelId,
            type: 'channel',
            thumbnail: channelRenderer.thumbnail,
            title: channelRenderer.title.simpleText,
          })
        } else {
          let videoRender = item.videoRenderer
          let playListRender = item.playlistRenderer

          if (videoRender && videoRender.videoId) {
            items.push(VideoRender(item))
          }
          if (withPlaylist) {
            if (playListRender && playListRender.playlistId) {
              items.push({
                id: playListRender.playlistId,
                type: 'playlist',
                thumbnail: playListRender.thumbnails,
                title: playListRender.title.simpleText,
                length: playListRender.videoCount,
                videos: playListRender.videos,
                videoCount: playListRender.videoCount,
                isLive: false,
              })
            }
          }
        }
      })
    }
  })
  const apiToken = page.apiToken
  const context = page.context
  const nextPageContext = { context: context, continuation: contToken }
  const itemsResult = limit != 0 ? items.slice(0, limit) : items
  return {
    items: itemsResult,
    nextPage: { nextPageToken: apiToken, nextPageContext: nextPageContext },
  }
}

export const NextPage = async (
  nextPage: NextPageData,
  withPlaylist = false,
  limit = 0,
): Promise<GetDataResult> => {
  const endpoint = `${youtubeEndpoint}/youtubei/v1/search?key=${nextPage.nextPageToken}`
  const page = await axios.post(encodeURI(endpoint), nextPage.nextPageContext)
  const item1 =
    page.data.onResponseReceivedCommands[0].appendContinuationItemsAction
  let items: GetDataResult['items'] = []
  item1.continuationItems.forEach((conitem: any) => {
    if (conitem.itemSectionRenderer) {
      conitem.itemSectionRenderer.contents.forEach((item: any) => {
        let videoRender = item.videoRenderer
        let playListRender = item.playlistRenderer
        if (videoRender && videoRender.videoId) {
          items.push(VideoRender(item))
        }
        if (withPlaylist) {
          if (playListRender && playListRender.playlistId) {
            items.push({
              id: playListRender.playlistId,
              type: 'playlist',
              thumbnail: playListRender.thumbnails,
              title: playListRender.title.simpleText,
              length: playListRender.videoCount,
              videos: GetPlaylistData(playListRender.playlistId),
            })
          }
        }
      })
    } else if (conitem.continuationItemRenderer) {
      nextPage.nextPageContext.continuation =
        conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token
    }
  })
  const itemsResult = limit != 0 ? items.slice(0, limit) : items
  return { items: itemsResult, nextPage: nextPage }
}

export const GetPlaylistData = async (
  playlistId: string,
  limit = 0,
): Promise<GetPlaylistDataResult> => {
  const endpoint = `${youtubeEndpoint}/playlist?list=${playlistId}`
  const initData = await GetYoutubeInitData(endpoint)
  const sectionListRenderer = initData.initdata
  const metadata = sectionListRenderer.metadata
  if (sectionListRenderer && sectionListRenderer.contents) {
    const videoItems =
      sectionListRenderer.contents.twoColumnBrowseResultsRenderer.tabs[0]
        .tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer
        .contents[0].playlistVideoListRenderer.contents
    let items: GetPlaylistDataResult['items'] = []
    videoItems.forEach((item: any) => {
      let videoRender = item.playlistVideoRenderer
      if (videoRender && videoRender.videoId) {
        items.push(VideoRender(item))
      }
    })
    const itemsResult = limit != 0 ? items.slice(0, limit) : items
    return { items: itemsResult, metadata: metadata }
  } else {
    return Promise.reject('invalid_playlist')
  }
}

export const GetSuggestData = async (
  limit = 0,
): Promise<GetSuggestDataResult> => {
  const endpoint = `${youtubeEndpoint}`
  const page = await GetYoutubeInitData(endpoint)
  const sectionListRenderer =
    page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
      .content.richGridRenderer.contents
  let items: GetSuggestDataResult['items'] = []
  let otherItems = []
  sectionListRenderer.forEach((item: any) => {
    if (item.richItemRenderer && item.richItemRenderer.content) {
      let videoRender = item.richItemRenderer.content.videoRenderer
      if (videoRender && videoRender.videoId) {
        items.push(VideoRender(item.richItemRenderer.content))
      } else {
        otherItems.push(videoRender)
      }
    }
  })
  const itemsResult = limit != 0 ? items.slice(0, limit) : items
  return { items: itemsResult }
}

export type GetChannelByIdResult = {
  title: string
  content: string
}[]

export const GetChannelById = async (
  channelId: string,
): Promise<GetChannelByIdResult> => {
  const endpoint = `${youtubeEndpoint}/channel/${channelId}`
  const page = await GetYoutubeInitData(endpoint)
  const tabs = page.initdata.contents.twoColumnBrowseResultsRenderer.tabs
  const items = tabs
    .map((json: any) => {
      if (json && json.tabRenderer) {
        const tabRenderer = json.tabRenderer
        const title = tabRenderer.title
        const content = tabRenderer.content
        return { title, content }
      }
    })
    .filter((y: any) => typeof y != 'undefined')
  return items
}

export type GetVideoDetailsResult = {
  title: string
  isLive: boolean
  channel: string
  description: string | undefined
  suggestion: VideoItem[]
}

export const GetVideoDetails = async (
  videoId: string,
): Promise<GetVideoDetailsResult> => {
  const endpoint = `${youtubeEndpoint}/watch?v=${videoId}`
  const page = await GetYoutubeInitData(endpoint)
  const result = page.initdata.contents.twoColumnWatchNextResults
  const firstContent =
    result.results.results.contents[0].videoPrimaryInfoRenderer
  const secondContent =
    result.results.results.contents[1].videoSecondaryInfoRenderer
  const res: GetVideoDetailsResult = {
    title: firstContent.title.runs[0].text,
    isLive: firstContent.viewCount.videoViewCountRenderer.hasOwnProperty(
      'isLive',
    )
      ? firstContent.viewCount.videoViewCountRenderer.isLive
      : false,
    channel: secondContent.owner.videoOwnerRenderer.title.runs[0].text,
    description: secondContent.description
      ? secondContent.description.runs
          .map((x: any) => x.text)
          .join()
          .toString()
      : secondContent.description
      ? secondContent.description.content
      : undefined,
    suggestion: result.secondaryResults.secondaryResults.results
      .filter((y: any) => y.hasOwnProperty('compactVideoRenderer'))
      .map((x: any) => compactVideoRenderer(x)),
  }

  return res
}

const VideoRender = (json: any): VideoItem | {} => {
  if (json && (json.videoRenderer || json.playlistVideoRenderer)) {
    let videoRenderer = null
    if (json.videoRenderer) {
      videoRenderer = json.videoRenderer
    } else if (json.playlistVideoRenderer) {
      videoRenderer = json.playlistVideoRenderer
    }
    var isLive = false
    if (
      videoRenderer.badges &&
      videoRenderer.badges.length > 0 &&
      videoRenderer.badges[0].metadataBadgeRenderer &&
      videoRenderer.badges[0].metadataBadgeRenderer.style ==
        'BADGE_STYLE_TYPE_LIVE_NOW'
    ) {
      isLive = true
    }
    if (videoRenderer.thumbnailOverlays) {
      videoRenderer.thumbnailOverlays.forEach((item: any) => {
        if (
          item.thumbnailOverlayTimeStatusRenderer &&
          item.thumbnailOverlayTimeStatusRenderer.style &&
          item.thumbnailOverlayTimeStatusRenderer.style == 'LIVE'
        ) {
          isLive = true
        }
      })
    }
    const id = videoRenderer.videoId
    const thumbnail = videoRenderer.thumbnail
    const title = videoRenderer.title.runs[0].text
    const shortBylineText = videoRenderer.shortBylineText
      ? videoRenderer.shortBylineText
      : ''
    const lengthText = videoRenderer.lengthText ? videoRenderer.lengthText : ''
    const channelTitle =
      videoRenderer.ownerText && videoRenderer.ownerText.runs
        ? videoRenderer.ownerText.runs[0].text
        : ''
    return {
      id,
      type: 'video',
      thumbnail,
      title,
      channelTitle,
      shortBylineText,
      length: lengthText,
      isLive,
    }
  } else {
    return {}
  }
}

const compactVideoRenderer = (json: any): VideoItem => {
  const compactVideoRendererJson = json.compactVideoRenderer

  var isLive = false
  if (
    compactVideoRendererJson.badges &&
    compactVideoRendererJson.badges.length > 0 &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer.style ==
      'BADGE_STYLE_TYPE_LIVE_NOW'
  ) {
    isLive = true
  }
  const result = {
    id: compactVideoRendererJson.videoId,
    type: 'video' as const,
    thumbnail: compactVideoRendererJson.thumbnail.thumbnails,
    title: compactVideoRendererJson.title.simpleText,
    channelTitle: compactVideoRendererJson.shortBylineText.runs[0].text,
    shortBylineText: compactVideoRendererJson.shortBylineText.runs[0].text,
    length: compactVideoRendererJson.lengthText,
    isLive,
  }
  return result
}
