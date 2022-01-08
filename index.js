// ==UserScript==
// @author          yukinotech
// @namespace       yukinotech
// @name            bilibili 视频旋转
// @name:en         bilibili player rotate
// @version         1.0
// @description     bilibili 视频旋转插件
// @description:en  bilibili player rotate plugin
// @include         http*://*.bilibili.com/video/*
// @license MIT
// ==/UserScript==

;(async function () {
  console.log("rotate init start")
  // ****** utils 函数 ******
  let waitToGet = (fn, time) => {
    return new Promise((resolve, reject) => {
      let c = () => {
        setTimeout(() => {
          let leftAgs = [...arguments].slice(2)
          let rtn = fn(...leftAgs)
          if (rtn) {
            resolve(rtn)
          } else {
            c()
          }
        }, time)
      }
      c()
    })
  }
  // ****** video 旋转处理部分 ******
  let video = await waitToGet(() => {
    return document.getElementsByClassName("bilibili-player-video")?.[0]
  }, 600)
  console.log(video, 1)

  let videoWrap = await waitToGet(() => {
    return document.getElementsByClassName("bilibili-player-video-wrap")?.[0]
  }, 600)

  let realVideo = video.childNodes[0]

  // videoWrap:div -> video:div -> realVideo:video
  video.style.height = "100%"
  video.style.width = "100%"
  video.style.display = "flex"
  video.style["justify-content"] = "center"
  video.style["align-items"] = "center"
  video.style.margin = "0"
  video.style.padding = "0"
  // deg 标记旋转角度
  let deg = 0

  // 旋转时处理宽高
  let rotate = () => {
    deg = (deg + 90) % 360
    realVideo.style.transform = `rotate(${deg}deg)`
    let { height, width } = window.getComputedStyle(videoWrap)
    // 旋转，deg为下一状态
    if (deg === 90 || deg === 270) {
      realVideo.style.width = height
    } else {
      realVideo.style.width = width
      realVideo.style.height = height
    }
    console.log("rotate height", height)
    console.log("rotate width", width)
    console.log("rotate deg", deg)
  }

  // 播放器父元素的大小发生变化时，处理宽高
  let observer = new MutationObserver((mutationList) => {
    let { height, width } = window.getComputedStyle(videoWrap)
    // 非旋转，deg即为当前状态
    if (deg === 0 || deg === 180) {
      // 这里b站会自动重置，video的宽高，可以加延迟解决
      setTimeout(() => {
        realVideo.style.width = width
        realVideo.style.height = height
      }, 100)
    } else {
      setTimeout(() => {
        realVideo.style.width = height
      }, 100)
    }
    console.log("observer height", height)
    console.log("observer width", width)
    console.log("observer deg", deg)
  })

  let playerStyleTag = await waitToGet(() => {
    return document.getElementById("setSizeStyle")
  }, 600)
  observer.observe(playerStyleTag, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    attributes: true, // 观察属性变动
    subtree: true, // 观察后代节点，默认为 false
  })

  // ****** button 部分 ******

  // 找到播放底栏父元素
  let controlRight = await waitToGet(() => {
    return document.getElementsByClassName(
      "bilibili-player-video-control-bottom-right"
    )?.[0]
  }, 600)

  console.log("controlRight", controlRight)

  // 调试使用，强制底栏常驻
  // let controlBottom = await waitToGet(() => {
  //   return document.getElementsByClassName(
  //     "bilibili-player-video-control-bottom"
  //   )?.[0]
  // }, 300)

  // controlBottom.style.opacity = "1"
  // controlBottom.style.visibility = "visible"

  // 构造button div，绑定事件，并插入文档
  let buttonSvg = `<svg viewBox="0 0 1536 1536" aria-labelledby="rwsi-awesome-repeat-title" id="si-awesome-repeat" width="100%" height="100%"><title id="rwsi-awesome-repeat-title">icon repeat</title><path d="M1536 128v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l138-138Q969 256 768 256q-104 0-198.5 40.5T406 406 296.5 569.5 256 768t40.5 198.5T406 1130t163.5 109.5T768 1280q119 0 225-52t179-147q7-10 23-12 14 0 25 9l137 138q9 8 9.5 20.5t-7.5 22.5q-109 132-264 204.5T768 1536q-156 0-298-61t-245-164-164-245T0 768t61-298 164-245T470 61 768 0q147 0 284.5 55.5T1297 212l130-129q29-31 70-14 39 17 39 59z"></path></svg>`
  let buttonDiv = document.createElement("div")
  buttonDiv.style.width = "17px"
  buttonDiv.style.height = "17px"
  buttonDiv.style.fill = "#fff"
  buttonDiv.style.margin = "3px 6px"
  buttonDiv.style.cursor = "pointer"
  buttonDiv.innerHTML = buttonSvg
  console.log("beforeinsert")
  controlRight.insertBefore(buttonDiv, controlRight.childNodes[6])
  console.log("after")
  buttonDiv.addEventListener("click", rotate)

  console.log("rotate init end")
})()
