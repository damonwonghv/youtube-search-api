let youtube=require("../index");


youtube.GetListByKeyword('JS Developer',true).then(res=>{
    console.log("Page1");
    console.log(res);
    youtube.NextPage(res.nextPage,true).then(result=>{
        console.log("Page2");
        console.log(result);
      }).catch(err=>{
          console.log(err);
      });
}).catch(err=>{
    console.log(err);
});

youtube.GetPlaylistData('PLZCZY5m1Qr1nF4wkr1Ly4dG7ehSP-Qom8').then(res=>{
    console.log("Playlist results")
    console.log(res);
}).catch(err=>{
    console.log(err);
});
