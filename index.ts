const axios = {
  async get(url: string) {
    let res = await fetch(url)
    if (res.headers.get('content-type')?.includes('json')) {
      return { data: await res.json() }
    } else {
      return { data: await res.text() }
    }
  },
  async post(url: string, data: any) {
    let res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (res.headers.get('content-type')?.includes('json')) {
      return { data: await res.json() }
    } else {
      return { data: await res.text() }
    }
  },
}

const youtubeEndpoint = `https://www.youtube.com`

export type YoutubeListItem = {
  /** e.g. 'aZ9-35Gmt5k' */
  id?: string
  type?: 'video' | 'channel' | 'playlist' | 'movie'
  thumbnail?: {
    thumbnails: {
      url: string
      width: number
      height: number
    }[]
  }
  title?: string
  /** e.g. 'Birder King' */
  channelTitle?: string
  shortBylineText?: {
    runs: {
      /** e.g. 'Birder King' */
      text: string
      navigationEndpoint: {
        commandMetadata: {
          webCommandMetadata: {
            /** e.g. '/@BirderKing' */
            url: string
            /** e.g. 'WEB_PAGE_TYPE_CHANNEL' */
            webPageType: string
          }
        }
      }
    }[]
  }
  /** empty string if is live */
  length?:
    | ''
    | {
        accessibility: {
          accessibilityData: {
            /** e.g. '15 分鐘' */
            label: string
          }
        }
        /** e.g. '15:00' */
        simpleText: string
      }
  videos?: YoutubeSearchResult | YoutubePlaylistResult
  videoCount?: number
  isLive?: boolean
}

export type YoutubeSearchResultNextPage = {
  nextPageToken: string
  nextPageContext: {
    context: {
      client: {
        /** e.g. 'zh-HK' */
        hl: string
        /** e.g. 'HK' */
        gl: string
      }
    }
    continuation?: string
  }
}

export type YoutubeSearchResult = {
  items: YoutubeListItem[]
  nextPage: YoutubeSearchResultNextPage
}

const GetYoutubeInitData = async (url: string) => {
  var apiToken = null
  var context = null
  const page = await axios.get(encodeURI(url))
  const ytInitData = await page.data.split('var ytInitialData =')
  if (ytInitData && ytInitData.length > 1) {
    const data = await ytInitData[1].split('</script>')[0].slice(0, -1)

    if (page.data.split('innertubeApiKey').length > 0) {
      apiToken = await page.data
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

    let initdata = JSON.parse(data)
    return { initdata, apiToken, context }
  } else {
    throw new Error('cannot_get_init_data')
  }
}

const GetYoutubePlayerDetail = async (url: string) => {
  const page = await axios.get(encodeURI(url))
  const ytInitData = await page.data.split('var ytInitialPlayerResponse =')
  if (ytInitData && ytInitData.length > 1) {
    const data = await ytInitData[1].split('</script>')[0].slice(0, -1)
    let initdata = JSON.parse(data)
    return { ...initdata.videoDetails }
  } else {
    throw new Error('cannot_get_player_data')
  }
}

export const GetListByKeyword = async (
  keyword: string,
  withPlaylist = false,
  limit = 0,
  options: { type: 'video' | 'channel' | 'playlist' | 'movie' }[] = [],
): Promise<YoutubeSearchResult> => {
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
  const page = await GetYoutubeInitData(endpoint)

  const sectionListRenderer =
    await page.initdata.contents.twoColumnSearchResultsRenderer.primaryContents
      .sectionListRenderer

  let contToken: string | undefined

  let items: YoutubeListItem[] = []

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
  const nextPageContext = { context, continuation: contToken }
  const itemsResult = limit != 0 ? items.slice(0, limit) : items
  return {
    items: itemsResult,
    nextPage: { nextPageToken: apiToken, nextPageContext: nextPageContext },
  }
}

export const NextPage = async (
  nextPage: YoutubeSearchResultNextPage,
  withPlaylist = false,
  limit = 0,
): Promise<YoutubeSearchResult> => {
  const endpoint = `${youtubeEndpoint}/youtubei/v1/search?key=${nextPage.nextPageToken}`
  const page = await axios.post(encodeURI(endpoint), nextPage.nextPageContext)
  const item1 =
    page.data.onResponseReceivedCommands[0].appendContinuationItemsAction
  let items: YoutubeListItem[] = []
  for (const conitem of item1.continuationItems) {
    if (conitem.itemSectionRenderer) {
      for (const item of conitem.itemSectionRenderer.contents) {
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
              videos: await GetPlaylistData(playListRender.playlistId),
            })
          }
        }
      }
    } else if (conitem.continuationItemRenderer) {
      nextPage.nextPageContext.continuation =
        conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token
    }
  }
  const itemsResult = limit != 0 ? items.slice(0, limit) : items
  return { items: itemsResult, nextPage: nextPage }
}

