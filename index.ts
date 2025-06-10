import axios, { AxiosResponse } from "axios";

const youtubeEndpoint = `https://www.youtube.com`;

interface YoutubeInitData {
  initdata: any;
  apiToken: string | null;
  context: any;
}

interface YoutubePlayerDetail {
  videoId: string;
  thumbnail: any;
  author?: string;
  channelId: string;
  shortDescription: string;
  keywords: string[];
}

interface SearchItem {
  id: string;
  type: string;
  thumbnail: any;
  title: string;
  channelTitle?: string;
  shortBylineText?: string;
  length?: string | any;
  isLive?: boolean;
  videos?: any[];
  videoCount?: string;
}

export interface SearchResult {
  items: SearchItem[];
  nextPage: {
    nextPageToken: string | null;
    nextPageContext: any;
  };
}

export interface PlaylistResult {
  items: SearchItem[];
  metadata: any;
}

export interface ChannelResult {
  title: string;
  content: any;
}

export interface VideoDetails {
  id: string;
  title: string;
  thumbnail: any;
  isLive: boolean;
  channel: string;
  channelId: string;
  description: string;
  keywords: string[];
  suggestion: SearchItem[];
}

export interface ShortVideo {
  id: string;
  type: string;
  thumbnail: any;
  title: string;
  inlinePlaybackEndpoint: any;
}

interface SearchOptions {
  type: string;
}

