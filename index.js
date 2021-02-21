const axios=require("axios");
const youtubeEndpoint=`https://www.youtube.com`;

let GetYoutubeInitData=async(url)=>{
    return new Promise((resolve,reject)=>{
        axios.get(encodeURI(url)).then(page => {
            const data = page.data.split('var ytInitialData =')[1]
                .split("</script>")[0]
                .slice(0, -1);
            var apiToken =null;
            if (page.data.split("innertubeApiKey").length>0){
                apiToken = page.data.split("innertubeApiKey")[1].trim().split(",")[0].split('"')[2];
            }
            var context = null;
            if (page.data.split('INNERTUBE_CONTEXT').length>0){
                context = JSON.parse(page.data.split('INNERTUBE_CONTEXT')[1].trim().slice(2, -2));
            }

            const initdata = JSON.parse(data);
            resolve({ initdata, apiToken, context})
        }).catch(err=>{
            console.error(err);
            reject(err);
        });
    });
};

let GetData=async (keyword,withPlaylist=false)=>{
    let endpoint=`${youtubeEndpoint}/results?search_query=${keyword}`;
    return new Promise((resolve, reject)=>{
        GetYoutubeInitData(endpoint).then(page=>{
            const sectionListRenderer = page.initdata.contents
                .twoColumnSearchResultsRenderer
                .primaryContents
                .sectionListRenderer;
            const contToken = sectionListRenderer.contents[1].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            const apiToken = page.apiToken;
            const context = page.context;
            let items = [];
            sectionListRenderer.contents[0].itemSectionRenderer.contents.forEach((item) => {
                
                if(item.channelRenderer){
                    let channelRenderer=item.channelRenderer;
                    items.push({ id: channelRenderer.channelId, type: 'channel', thumbnail: channelRenderer.thumbnail, title: channelRenderer.title.simpleText });
                }else{
                    let videoRender = item.videoRenderer;
                    let playListRender = item.playlistRenderer;
                    let isLive=false;
                    if (videoRender && videoRender.videoId) {
                        if(videoRender.badges&&videoRender.badges.length>0&&videoRender.badges[0].metadataBadgeRenderer&&videoRender.badges[0].metadataBadgeRenderer.style=="BADGE_STYLE_TYPE_LIVE_NOW"){
                            isLive=true;
                        }
                        items.push({ id: videoRender.videoId, type: 'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText,isLive:isLive });
                    }
                    if (withPlaylist) {
                        if (playListRender && playListRender.playlistId) {
                            console.log(playListRender.videoCount)
                            items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: playListRender.videos, videoCount: playListRender.videoCount,isLive:false});
                        }
                    }
                }
                
            });
            let nextPageContext = { context: context, continuation: contToken };
            resolve({ items: items, nextPage: { nextPageToken: apiToken, nextPageContext: nextPageContext } });
        }).catch(err => {
            console.error(err);
            reject(err);
        });
    });
};

let nextPage = async (nextPage, withPlaylist=false)=>{
    let endpoint=`${youtubeEndpoint}/youtubei/v1/search?key=${nextPage.nextPageToken}`;
    return new Promise((resolve, reject)=>{
        axios.post(encodeURI(endpoint),nextPage.nextPageContext).then(page=>{
            let item1=page.data.onResponseReceivedCommands[0].appendContinuationItemsAction;
            let items=[];
            item1.continuationItems[0].itemSectionRenderer.contents.forEach((item,index)=>{
                let videoRender = item.videoRenderer;
                let playListRender = item.playlistRenderer;
                let isLive=false;
                if (videoRender && videoRender.videoId) {
                    if(videoRender.badges&&videoRender.badges.length>0&&videoRender.badges[0].metadataBadgeRenderer&&videoRender.badges[0].metadataBadgeRenderer.style=="BADGE_STYLE_TYPE_LIVE_NOW"){
                        isLive=true;
                    }
                    items.push({ id: videoRender.videoId, type: 'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText,isLive:isLive });
                }
                if (withPlaylist) {
                    if (playListRender && playListRender.playlistId) {
                        items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: GetPlaylistData(playListRender.playlistId) });
                    }
                }
            });
            nextPage.nextPageContext.continuation=item1.continuationItems[1].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            resolve({items:items,nextPage:nextPage});
        }).catch(err=>{
            console.error(err);
            reject(err);
        });
    });
};

let GetPlaylistData = async (playlistId) => {
    let endpoint = `${youtubeEndpoint}/playlist?list=${playlistId}`;
    return new Promise((resolve, reject) => {
        GetYoutubeInitData(endpoint).then(initData => {
            const sectionListRenderer = initData.initdata;
            const metadata = sectionListRenderer.metadata;
            const videoItems = sectionListRenderer.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents[0].playlistVideoListRenderer.contents
            let items = [];
            videoItems.forEach(item=>{
                let videoRender = item.playlistVideoRenderer;
                if(videoRender&&videoRender.videoId){
                    items.push({ id: videoRender.videoId, type: 'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText });
                }
            });
            resolve({ items: items, metadata: metadata });
        }).catch(err => {
            console.error(err);
            reject(err);
        });
    });
};

let GetSuggestData=async ()=>{
    let endpoint=`${youtubeEndpoint}`;
    return new Promise(async(resolve,reject)=>{
        GetYoutubeInitData(endpoint).then(page=>{
            const sectionListRenderer = page.initdata.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.richGridRenderer.contents;
            let items = [];
            let otherItems=[];
            sectionListRenderer.forEach(item=>{
                if(item.richItemRenderer&&item.richItemRenderer.content){
                    let videoRender=item.richItemRenderer.content.videoRenderer;
                    let isLive=false;
                    if (videoRender && videoRender.videoId) {
                        if(videoRender.badges&&videoRender.badges.length>0&&videoRender.badges[0].metadataBadgeRenderer&&videoRender.badges[0].metadataBadgeRenderer.style=="BADGE_STYLE_TYPE_LIVE_NOW"){
                            isLive=true;
                        }
                        items.push({ id: videoRender.videoId, type: 'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText,isLive:isLive  });
                    }else{
                        otherItems.push(videoRender);
                    }
                }
            });
            resolve({ items: items});
        }).catch(err=>{
            console.error(err);
            reject(err);
        });
    });
};

exports.GetListByKeyword=GetData;
exports.NextPage=nextPage;
exports.GetPlaylistData = GetPlaylistData;
exports.GetSuggestData=GetSuggestData;