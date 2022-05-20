# b站 播放器旋转插件 （bilibili player rotate）

## 安装指南

使用油猴脚本（tampermonkey）安装，安装地址  https://greasyfork.org/zh-CN/scripts/438224-bilibili-%E8%A7%86%E9%A2%91%E6%97%8B%E8%BD%AC

## 使用说明

安装完成后，打开b站网页，看视频时，播放器会多出一个旋转的icon，点击即可旋转

![image](https://github.com/yukinotech/bili-rotate/blob/main/readme-img/img1.jpg)

## 开发指南

### dev server

通过 dev server能更加方便的调试油猴脚本

1、将dev.js内容粘贴到油猴脚本编辑器中保存，开发过程中不必再次修改此文件。此文件通过引入本地服务器的js，从而做到动态更新

```js
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
```

2、启动本地服务器,3000端口上部署着index.js

```js
npm install
npm run dev
```
或者
```js
yarn
yarn dev
```

3、本地修改index.js，刷新对应网页，油猴脚本即可自动更新，方便开发
