const axios = require("axios");
const youtubeEndpoint = `https://www.youtube.com`;

const GetYoutubeInitData = async (url) => {
  var initdata = {};
  var apiToken = null;
  var context = null;
  try {
    const page = await axios.get(encodeURI(url));
    const ytInitData = await page.data.split("var ytInitialData =");
    if (ytInitData && ytInitData.length > 1) {
      const data = await ytInitData[1].split("</script>")[0].slice(0, -1);

      if (page.data.split("innertubeApiKey").length > 0) {
        apiToken = await page.data
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

const GetYoutubePlayerDetail = async (url) => {
  var initdata = {};
  try {
    const page = await axios.get(encodeURI(url));
    const ytInitData = await page.data.split("var ytInitialPlayerResponse =");
    if (ytInitData && ytInitData.length > 1) {
      const data = await ytInitData[1].split("</script>")[0].slice(0, -1);
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
  keyword,
  withPlaylist = false,
  limit = 0,
  options = []
) => {
  let endpoint = `${youtubeEndpoint}/results?search_query=${keyword}`;
  try {
    if (Array.isArray(options) && options.length > 0) {
      const type = options.find((z) => z.type);
      if (typeof type == "object") {
        if (typeof type.type == "string") {
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
    }
    const page = await GetYoutubeInitData(endpoint);

    const sectionListRenderer = await page.initdata.contents
      .twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer;

    let contToken = {};

    let items = [];

    sectionListRenderer.contents.forEach((content) => {
      if (content.continuationItemRenderer) {
        contToken =
          content.continuationItemRenderer.continuationEndpoint
            .continuationCommand.token;
      } else if (content.itemSectionRenderer) {
        content.itemSectionRenderer.contents.forEach((item) => {
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
    const itemsResult = limit != 0 ? items.slice(0, limit) : items;
    return {
      items: itemsResult,
      nextPage: { nextPageToken: apiToken, nextPageContext: nextPageContext }
    };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const nextPage = async (nextPage, withPlaylist = false, limit = 0) => {
  const endpoint =
    `${youtubeEndpoint}/youtubei/v1/search?key=${nextPage.nextPageToken}`;
  try {
    const page = await axios.post(
      encodeURI(endpoint),
      nextPage.nextPageContext
    );
    const item1 =
      page.data.onResponseReceivedCommands[0].appendContinuationItemsAction;
    let items = [];
    item1.continuationItems.forEach((conitem) => {
      if (conitem.itemSectionRenderer) {
        conitem.itemSectionRenderer.contents.forEach((item, index) => {
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
                videos: GetPlaylistData(playListRender.playlistId)
              });
            }
          }
        });
      } else if (conitem.continuationItemRenderer) {
        nextPage.nextPageContext.continuation =
          conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
      }
    });
    const itemsResult = limit != 0 ? items.slice(0, limit) : items;
    return { items: itemsResult, nextPage: nextPage };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetPlaylistData = async (playlistId, limit = 0) => {
  const endpoint = `${youtubeEndpoint}/playlist?list=${playlistId}`;
  try {
    const initData = await GetYoutubeInitData(endpoint);
    const sectionListRenderer = initData.initdata;
    const metadata = sectionListRenderer.metadata;
    if (sectionListRenderer && sectionListRenderer.contents) {
      const videoItems = sectionListRenderer.contents
        .twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
        .sectionListRenderer.contents[0].itemSectionRenderer.contents[0]
        .playlistVideoListRenderer.contents;
      let items = [];
      videoItems.forEach((item) => {
        let videoRender = item.playlistVideoRenderer;
        if (videoRender && videoRender.videoId) {
          items.push(VideoRender(item));
        }
      });
      const itemsResult = limit != 0 ? items.slice(0, limit) : items;
      return { items: itemsResult, metadata };
    } else {
      throw new Error("invalid_playlist");
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetSuggestData = async (limit = 0) => {
  const endpoint = `${youtubeEndpoint}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const sectionListRenderer = page.initdata.contents
      .twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content
      .richGridRenderer.contents;
    let items = [];
    let otherItems = [];
    sectionListRenderer.forEach((item) => {
      if (item.richItemRenderer && item.richItemRenderer.content) {
        let videoRender = item.richItemRenderer.content.videoRenderer;
        if (videoRender && videoRender.videoId) {
          items.push(VideoRender(item.richItemRenderer.content));
        } else {
          otherItems.push(videoRender);
        }
      }
    });
    const itemsResult = limit != 0 ? items.slice(0, limit) : items;
    return { items: itemsResult };
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetChannelById = async (channelId) => {
  const endpoint = `${youtubeEndpoint}/channel/${channelId}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const tabs = page.initdata.contents.twoColumnBrowseResultsRenderer.tabs;
    const items = tabs
      .map((json) => {
        if (json && json.tabRenderer) {
          const tabRenderer = json.tabRenderer;
          const title = tabRenderer.title;
          const content = tabRenderer.content;
          return { title, content };
        }
      })
      .filter((y) => typeof y != "undefined");
    return items;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const GetVideoDetails = async (videoId) => {
  const endpoint = `${youtubeEndpoint}/watch?v=${videoId}`;
  try {
    const page = await GetYoutubeInitData(endpoint);
    const playerData = await GetYoutubePlayerDetail(endpoint);

    const result = page.initdata.contents.twoColumnWatchNextResults;
    const firstContent = result.results.results.contents[0]
      .videoPrimaryInfoRenderer;
    const secondContent = result.results.results.contents[1]
      .videoSecondaryInfoRenderer;
    const res = {
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
        .filter((y) => y.hasOwnProperty("compactVideoRenderer"))
        .map((x) => compactVideoRenderer(x))
    };

    return res;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const VideoRender = (json) => {
  try {
    if (json && (json.videoRenderer || json.playlistVideoRenderer)) {
      let videoRenderer = null;
      if (json.videoRenderer) {
        videoRenderer = json.videoRenderer;
      } else if (json.playlistVideoRenderer) {
        videoRenderer = json.playlistVideoRenderer;
      }
      var isLive = false;
      if (
        videoRenderer.badges &&
        videoRenderer.badges.length > 0 &&
        videoRenderer.badges[0].metadataBadgeRenderer &&
        videoRenderer.badges[0].metadataBadgeRenderer.style ==
          "BADGE_STYLE_TYPE_LIVE_NOW"
      ) {
        isLive = true;
      }
      if (videoRenderer.thumbnailOverlays) {
        videoRenderer.thumbnailOverlays.forEach((item) => {
          if (
            item.thumbnailOverlayTimeStatusRenderer &&
            item.thumbnailOverlayTimeStatusRenderer.style &&
            item.thumbnailOverlayTimeStatusRenderer.style == "LIVE"
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
    } else {
      return {};
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};

const compactVideoRenderer = (json) => {
  const compactVideoRendererJson = json.compactVideoRenderer;

  var isLive = false;
  if (
    compactVideoRendererJson.badges &&
    compactVideoRendererJson.badges.length > 0 &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer &&
    compactVideoRendererJson.badges[0].metadataBadgeRenderer.style ==
      "BADGE_STYLE_TYPE_LIVE_NOW"
  ) {
    isLive = true;
  }
  const result = {
    id: compactVideoRendererJson.videoId,
    type: "video",
    thumbnail: compactVideoRendererJson.thumbnail.thumbnails,
    title: compactVideoRendererJson.title.simpleText,
    channelTitle: compactVideoRendererJson.shortBylineText.runs[0].text,
    shortBylineText: compactVideoRendererJson.shortBylineText.runs[0].text,
    length: compactVideoRendererJson.lengthText,
    isLive
  };
  return result;
};

const GetShortVideo = async () => {
  const page = await GetYoutubeInitData(youtubeEndpoint);
  const shortResult =
    page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents
      .filter((x) => {
        return x.richSectionRenderer;
      })
      .map((z) => z.richSectionRenderer.content)
      .filter((y) => y.richShelfRenderer)
      .map((u) => u.richShelfRenderer)
      .find((i) => i.title.runs[0].text == "Shorts");
  const res = shortResult.contents
    .map((z) => z.richItemRenderer)
    .map((y) => y.content.reelItemRenderer);
  return res.map((json) => ({
    id: json.videoId,
    type: "reel",
    thumbnail: json.thumbnail.thumbnails[0],
    title: json.headline.simpleText,
    inlinePlaybackEndpoint: json.inlinePlaybackEndpoint || {}
  }));
};

exports.GetListByKeyword = GetData;
exports.NextPage = nextPage;
exports.GetPlaylistData = GetPlaylistData;
exports.GetSuggestData = GetSuggestData;
exports.GetChannelById = GetChannelById;
exports.GetVideoDetails = GetVideoDetails;
exports.GetShortVideo = GetShortVideo;