export type YoutubePlaylistResult = {
  items: YoutubeListItem[]
  metadata: {
    playlistMetadataRenderer: {
      /** e.g. "a playlist for cat people" */
      title: string
      /** e.g. "collection of videos for cat people" */
      description?: string
      /** e.g. "android-app://com.google.android.youtube/http/www.youtube.com/playlist?list=PL4y51Lv1VE0cry_eahgWj0xU3xTg_kDyA" */
      androidAppindexingLink: string
      /** e.g. "ios-app://544007664/vnd.youtube/www.youtube.com/playlist?list=PL4y51Lv1VE0cry_eahgWj0xU3xTg_kDyA" */
      iosAppindexingLink: string
    }
  }
}

export const GetPlaylistData = async (
  playlistId: string,
  limit = 0,
): Promise<YoutubePlaylistResult> => {
  const endpoint = `${youtubeEndpoint}/playlist?list=${playlistId}`
  const initData = await GetYoutubeInitData(endpoint)
  const sectionListRenderer = initData.initdata
  const metadata =
    sectionListRenderer.metadata as YoutubePlaylistResult['metadata']
  if (sectionListRenderer && sectionListRenderer.contents) {
    const videoItems =
      sectionListRenderer.contents.twoColumnBrowseResultsRenderer.tabs[0]
        .tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer
        .contents[0].playlistVideoListRenderer.contents
    let items: YoutubeListItem[] = []
    videoItems.forEach((item: any) => {
      let videoRender = item.playlistVideoRenderer
      if (videoRender && videoRender.videoId) {
        items.push(VideoRender(item))
      }
    })
    const itemsResult = limit != 0 ? items.slice(0, limit) : items
    return { items: itemsResult, metadata }
  } else {
    throw new Error('invalid_playlist')
  }
}

export type YoutubeSuggestResult = {
  items: YoutubeListItem[]
}

