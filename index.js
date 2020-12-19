const axios=require("axios");
let GetData=async (keyword)=>{
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
                        console.log(sectionListRenderer);
            const contToken=sectionListRenderer.contents[1].continuationItemRenderer.continuationEndpoint.continuationCommand.token;
            const apiToken=page.data.split("innertubeApiKey")[1].trim().split(",")[0].split('"')[2];
            const context=JSON.parse(page.data.split('INNERTUBE_CONTEXT')[1].trim().slice(2,-2));
            let items=[];
            sectionListRenderer.contents[0].itemSectionRenderer.contents.forEach((item,index)=>{
                let render=item.videoRenderer;
                if(render&&render.videoId){
                    items.push({id:render.videoId,thumbnail:render.thumbnail,title:render.title.runs[0].text,length:render.lengthText});
                }
            });
            resolve({items:items,apiToken:apiToken,continuation:contToken,context:context});
            
        }).catch(err=>{
            console.log(err);
            reject(err);
        });
    });
};

let nextPage=async (token,data)=>{
    let endpoint=`https://www.youtube.com/youtubei/v1/search?key=${token}`;
    return new Promise((resolve, reject)=>{
        axios.post(encodeURI(endpoint),data).then(page=>{
            let item1=page.data.onResponseReceivedCommands[0].appendContinuationItemsAction;
            let items=[];
            item1.continuationItems[0].itemSectionRenderer.contents.forEach((item,index)=>{
                let render=item.videoRenderer;
                if(render&&render.videoId){
                    items.push({id:render.videoId,thumbnail:render.thumbnail,title:render.title.runs[0].text,length:render.lengthText});
                }
            });
            resolve({items:items,continuation:item1.continuationItems[1].continuationItemRenderer.continuationEndpoint.continuationCommand.token})
        }).catch(err=>{
            console.log(err);
            reject(err);
        });
    });
};

exports.GetListByKeyword=GetData;
exports.NextPage=nextPage;