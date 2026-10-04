// ==UserScript==
// @author          yukinotech
// @namespace       yukinotech
// @github          https://github.com/yukinotech/bili-rotate
// @name            bilibili b站 视频 旋转
// @name:en         bilibili player rotate
// @version         1.1.1
// @description     bilibili 视频 旋转 插件
// @description:en  bilibili b站 player rotate plugin
// @include         http*://*.bilibili.com/video/*
// @license MIT
// ==/UserScript==

;(async function () {
  console.log("rotate init start xxxxx")
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
  let getNumFromPx = (pxStr) => {
    return Number(pxStr.replace("px", ""))
  }
  let numToPx = (num) => {
    return String(num.toFixed(2)) + "px"
  }
  // ****** 全局初始化  ******
  let playerStyleTag = await waitToGet(() => {
    return document.getElementById("setSizeStyle")
  }, 600)
  // ****** video 旋转处理部分 ******
  // 使用全局变量，因为会出现页面内刷新的情况，变量需要实时指向最新的dom标签，便于赋值刷新
  // 页面层级结构： 1、变量名:dom名  2、外层->里层
  // video:div -> realVideo:video || realVideo:bwp-video

  // video：包裹player的中层div
  let video
  // realVideo：实际video标签，或者bwp-video标签
  let realVideo
  // deg：旋转角度
  let deg
  // realVideo_H_W_Ratio：视频原始高比宽
  let realVideo_H_W_Ratio
  // 容器尺寸监听器：进入真全屏时 b 站播放器有展开动画，
  // MutationObserver 的延迟重算可能量到过渡中的尺寸，导致画面不铺满；
  // ResizeObserver 会在容器实际尺寸稳定后再次触发，保证最终贴合
  let containerResizeObserver

  // 获取视频真实高宽比
  // 优先读取 videoWidth/videoHeight（视频自带原始尺寸，不受容器和css影响），
  // 元数据未就绪时退回 computed style 测量，两者都不可用时保持上次结果或默认横屏
  let getRatio = () => {
    if (realVideo.videoWidth > 0 && realVideo.videoHeight > 0) {
      return realVideo.videoHeight / realVideo.videoWidth
    }
    let { height, width } = window.getComputedStyle(realVideo)
    let w = getNumFromPx(width)
    let h = getNumFromPx(height)
    if (w > 0 && h > 0) {
      return h / w
    }
    return realVideo_H_W_Ratio || 9 / 16
  }

  // video逻辑初始化部分
  let videoInit = async () => {
    video = await waitToGet(() => {
      return (
        document.getElementsByClassName("bilibili-player-video")?.[0] ||
        document.getElementsByClassName("bpx-player-video-wrap")?.[0]
      )
    }, 600)

    // 精确匹配真实视频标签，避免 childNodes[0] 命中空白文本节点导致后续样式操作报错
    realVideo = video.querySelector("video,bwp-video") || video.childNodes[0]

    video.style.height = "100%"
    video.style.width = "100%"
    // 作为 realVideo 绝对定位的基准
    video.style.position = "relative"
    video.style.display = "flex"
    video.style["justify-content"] = "center"

    realVideo.style.margin = "0"
    realVideo.style.padding = "0"
    realVideo.style["object-fit"] = "contain"
    // 绝对定位 + translate(-50%,-50%)：元素中心始终钉在容器中心，
    // 旋转前后视觉中心稳定，不依赖 flex 对齐和容器宽高比
    realVideo.style.position = "absolute"
    realVideo.style.left = "50%"
    realVideo.style.top = "50%"
    // 避免 b 站自带的 max-width/max-height 干扰显式计算的宽高
    realVideo.style["max-height"] = "none"
    realVideo.style["max-width"] = "none"
    // mask 会让视频脱离浏览器的硬件视频叠加层（MPO）渲染：
    // Edge/AMD 显卡下叠加层无法合成被旋转的视频平面，90°/270° 会整块黑屏
    realVideo.style.webkitMaskImage = "linear-gradient(#fff, #fff)"
    realVideo.style.maskImage = "linear-gradient(#fff, #fff)"
    // 容器开启 3D 上下文，配合下方 rotate3d 使用
    video.style.perspective = "10000px"

    realVideo_H_W_Ratio = getRatio()
    // deg 标记旋转角度
    deg = 0
    resetHW()

    // 监听容器实际尺寸变化（真全屏动画、窗口缩放、宽屏模式切换等），
    // 结束尺寸稳定后自动重新适配；先断开旧监听避免重复叠加
    if (containerResizeObserver) {
      containerResizeObserver.disconnect()
    }
    containerResizeObserver = new ResizeObserver(() => {
      resetHW()
    })
    containerResizeObserver.observe(video)
  }
  // 旋转时回调函数
  let rotate = () => {
    deg = (deg + 90) % 360
    resetHW()
  }
  // 重置宽高
  let resetHW = () => {
    // 播放器初始化/切换期间节点可能已失效，直接跳过，等 videoInit 重新接管
    if (!video || !realVideo || !video.isConnected || !realVideo.isConnected) {
      return
    }
    let { height: videoContainerHeight, width: videoContainerWidth } =
      window.getComputedStyle(video)
    let containerH = getNumFromPx(videoContainerHeight)
    let containerW = getNumFromPx(videoContainerWidth)
    if (!(containerH > 0) || !(containerW > 0)) {
      return
    }

    // 每次都重新校验宽高比：视频元数据可能晚于首次初始化到达，
    // 切集/切清晰度后比例也可能变化，用旧比例会走错分支导致黑屏
    realVideo_H_W_Ratio = getRatio()
    let ratio = realVideo_H_W_Ratio

    // 计算“贴合容器(contain)”的元素宽高：
    // 未旋转(0/180)：视觉宽高 = 元素宽高
    // 旋转90/270：视觉宽 = 元素高，视觉高 = 元素宽
    let elWidth
    if (deg === 90 || deg === 270) {
      elWidth = Math.min(containerH, containerW / ratio)
    } else {
      elWidth = Math.min(containerW, containerH / ratio)
    }
    let elHeight = elWidth * ratio

    realVideo.style.width = numToPx(elWidth)
    realVideo.style.height = numToPx(elHeight)
    // translate 先把元素中心对到容器中心，rotate 再绕元素中心旋转，
    // 任意角度、任意容器比例下画面都居中且完整可见。
    // 用 rotate3d 走 3D 合成路径：Edge/AMD 显卡开启硬件视频叠加层时，
    // 2D rotate 旋转视频会渲染成黑屏（布局正确但像素不显示）
    realVideo.style.transform = `translate(-50%, -50%) rotate3d(0, 0, 1, ${deg}deg)`
  }
  // 按钮初始化部分
  let buttonInit = async () => {
    // 找到播放底栏父元素
    let controlRight = await waitToGet(() => {
      return (
        document.getElementsByClassName(
          "bilibili-player-video-control-bottom-right"
        )?.[0] ||
        document.getElementsByClassName("bpx-player-control-bottom-right")?.[0]
      )
    }, 600)

    // 调试用代码 begin ：强制底栏常驻

    // let controlBottom = await waitToGet(() => {
    //   return document.getElementsByClassName(
    //     "bilibili-player-video-control-bottom"
    //   )?.[0]
    // }, 300)

    // controlBottom.style.opacity = "1"
    // controlBottom.style.visibility = "visible"

    // 调试用代码 end ：强制底栏常驻

    // 构造button div，绑定事件，并插入文档
    let buttonSvg = `<svg viewBox="0 0 1536 1536" aria-labelledby="rwsi-awesome-repeat-title" id="si-awesome-repeat" width="100%" height="100%"><title id="rwsi-awesome-repeat-title">icon repeat</title><path d="M1536 128v448q0 26-19 45t-45 19h-448q-42 0-59-40-17-39 14-69l138-138Q969 256 768 256q-104 0-198.5 40.5T406 406 296.5 569.5 256 768t40.5 198.5T406 1130t163.5 109.5T768 1280q119 0 225-52t179-147q7-10 23-12 14 0 25 9l137 138q9 8 9.5 20.5t-7.5 22.5q-109 132-264 204.5T768 1536q-156 0-298-61t-245-164-164-245T0 768t61-298 164-245T470 61 768 0q147 0 284.5 55.5T1297 212l130-129q29-31 70-14 39 17 39 59z"></path></svg>`
    let buttonDiv = document.createElement("div")
    buttonDiv.style.width = "17px"
    buttonDiv.style.height = "17px"
    buttonDiv.style.fill = "#fff"
    buttonDiv.style.margin = "3px 6px"
    buttonDiv.style.cursor = "pointer"
    buttonDiv.innerHTML = buttonSvg
    buttonDiv.id = "rotate-button"

    if (!document.getElementById("rotate-button")) {
      controlRight.insertBefore(buttonDiv, controlRight.childNodes[6])
    }

    buttonDiv.addEventListener("click", rotate)

    console.log("rotate init end")

    setTimeout(() => {
      if (!document.getElementById("rotate-button")) {
        // 存在b站在脚本的初始化之后执行，覆盖脚本，加一次兜底
        controlRight.insertBefore(buttonDiv, controlRight.childNodes[6])
      }
    }, 5000)
  }

  // ****** 第一次实际执行部分 ******

  await videoInit()
  await buttonInit()

  // ****** 监听部分 ******

  // 播放器父元素的大小发生变化时，处理宽高 回调
  let observer = new MutationObserver((mutationList) => {
    // console.log("播放器的大小change", mutationList)
    // 这里b站会自动重置css，包括video的宽高，可以加延迟解决
    if (mutationList.length !== 2) {
      // === 2时，为播放列表切换视频，应该走视频初始化流程
      console.log("handle size change")
      setTimeout(() => {
        resetHW()
      }, 100)
    }

    // 调试用代码 begin

    // let { height: videoContainerHeight, width: videoContainerWidth } =
    //   window.getComputedStyle(video)
    // let { height: realVideoHeight, width: realVideoWidth } =
    //   window.getComputedStyle(realVideo)
    // console.log("realVideoHeight", realVideoHeight)
    // console.log("realVideoWidth", realVideoWidth)
    // console.log("videoContainerHeight", videoContainerHeight)
    // console.log("videoContainerWidth", videoContainerWidth)

    // 调试用代码 end
  })

  // 监听播放器父元素的大小发生变化
  observer.observe(playerStyleTag, {
    childList: true,
    attributes: true,
    subtree: true,
  })

  // 播放列表里切换视频时，b站会初始化播放器。此处为初始化播放器的回调
  let videoSwitchObserver = new MutationObserver((mutationList) => {
    // console.log("视频切换change", mutationList?.["1"]?.type)
    // 页面往下滑，会触发画中画功能，造成初始化误判,增加条件判断
    if (mutationList?.["1"]?.type === "childList") {
      // 增加一个同步重置, 避免闪烁；保持元素居中，而不是回到偏移的左上角
      if (realVideo && realVideo.isConnected) {
        realVideo.style.transform = "translate(-50%, -50%)"
      }
      ;(async () => {
        console.log("**** handle init ****")
        await videoInit()
        await buttonInit()
      })()
    } else if (mutationList?.["1"]?.type === "attributes") {
      // 触发画中画功能，回来后需要重置宽高
      console.log("触发画中画功能，回来后需要重置宽高")
      setTimeout(() => {
        resetHW()
      }, 100)
    }
  })

  // 监听播放器是否初始化
  videoSwitchObserver.observe(document.getElementById("bilibili-player"), {
    childList: true,
    attributes: true,
  })
})()
