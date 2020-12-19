let youtube=require("../index");

youtube.GetListByKeyword("JS Developer").then(res=>{
    console.log("Page1");
    console.log(res);
    youtube.NextPage(res.nextPage).then(result=>{
        console.log("Page2");
        console.log(result);
      }).catch(err=>{
          console.log(err);
      });
}).catch(err=>{
    console.log(err);
});