export const GetSuggestData = async (
  limit = 0,
): Promise<YoutubeSuggestResult> => {
  const endpoint = `${youtubeEndpoint}`
  const page = await GetYoutubeInitData(endpoint)
  const sectionListRenderer =
    page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
      .content.richGridRenderer.contents
  let items: YoutubeListItem[] = []
  let otherItems: YoutubeListItem[] = []
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

export type YoutubeChannelResult = {
  title: string
  content?: {
    sectionListRenderer: {
      contents: {
        itemSectionRenderer: {
          contents: {
            shelfRenderer: {
              title: { runs: { text: string }[] }
              content: {
                horizontalListRenderer: {
                  items: {
                    gridChannelRenderer: {
                      /** e.g. 'UCeIU079SsB5QF7sW1XVbiuw' */
                      channelId: string
                      thumbnail: {
                        thumbnails: {
                          /** e.g. '//yt3.googleusercontent.com/fK2iaVBChrhzSfxe92Ee01bHEKVuCrlfoEOPvvwPOFNbq1uMZkC-ee5NwWO0cklsuJtpPZapJk0=s88-c-k-c0x00ffffff-no-rj-mo' */
                          url: string
                          /** e.g. 88 */
                          width: number
                          /** e.g. 88 */
                          height: number
                        }[]
                      }
                      videoCountText: {
                        /** e.g. '16', ' 部影片' */
                        runs: {
                          text: string
                        }[]
                      }
                      subscriberCountText: {
                        accessibility: {
                          accessibilityData: {
                            /** e.g. '989 位訂閱者' */
                            label: string
                          }
                        }
                        /** e.g. '989 位訂閱者' */
                        simpleText: string
                      }
                      navigationEndpoint: {
                        commandMetadata: {
                          webCommandMetadata: {
                            /** e.g. '/@RailCowBirds' */
                            url: string
                            /** e.g. 'WEB_PAGE_TYPE_CHANNEL' */
                            webPageType: string
                          }
                        }
                        browseEndpoint: {
                          /** e.g. 'UCeIU079SsB5QF7sW1XVbiuw' */
                          browseId: string
                          /** e.g. '/@RailCowBirds' */
                          canonicalBaseUrl: string
                        }
                      }
                      title: {
                        /** e.g. 'RailCowBirds' */
                        simpleText: string
                      }
                      subscribeButton: {
                        buttonRenderer: {
                          style: 'STYLE_COMPACT_GRAY'
                          size: 'SIZE_DEFAULT'
                          isDisabled: false
                          text: {
                            runs: [
                              {
                                text: '訂閱'
                              },
                            ]
                          }
                        }
                      }
                    }
                  }[]
                }
              }
            }
          }[]
        }
      }[]
    }
  }
}[]

export const GetChannelById = async (
  channelId: string,
): Promise<YoutubeChannelResult> => {
  const endpoint = `${youtubeEndpoint}/channel/${channelId}`
  const page = await GetYoutubeInitData(endpoint)
  const tabs = page.initdata.contents.twoColumnBrowseResultsRenderer
    .tabs as any[]
  const items = tabs
    .map(json => {
      if (json && json.tabRenderer) {
        const tabRenderer = json.tabRenderer
        const title = tabRenderer.title
        const content = tabRenderer.content
        return { title, content }
      }
    })
    .filter(y => typeof y != 'undefined')
  return items
}

export const GetVideoDetails = async (videoId: string) => {
  const endpoint = `${youtubeEndpoint}/watch?v=${videoId}`
  const page = await GetYoutubeInitData(endpoint)
  const playerData = await GetYoutubePlayerDetail(endpoint)

  const result = page.initdata.contents.twoColumnWatchNextResults
  const firstContent =
    result.results.results.contents[0].videoPrimaryInfoRenderer
  const secondContent =
    result.results.results.contents[1].videoSecondaryInfoRenderer
  const res = {
    id: playerData.videoId,
    title: firstContent.title.runs[0].text,
    thumbnail: playerData.thumbnail,
    isLive: firstContent.viewCount.videoViewCountRenderer.hasOwnProperty(
      'isLive',
    )
      ? firstContent.viewCount.videoViewCountRenderer.isLive
      : false,
    channel:
      playerData.author ||
      secondContent.owner.videoOwnerRenderer.title.runs[0].text,
    channelId: playerData.channelId,
    description: playerData.shortDescription,
    keywords: playerData.keywords,
    suggestion: result.secondaryResults.secondaryResults.results
      .filter((y: any) => y.hasOwnProperty('compactVideoRenderer'))
      .map((x: any) => compactVideoRenderer(x)),
  }

  return res
}

const VideoRender = (json: any): YoutubeListItem => {
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

const compactVideoRenderer = (json: any) => {
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
    type: 'video',
    thumbnail: compactVideoRendererJson.thumbnail.thumbnails,
    title: compactVideoRendererJson.title.simpleText,
    channelTitle: compactVideoRendererJson.shortBylineText.runs[0].text,
    shortBylineText: compactVideoRendererJson.shortBylineText.runs[0].text,
    length: compactVideoRendererJson.lengthText,
    isLive,
  }
  return result
}

export const GetShortVideo = async () => {
  const page = await GetYoutubeInitData(youtubeEndpoint)
  const shortResult =
    page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents
      .filter((x: any) => {
        return x.richSectionRenderer
      })
      .map((z: any) => z.richSectionRenderer.content)
      .filter((y: any) => y.richShelfRenderer)
      .map((u: any) => u.richShelfRenderer)
      .find((i: any) => i.title.runs[0].text == 'Shorts')
  const res = shortResult.contents
    .map((z: any) => z.richItemRenderer)
    .map((y: any) => y.content.reelItemRenderer)
  return res.map((json: any) => ({
    id: json.videoId,
    type: 'reel',
    thumbnail: json.thumbnail.thumbnails[0],
    title: json.headline.simpleText,
    inlinePlaybackEndpoint: json.inlinePlaybackEndpoint || {},
  }))
}
