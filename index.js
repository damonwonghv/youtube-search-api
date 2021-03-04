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
        GetYoutubeInitData(endpoint).then(async page=>{
            const sectionListRenderer =await page.initdata.contents
                .twoColumnSearchResultsRenderer
                .primaryContents
                .sectionListRenderer;
            let contToken =await {};
            let items =await [];
            await sectionListRenderer.contents.forEach(content=>{
                if(content.continuationItemRenderer){
                    contToken=content.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                }else if(content.itemSectionRenderer){
                    content.itemSectionRenderer.contents.forEach((item) => {
                        if(item.channelRenderer){
                            let channelRenderer=item.channelRenderer;
                            items.push({ id: channelRenderer.channelId, type: 'channel', thumbnail: channelRenderer.thumbnail, title: channelRenderer.title.simpleText });
                        }else{
                            let videoRender = item.videoRenderer;
                            let playListRender = item.playlistRenderer;
                            
                            if (videoRender && videoRender.videoId) {
                                items.push(VideoRender(item));
                            }
                            if (withPlaylist) {
                                if (playListRender && playListRender.playlistId) {
                                    items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: playListRender.videos, videoCount: playListRender.videoCount,isLive:false});
                                }
                            }
                        }
                    });
                }
            });            
            const apiToken =await page.apiToken;
            const context =await page.context;
            let nextPageContext = await{ context: context, continuation: contToken };
            await resolve({ items: items, nextPage: { nextPageToken: apiToken, nextPageContext: nextPageContext } });
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
            item1.continuationItems.forEach(conitem=>{
                console.log(conitem);
                if(conitem.itemSectionRenderer){
                    conitem.itemSectionRenderer.contents.forEach((item,index)=>{
                        let videoRender = item.videoRenderer;
                        let playListRender = item.playlistRenderer;
                        if (videoRender && videoRender.videoId) {
                            items.push(VideoRender(item));
                        }
                        if (withPlaylist) {
                            if (playListRender && playListRender.playlistId) {
                                items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: GetPlaylistData(playListRender.playlistId) });
                            }
                        }
                    });
                }else if(conitem.continuationItemRenderer){
                    nextPage.nextPageContext.continuation=conitem.continuationItemRenderer.continuationEndpoint.continuationCommand.token;
                }
                
            });            
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
                    items.push(VideoRender(item));
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
                    if (videoRender && videoRender.videoId) {
                        items.push(VideoRender(item.richItemRenderer.content));
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

let GetChannelById=async (channelId)=>{
    return new Promise((resolve, reject)=>{
        let endpoint=`${youtubeEndpoint}/channel/${channelId}`;
        let items=[];
        GetYoutubeInitData(endpoint).then(page=>{
            let tabs=page.initdata.contents.twoColumnBrowseResultsRenderer.tabs;
            tabs.forEach(async tab=>{
                await items.push(TabRender(tab));
            });
            resolve(items);
        }).catch(err=>{
            reject(err);
        });
    });
}

let VideoRender=(json)=>{
    try{
        if(json&&(json.videoRenderer||json.playlistVideoRenderer)){
            let videoRenderer= null;
            if(json.videoRenderer){
                videoRenderer=json.videoRenderer
            }else if(json.playlistVideoRenderer){
                videoRenderer=json.playlistVideoRenderer
            }
            var isLive=false;
            if(videoRenderer.badges&&videoRenderer.badges.length>0&&videoRenderer.badges[0].metadataBadgeRenderer&&videoRenderer.badges[0].metadataBadgeRenderer.style=="BADGE_STYLE_TYPE_LIVE_NOW"){
                isLive=true;
            }
            if(videoRenderer.thumbnailOverlays){
                videoRenderer.thumbnailOverlays.forEach(item=>{
                    if(item.thumbnailOverlayTimeStatusRenderer&&item.thumbnailOverlayTimeStatusRenderer.style&&item.thumbnailOverlayTimeStatusRenderer.style=="LIVE"){
                        isLive=true;
                    }
                });
            }
            let id=videoRenderer.videoId;
            let thumbnail=videoRenderer.thumbnail;
            let title=videoRenderer.title.runs[0].text;
            let lengthText=(videoRenderer.lengthText)?videoRenderer.lengthText:'';
            return { id: id, type: 'video', thumbnail: thumbnail, title: title, length: lengthText,isLive:isLive };
        }else{
            return {};
        }
    }catch(ex){
        throw ex;
    }
}

let TabRender=(json)=>{
    let items=[];
    if(json&&json.tabRenderer){
        let tabRenderer=json.tabRenderer;
        let title=tabRenderer.title;
        let content=tabRenderer.content;
        items.push({title,content});
        return items;
    }else{
        return [];
    }
}

exports.GetListByKeyword=GetData;
exports.NextPage=nextPage;
exports.GetPlaylistData = GetPlaylistData;
exports.GetSuggestData=GetSuggestData;
exports.GetChannelById=GetChannelById;