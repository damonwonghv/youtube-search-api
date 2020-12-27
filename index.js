const axios=require("axios");
let GetData=async (keyword,withPlaylist=false)=>{
    let endpoint=`https://www.youtube.com/results?search_query=${keyword}`;
    return new Promise((resolve, reject)=>{
        axios.get(encodeURI(endpoint)).then(page=>{
            const data = page.data.split('var ytInitialData =')[1]
                        .split("</script>")[0]
                        .slice(0,-1)
            const sectionListRenderer= JSON.parse(data).contents
                        .twoColumnSearchResultsRenderer
                        .primaryContents
                        .sectionListRenderer;
            const contToken=sectionListRenderer.contents[1].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            const apiToken=page.data.split("innertubeApiKey")[1].trim().split(",")[0].split('"')[2];
            const context=JSON.parse(page.data.split('INNERTUBE_CONTEXT')[1].trim().slice(2,-2));
            let items=[];
            sectionListRenderer.contents[0].itemSectionRenderer.contents.forEach((item,index)=>{
                let videoRender=item.videoRenderer;
                let playListRender = item.playlistRenderer;
                if (videoRender && videoRender.videoId){
                    items.push({ id: videoRender.videoId,type:'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText});
                }
                if (withPlaylist){
                    if (playListRender && playListRender.playlistId) {
                        items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: playListRender.videos });
                    }
                }
                

            });
            let nextPageContext={context:context,continuation:contToken};
            resolve({items:items,nextPage:{nextPageToken:apiToken,nextPageContext:nextPageContext}});
            
        }).catch(err=>{
            console.error(err);
            reject(err);
        });
    });
};

let nextPage = async (nextPage, withPlaylist=false)=>{
    let endpoint=`https://www.youtube.com/youtubei/v1/search?key=${nextPage.nextPageToken}`;
    return new Promise((resolve, reject)=>{
        axios.post(encodeURI(endpoint),nextPage.nextPageContext).then(page=>{
            let item1=page.data.onResponseReceivedCommands[0].appendContinuationItemsAction;
            let items=[];
            item1.continuationItems[0].itemSectionRenderer.contents.forEach((item,index)=>{
                let videoRender = item.videoRenderer;
                let playListRender = item.playlistRenderer;
                if (videoRender && videoRender.videoId) {
                    items.push({ id: videoRender.videoId, type: 'video', thumbnail: videoRender.thumbnail, title: videoRender.title.runs[0].text, length: videoRender.lengthText });
                }
                if (withPlaylist) {
                    if (playListRender && playListRender.playlistId) {
                        items.push({ id: playListRender.playlistId, type: 'playlist', thumbnail: playListRender.thumbnails, title: playListRender.title.simpleText, length: playListRender.videoCount, videos: playListRender.videos });
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

exports.GetListByKeyword=GetData;
exports.NextPage=nextPage;