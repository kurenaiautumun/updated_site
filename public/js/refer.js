function getParams(name) {
    var idx = document.URL.indexOf("?");
    var params = {};
    if (idx != -1) {
      var pairs = document.URL.substring(
        idx + 1,
        document.URL.length
      ).split("&");
      for (var i = 0; i < pairs.length; i++) {
        nameVal = pairs[i].split("=");
        params[nameVal[0]] = nameVal[1];
      }
    }
    console.log("blogid in params" + params["blogId"]);
    return params[name];
  }


async function socialPoints() {
    let blogId = await getParams("blogId");
    if (await blogId==null){
        blogId = window.location.href
    }
    let referral_code = await getParams("referral");
    console.log("referral code = ", referral_code);
    if (referral_code != undefined) {
      let data = await fetch(
        `socialPublicity?blogId=${await blogId}&referral=${await referral_code}`,
        {
          method: "GET",
          headers: {
            "content-type": "application/json",
          },
        }
      );

      let res = await data.json();
    } else {
      console.log("There was no referral code");
    }
    publicity = 1;
  }

socialPoints();