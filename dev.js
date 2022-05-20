// ==UserScript==
// @author          yukinotech
// @namespace       yukinotech
// @name            bilibili b站 视频 旋转
// @name:en         bilibili player rotate
// @description     bilibili 视频 旋转 插件
// @description:en  bilibili b站 player rotate plugin
// @include         http*://*.bilibili.com/video/*
// @license MIT
// ==/UserScript==

let newScript = document.createElement("script")
newScript.type = "text/javascript"
newScript.src = "http://127.0.0.1:3000"
document.body.appendChild(newScript)