const GetYoutubeInitData = async (url: string): Promise<YoutubeInitData> => {
  let initdata: any = {};
  let apiToken: string | null = null;
  let context: any = null;
  try {
    const page: AxiosResponse<string> = await axios.get(encodeURI(url));
    const ytInitData = page.data.split("var ytInitialData =");
    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);

      if (page.data.split("innertubeApiKey").length > 0) {
        apiToken = page.data
          .split("innertubeApiKey")[1]
          .trim()
          .split(",")[0]
          .split('"')[2];
      }

      if (page.data.split("INNERTUBE_CONTEXT").length > 0) {
        context = JSON.parse(
          page.data.split("INNERTUBE_CONTEXT")[1].trim().slice(2, -2)
        );
      }

      initdata = JSON.parse(data);
      return { initdata, apiToken, context };
    } else {
      console.error("cannot_get_init_data");
      throw new Error("cannot_get_init_data");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetYoutubePlayerDetail = async (
  url: string
): Promise<YoutubePlayerDetail> => {
  let initdata: any = {};
  try {
    const page: AxiosResponse<string> = await axios.get(encodeURI(url));
    const ytInitData = page.data.split("var ytInitialPlayerResponse =");
    if (ytInitData && ytInitData.length > 1) {
      const data = ytInitData[1].split("</script>")[0].slice(0, -1);
      initdata = JSON.parse(data);
      return { ...initdata.videoDetails };
    } else {
      console.error("cannot_get_player_data");
      throw new Error("cannot_get_player_data");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetData = async (
  keyword: string,
  withPlaylist: boolean = false,
  limit: number = 0,
  options: SearchOptions[] = []
): Promise<SearchResult> => {
  let endpoint = `${youtubeEndpoint}/results?search_query=${keyword}`;
  try {
    if (Array.isArray(options) && options.length > 0) {
      const type = options.find((z) => z.type);
      if (type && typeof type.type === "string") {
        switch (type.type.toLowerCase()) {
          case "video":
            endpoint = `${endpoint}&sp=EgIQAQ%3D%3D`;
            break;
          case "channel":
            endpoint = `${endpoint}&sp=EgIQAg%3D%3D`;
            break;
          case "playlist":
            endpoint = `${endpoint}&sp=EgIQAw%3D%3D`;
            break;
          case "movie":
            endpoint = `${endpoint}&sp=EgIQBA%3D%3D`;
            break;
        }
      }
    }
    const page = await GetYoutubeInitData(endpoint);

    const sectionListRenderer =
      page.initdata.contents.twoColumnSearchResultsRenderer.primaryContents
        .sectionListRenderer;

    let contToken: any = {};

    let items: SearchItem[] = [];

    sectionListRenderer.contents.forEach((content: any) => {
      if (content.continuationItemRenderer) {
        contToken =
          content.continuationItemRenderer.continuationEndpoint
            .continuationCommand.token;
      } else if (content.itemSectionRenderer) {
        content.itemSectionRenderer.contents.forEach((item: any) => {
          if (item.channelRenderer) {
            let channelRenderer = item.channelRenderer;
            items.push({
              id: channelRenderer.channelId,
              type: "channel",
              thumbnail: channelRenderer.thumbnail,
              title: channelRenderer.title.simpleText
            });
          } else {
            let videoRender = item.videoRenderer;
            let playListRender = item.playlistRenderer;

            if (videoRender && videoRender.videoId) {
              items.push(VideoRender(item));
            }
            if (withPlaylist) {
              if (playListRender && playListRender.playlistId) {
                items.push({
                  id: playListRender.playlistId,
                  type: "playlist",
                  thumbnail: playListRender.thumbnails,
                  title: playListRender.title.simpleText,
                  length: playListRender.videoCount,
                  videos: playListRender.videos,
                  videoCount: playListRender.videoCount,
                  isLive: false
                });
              }
            }
          }
        });
      }
    });
    const apiToken = page.apiToken;
    const context = page.context;
    const nextPageContext = { context, continuation: contToken };
    const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
    return {
      items: itemsResult,
      nextPage: { nextPageToken: apiToken, nextPageContext }
    };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const nextPage = async (
  nextPage: { nextPageToken: string | null; nextPageContext: any },
  withPlaylist: boolean = false,
  limit: number = 0
): Promise<SearchResult> => {
  const endpoint = `${youtubeEndpoint}/youtubei/v1/search?key=${nextPage.nextPageToken}`;
  try {
    const page: AxiosResponse = await axios.post(
      encodeURI(endpoint),
      nextPage.nextPageContext
    );
    const item1 =
      page.data.onResponseReceivedCommands[0].appendContinuationItemsAction;
    let items: SearchItem[] = [];
    item1.continuationItems.forEach((conitem: any) => {
      if (conitem.itemSectionRenderer) {
        conitem.itemSectionRenderer.contents.forEach(async (item: any) => {
          let videoRender = item.videoRenderer;
          let playListRender = item.playlistRenderer;
          if (videoRender && videoRender.videoId) {
            items.push(VideoRender(item));
          }
          if (withPlaylist) {
            if (playListRender && playListRender.playlistId) {
              items.push({
                id: playListRender.playlistId,
                type: "playlist",
                thumbnail: playListRender.thumbnails,
                title: playListRender.title.simpleText,
                length: playListRender.videoCount,
                videos: (await GetPlaylistData(playListRender.playlistId))
                  .items,
                videoCount: playListRender.videoCount,
                isLive: false
              });
            }
          }
        });
      } else if (conitem.continuationItemRenderer) {
        nextPage.nextPageContext.continuation =
          conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      }
    });
    const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
    return { items: itemsResult, nextPage };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetPlaylistData = async (
  playlistId: string,
  limit: number = 0
): Promise<PlaylistResult> => {
  const endpoint = `${youtubeEndpoint}/playlist?list=${playlistId}`;
  try {
    const initData = await GetYoutubeInitData(endpoint);
    const sectionListRenderer = initData.initdata;
    const metadata = sectionListRenderer.metadata;
    if (sectionListRenderer && sectionListRenderer.contents) {
      const videoItems =
        sectionListRenderer.contents.twoColumnBrowseResultsRenderer.tabs[0]
          .tabRenderer.content.sectionListRenderer.contents[0]
          .itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
      let items: SearchItem[] = [];
      videoItems.forEach((item: any) => {
        let videoRender = item.playlistVideoRenderer;
        if (videoRender && videoRender.videoId) {
          items.push(VideoRender(item));
        }
      });
      const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
      return { items: itemsResult, metadata };
    } else {
      throw new Error("invalid_playlist");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetSuggestData = async (
  limit: number = 0
): Promise<{ items: SearchItem[] }> => {
  const endpoint = youtubeEndpoint;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const sectionListRenderer =
      page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer
        .content.richGridRenderer.contents;
    let items: SearchItem[] = [];
    let otherItems: any[] = [];
    sectionListRenderer.forEach((item: any) => {
      if (item.richItemRenderer && item.richItemRenderer.content) {
        let videoRender = item.richItemRenderer.content.videoRenderer;
        if (videoRender && videoRender.videoId) {
          items.push(VideoRender(item.richItemRenderer.content));
        } else {
          otherItems.push(videoRender);
        }
      }
    });
    const itemsResult = limit !== 0 ? items.slice(0, limit) : items;
    return { items: itemsResult };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetChannelById = async (channelId: string): Promise<ChannelResult[]> => {
  const endpoint = `${youtubeEndpoint}/channel/${channelId}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const tabs = page.initdata.contents.twoColumnBrowseResultsRenderer.tabs;
    const items = tabs
      .map((json: any) => {
        if (json && json.tabRenderer) {
          const tabRenderer = json.tabRenderer;
          const title = tabRenderer.title;
          const content = tabRenderer.content;
          return { title, content };
        }
      })
      .filter((y: any) => typeof y !== "undefined") as ChannelResult[];
    return items;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetVideoDetails = async (videoId: string): Promise<VideoDetails> => {
  const endpoint = `${youtubeEndpoint}/watch?v=${videoId}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const playerData = await GetYoutubePlayerDetail(endpoint);

    const result = page.initdata.contents.twoColumnWatchNextResults;
    const firstContent =
      result.results.results.contents[0].videoPrimaryInfoRenderer;
    const secondContent =
      result.results.results.contents[1].videoSecondaryInfoRenderer;
    const res: VideoDetails = {
      id: playerData.videoId,
      title: firstContent.title.runs[0].text,
      thumbnail: playerData.thumbnail,
      isLive: firstContent.viewCount.videoViewCountRenderer.hasOwnProperty(
        "isLive"
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
        .filter((y: any) => y.hasOwnProperty("compactVideoRenderer"))
        .map((x: any) => compactVideoRenderer(x))
    };

    return res;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const VideoRender = (json: any): SearchItem => {
  try {
    if (json && (json.videoRenderer || json.playlistVideoRenderer)) {
      let videoRenderer = json.videoRenderer || json.playlistVideoRenderer;
      let isLive = false;
      if (
        videoRenderer.badges &&
        videoRenderer.badges.length > 0 &&
        videoRenderer.badges[0].metadataBadgeRenderer &&
        videoRenderer.badges[0].metadataBadgeRenderer.style ===
          "BADGE_STYLE_TYPE_LIVE_NOW"
      ) {
        isLive = true;
      }
      if (videoRenderer.thumbnailOverlays) {
        videoRenderer.thumbnailOverlays.forEach((item: any) => {
          if (
            item.thumbnailOverlayTimeStatusRenderer &&
            item.thumbnailOverlayTimeStatusRenderer.style &&
            item.thumbnailOverlayTimeStatusRenderer.style === "LIVE"
          ) {
            isLive = true;
          }
        });
      }
      const id = videoRenderer.videoId;
      const thumbnail = videoRenderer.thumbnail;
      const title = videoRenderer.title.runs[0].text;
      const shortBylineText = videoRenderer.shortBylineText
        ? videoRenderer.shortBylineText
        : "";
      const lengthText = videoRenderer.lengthText
        ? videoRenderer.lengthText
        : "";
      const channelTitle =
        videoRenderer.ownerText && videoRenderer.ownerText.runs
          ? videoRenderer.ownerText.runs[0].text
          : "";
      return {
        id,
        type: "video",
        thumbnail,
        title,
        channelTitle,
        shortBylineText,
        length: lengthText,
        isLive
      };
    }
    return {
      id: "",
      type: "",
      thumbnail: undefined,
      title: ""
    };
  } catch (ex) {
    throw ex;
  }
};

const compactVideoRenderer = (json: any): SearchItem => {
  const compactVideoRendererJson = json.compactVideoRenderer;
  let isLive = false;
  if (
    compactVideoRendererJson.badges &&
    compactVideoRendererJson.badges.length > 0 &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer.style ===
      "BADGE_STYLE_TYPE_LIVE_NOW"
  ) {
    isLive = true;
  }
  return {
    id: compactVideoRendererJson.videoId,
    type: "video",
    thumbnail: compactVideoRendererJson.thumbnail.thumbnails,
    title: compactVideoRendererJson.title.simpleText,
    channelTitle: compactVideoRendererJson.shortBylineText.runs[0].text,
    shortBylineText: compactVideoRendererJson.shortBylineText.runs[0].text,
    length: compactVideoRendererJson.lengthText,
    isLive
  };
};

const GetShortVideo = async (): Promise<ShortVideo[]> => {
  const page = await GetYoutubeInitData(youtubeEndpoint);
  const shortResult =
    page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents
      .filter((x: any) => x.richSectionRenderer)
      .map((z: any) => z.richSectionRenderer.content)
      .filter((y: any) => y.richShelfRenderer)
      .map((u: any) => u.richShelfRenderer)
      .find((i: any) => i.title.runs[0].text === "Shorts");
  const res = shortResult.contents
    .map((z: any) => z.richItemRenderer)
    .map((y: any) => y.content.reelItemRenderer);
  return res.map((json: any) => ({
    id: json.videoId,
    type: "reel",
    thumbnail: json.thumbnail.thumbnails[0],
    title: json.headline.simpleText,
    inlinePlaybackEndpoint: json.inlinePlaybackEndpoint || {}
  }));
};

export {
  GetData as GetListByKeyword,
  nextPage as NextPage,
  GetPlaylistData,
  GetSuggestData,
  GetChannelById,
  GetVideoDetails,
  GetShortVideo
};
