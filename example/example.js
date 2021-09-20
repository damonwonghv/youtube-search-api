let youtube=require("../index");

// Search by keyword example (Without limit) & with NextPage function
youtube.GetListByKeyword('JS Developer',true).then(res=>{
    console.log("Page1", res);

    const page2 = await youtube.NextPage(res.nextPage,true);
    console.log("Page2", page2);

    const page3 = await youtube.NextPage(result.nextPage,true)
    console.log("Page3", page3);

}).catch(err=>{
    console.log(err);
});

// Search by keyword (With limit: 5)
youtube.GetListByKeyword('JS Developer', true, 5).then(res=>{
    console.log("Page1");
    console.log(res);
}).catch(err=>{
    console.log(err);
});

// Get YouTube playlist using playlist ID
youtube.GetPlaylistData('PLZCZY5m1Qr1nF4wkr1Ly4dG7ehSP-Qom8').then(res=>{
    console.log("Playlist results")
    console.log(res);
}).catch(err=>{
    console.log(err);
});

//Get YouTube playlist using playlist ID (With limit: 5)
youtube.GetPlaylistData('PLZCZY5m1Qr1nF4wkr1Ly4dG7ehSP-Qom8', 5).then(res=>{
    console.log("Playlist results")
    console.log(res);
}).catch(err=>{
    console.log(err);
});


// Get suggested YouTube videos (From YouTube Homepage)
youtube.GetSuggestData().then(res=>{
    console.log(res);
}).catch(err=>{
    console.log(err);
});

// Get suggested YouTube videos (From YouTube Homepage) -- (With limit: 5)
youtube.GetSuggestData(5).then(res=>{
    console.log(res);
}).catch(err=>{
    console.log(err);
});

// Get channel videos using channel ID
youtube.GetChannelById(`UCj-Xm8j6WBgKY8OG7s9r2vQ`).then(res=>{
    console.log(res);
}).catch(err=>{
    console.log(err);
});

// Get channel videos using channel ID (With limit: 5)
youtube.GetChannelById(`UCj-Xm8j6WBgKY8OG7s9r2vQ`, 5).then(res=>{
    console.log(res);
}).catch(err=>{
    console.log(err);
});