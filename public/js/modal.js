function showModal(){
    let modal = document.getElementById("genModal");
    console.log("modal = ", modal);
    modal.style.display = "block";
}

function closeModal(){
    let modal = document.getElementById("genModal");
    console.log("modal = ", modal)
    modal.style.display = "none";
}

function editModal(content){
    let modal = document.getElementsByClassName("genModal-content")[0]
    console.log("modal = ", modal)
    let div = document.createElement('div')
    div.innerHTML = content

    modal.append(div)
}

function timedModal(){
    showModal();
    setTimeout(closeModal, 5000);
}


function isStory() {
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
    console.log("blogid in params" + params["story"]);
    return params["story"];
  }