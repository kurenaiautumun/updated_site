function changeClass(choice){
    console.log("change class")
    let elem = document.getElementsByClassName("dropdown-content")[0]
    console.log(elem.style.display)
    if (elem.style.display==""){
        elem.style.display = "block"
    }
    else{
        elem.style.display = ""
    }
}

async function userData(){
    let token = localStorage.getItem("token")
    let data = await fetch("/currentUser", {
        method: "GET",
        headers:{
            "Content-type": "application/json",
            'Authorization': "Bearer " + token
        }   
    })

    let userDetails = await data.json()

    return userDetails
}
    async function newBlog(){
    const userDetails = await userData();
    const blog = {
        "userId": userDetails.user._id,
        "title": "Title",
        "views": 0,
        "status": "draft",
        "titleImage": "https://kurenai-image-testing.s3.ap-south-1.amazonaws.com/logo-removebg-preview.png",
        "userName": userDetails.user._id,
    }
    let data = await fetch("/newBlog",{
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(blog)
    })

    let blogs = await data.json()

    console.log("data = ", blogs)

    window.location.href = `/write?blogId=${blogs.blog._id}`
}

function setWriteBlog(){
    let doc = document.getElementById("write_blog")
    console.log(localStorage.getItem("user"))
    if (localStorage.getItem("user")){
        let elem = `
        <a class="nav_manu_link write_nav_btn r-flex ali-c">
            <svg width="16" height="16" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.847 0.543159L21.4504 1.14002C22.2818 1.9635 22.156 3.42329 21.1671 4.40053L8.72436 16.7091L4.69301 18.1679C4.18679 18.352 3.69387 18.1133 3.59365 17.6368C3.55978 17.464 3.57572 17.2852 3.63967 17.1209L5.14299 13.0986L17.551 0.823382C18.5399 -0.15386 20.0156 -0.280315 20.847 0.543159ZM8.18132 1.76724C8.31562 1.76724 8.44861 1.79341 8.57268 1.84425C8.69676 1.89509 8.80949 1.9696 8.90446 2.06354C8.99942 2.15748 9.07475 2.269 9.12614 2.39174C9.17754 2.51448 9.20399 2.64603 9.20399 2.77888C9.20399 2.91173 9.17754 3.04328 9.12614 3.16602C9.07475 3.28875 8.99942 3.40028 8.90446 3.49421C8.80949 3.58815 8.69676 3.66267 8.57268 3.71351C8.44861 3.76435 8.31562 3.79052 8.18132 3.79052H4.09066C3.54821 3.79052 3.02797 4.00368 2.64439 4.38312C2.26082 4.76256 2.04533 5.27719 2.04533 5.81379V17.9534C2.04533 18.4901 2.26082 19.0047 2.64439 19.3841C3.02797 19.7636 3.54821 19.9767 4.09066 19.9767H16.3626C16.9051 19.9767 17.4253 19.7636 17.8089 19.3841C18.1925 19.0047 18.408 18.4901 18.408 17.9534V13.9069C18.408 13.6386 18.5157 13.3813 18.7075 13.1916C18.8993 13.0018 19.1594 12.8953 19.4306 12.8953C19.7019 12.8953 19.962 13.0018 20.1538 13.1916C20.3456 13.3813 20.4533 13.6386 20.4533 13.9069V17.9534C20.4533 19.0267 20.0223 20.0559 19.2552 20.8148C18.488 21.5737 17.4476 22 16.3626 22H4.09066C3.00575 22 1.96528 21.5737 1.19813 20.8148C0.430979 20.0559 0 19.0267 0 17.9534V5.81379C0 4.74058 0.430979 3.71132 1.19813 2.95245C1.96528 2.19357 3.00575 1.76724 4.09066 1.76724H8.18132Z" fill="#ffffff"/>
            </svg>
            <span onclick=newBlog()>Write Blog</span>
        </a>
        `
        doc.innerHTML = elem
        }
    else{
        let elem = `
        <a class="nav_manu_link write_nav_btn r-flex ali-c" href="/login">
            <span>Sign up / Sign In</span>
        </a>
        `
        doc.innerHTML = elem
    }
}

function setProfile(){
    let doc = document.getElementById("profile_image")
        if (localStorage.getItem("user")){
            let elem = `
            <a class="nav_manu_link" onclick="changeClass()">
                <img style="max-height: 30px;" src="../user-bg.png">
                <br>
                <div class="dropdown-content">
                    <div>
                    <a class="profile_points" href="/dashboard"><div class="dropdown_a">Dashboard</div></a>
                    </div>
                    <a class="profile_points"  ><div class="dropdown_a" onclick="logout()">Signout</div></a>
                </div>
            </a>
            `
            doc.innerHTML = elem
            }
    }

    setProfile();
    setWriteBlog();

    async function logout(){
        let data = await fetch("/logout",{
            "method": "POST",
            headers: {
                "content-type": "application/json",
            },
        })
        let res = await data.json();

        console.log("res = ", res)

        localStorage.removeItem("user")
        localStorage.removeItem("token")

        window.location.href = "/"
    }