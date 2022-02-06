// ==UserScript==
// @name        play all uploaded videos
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/*
// @grant       none
// @version     1.0
// @author      -
// @description 12/21/2021, 2:49:53 PM
// ==/UserScript==

//tasks:
//make playing of subs videos
//make playong of selected videos
//make reversing of queue
//make refucktoring

'use strict';

if (document.URL.match('embed')) {
  return;
}

fetch(`https://www.youtube.com/iframe_api`)
  .then(res => res.text())
  .then(apiCode => {
    const onYTIAPIReadyFunc = `function onYouTubeIframeAPIReady() {};`;
    const exec = `
      try{
        playAllUploadedVideos_app();
        console.log('script \"play all uploaded videos\" is ready');
      } catch (e) {
        console.error(e)
        alert('ERROR: script \"play all uploaded videos\"')
      }
    `;
    eval(onYTIAPIReadyFunc + apiCode + exec);
  });

const playAllUploadedVideos_app = async function () {
  const appState = {};

  const initialInterfaceElement = document.createElement('div');
  initialInterfaceElement.setAttribute('style', 'z-index: 2100; display: flex; position: fixed; width: 100%; font-size: 30px; cursor: pointer; justify-content: right;');
  const initialInterfaceElement_shadow = initialInterfaceElement.attachShadow({mode: 'open'});
  initialInterfaceElement_shadow.innerHTML = `
    <style>
    .butt {
      position: absolute;
      -webkit-user-select: none;         
      -moz-user-select: none; 
      -ms-user-select: none;
      user-select: none; 
    }
    .butt:active {
      opacity: .5
    }
    </style>
    <div class="butt" style="width: 113px; right: 277px;">
      <div style="width: 113px; height: 55px; background-color: red; opacity:0.6;position: absolute;"></div>
      <div style="position: absolute;margin: 9px;width: 95px;text-align: center; height: 55px;">Play all</div>
    </div>
    <div class="butt" style="width: 50px; right: 390px; display: none">
      <div style="width: 50px; height: 55px; background-color: green; opacity:0.6;position: absolute;"></div>
      <div style="position: absolute;margin: 9px;text-align: center;">📺</div>
    </div>`;
  const playAllButton = initialInterfaceElement_shadow.children[1];
  playAllButton.addEventListener('click', playAllVideos);
  const showPlayerButton = initialInterfaceElement_shadow.children[2];
  showPlayerButton.addEventListener('click', showPlayer);
  document.body.appendChild(initialInterfaceElement);
  
  const playerElementId = `DGhdrthdfgberTNdfBBryhdfjkdtYgHDrt6h4e5tE56ue5srhue5YTDHRthtydj43t325yerhJfGUYkYU7hgdYhtyTK66Dyjn`;
  const playerElement = document.createElement('div');
  playerElement.setAttribute('style', 'z-index: 2200;display: none; position: fixed; flex-direction: column; background-color: black;');
  playerElement.innerHTML = `
    <div></div>
    <div id="${playerElementId}"></div>
  `;
  const playerElementChild0_shadow = playerElement.children[0].attachShadow({mode: 'open'});
  playerElementChild0_shadow.innerHTML = `
    <style>
    :host{
      display:flex;
      flex-direction: row;
      font-size: 30px;
      width: 100%;
      justify-content: space-between;
    }
    .butt {
      padding:9px;
      cursor: pointer;
      -webkit-user-select: none;         
      -moz-user-select: none; 
      -ms-user-select: none;
      user-select: none; 
    }
    .butt:active {
      opacity: .5
    }
    </style>
    <div style="" class="butt">
      ⏮️
    </div>
    <div style="" class="butt">
      ⏯️
    </div>
    <div style="" class="butt">
      ⏭️
    </div>
    <div style="display: flex;flex-direction: row;">
      <div style="user-select: none;padding:9px;">
        0
      </div>
      <div style="user-select: none;padding:9px 0px 9px 0px;">
        /
      </div>
      <div style="user-select: none;padding:9px;">
        0
      </div>
    </div>
    <div style="" class="butt">
      add
    </div>
    <div style="" class="butt">
      🔄
    </div>
    <div style="" class="butt">
      ❌
    </div>
  `;
  playerElementChild0_shadow.children[1].addEventListener('click', selectPreviousVideo);
  playerElementChild0_shadow.children[2].addEventListener('click', pauseOrPlayVideo);
  playerElementChild0_shadow.children[3].addEventListener('click', selectNextVideo);
  const paginationCounter = playerElementChild0_shadow.children[4];
  playerElementChild0_shadow.children[5].addEventListener('click', addVideosToQueue);
  playerElementChild0_shadow.children[6].addEventListener('click', reverseQueue);
  playerElementChild0_shadow.children[7].addEventListener('click', hidePlayer);
  document.body.appendChild(playerElement);
  
  const playAllVideos = async function (e) {
    if (e) {
      e.preventDefault();
    }

    if (appState.currentURL === document.URL) {
      showPlayer();
      return;
    }
    
    appState.currentURL = document.URL;
    appState.playingVideoIndex = 0;
    delete appState.linkQueue;
    delete appState.isQueueReversed;

    appState.linkQueue = await loadVideoURLQueue();
    if(!appState.linkQueue.length) {
      alert(`
        ERROR: appState.linkQueue = loadVideoURLQueue(); !appState.linkQueue === true;
        There are some problems :3
      `)
      return;
    }
    paginationCounter.children[2].innerHTML = appState.linkQueue.length;
    paginationCounter.children[0].innerHTML = appState.playingVideoIndex + 1;

    showPlayer();
    if(!!appState.YTPlayer){
      appState.YTPlayer.loadVideoById(appState.linkQueue[appState.playingVideoIndex]);
      return;
    }
    spawnYTPlayer();
    showPlayerButton.style.display = 'block';
    
  }
  
  const loadVideoURLQueue = async function () {
    const links = [];
    let initialIndex = !!appState.linkQueue ? appState.linkQueue.length - 1 : 0;
    const maximum = initialIndex ? initialIndex + 100 : 100;

    const getVideoNodeList = function  () {
      let nodeList;
      switch (appState.pageSubtype) {
        case '.com/':
          document.querySelectorAll('ytd-browse').forEach(i => {
            if(i.innerHTML.match(/page-subtype="home"/)){
              nodeList = i.querySelector('ytd-two-column-browse-results-renderer')
                .querySelectorAll('ytd-rich-item-renderer.style-scope.ytd-rich-grid-row')
              if(!nodeList){
                throw console.error('FUCKING YOUTUBE FAGGOTS CHANGED SOMETHING');
              }
            }
          });
          break;
        case '/videos':
          document.querySelectorAll('ytd-browse').forEach(i => {
            if(i.innerHTML.match(/page-subtype="channels"/)){//
              nodeList = i.querySelector('ytd-two-column-browse-results-renderer')
                .querySelector('#items.style-scope.ytd-grid-renderer');
              if(!nodeList){
                throw console.error('FUCKING YOUTUBE FAGGOTS CHANGED SOMETHING');
              }
            }
          });
          break;
        case '/subscriptions':
          document.querySelectorAll('ytd-browse').forEach(i => {
            if(i.innerHTML.match(/page-subtype="subscriptions"/)){
              nodeList = i.querySelector('ytd-two-column-browse-results-renderer')
                .querySelectorAll('ytd-grid-video-renderer.style-scope.ytd-grid-renderer');
              if(!nodeList){
                throw console.error('FUCKING YOUTUBE FAGGOTS CHANGED SOMETHING');
              }
            }
          });
          break;
        case '/playlist':
          document.querySelectorAll('ytd-browse').forEach(i => {
            if(i.innerHTML.match(/page-subtype="playlist"/)){
              nodeList = i.querySelector('ytd-two-column-browse-results-renderer')
                .querySelectorAll('ytd-playlist-video-renderer.style-scope.ytd-playlist-video-list-renderer');
              if(!nodeList){
                throw console.error('FUCKING YOUTUBE FAGGOTS CHANGED SOMETHING');
              }
            }
          });
          break;
        case '/history':
          document.querySelectorAll('ytd-browse').forEach(i => {
            if(i.innerHTML.match(/page-subtype="history"/)){
              nodeList = i.querySelector('ytd-two-column-browse-results-renderer')
                .querySelectorAll('ytd-video-renderer.style-scope.ytd-item-section-renderer');
              if(!nodeList){
                throw console.error('FUCKING YOUTUBE FAGGOTS CHANGED SOMETHING');
              }
            }
          });
          break;
        default:

          break;
      }

      return nodeList;
    };
    
    let videoNodeList = getVideoNodeList();

    const loadParentNodeChildren = async function () {
      let previousLength = videoNodeList.length;
      let sequenceOfTheSameLength = 0;
      let yValue = window.scrollY;
      while(true){
        if(maximum <= videoNodeList.length - 1){
          return;
        }
        window.scroll(0, yValue);
        await new Promise(resolve => setTimeout(resolve, 1000));
        videoNodeList = getVideoNodeList();
        if (previousLength < videoNodeList.length){
            sequenceOfTheSameLength = 0;
            previousLength = videoNodeList.length;
        }else{
          sequenceOfTheSameLength++;
          if(sequenceOfTheSameLength > 4){
            console.error(`sequenceOfTheSameLength > 4`);
            return;
          }
        }
        yValue += 3000;
      }
    }
        
    await loadParentNodeChildren();
    if (!(initialIndex < videoNodeList.length - 1)){
      return [];
    }

    while(initialIndex < maximum){
      try{
        links.push(videoNodeList[initialIndex].innerHTML.match(/\?v=(.*?)(&|\s|"|$)/)[1]);
      } catch (e){
        initialIndex = maximum;
      }
      initialIndex++;
    }
    
    return links;
  }
  
  const spawnYTPlayer = function () {
    appState.YTPlayer = new YT.Player(playerElementId, {
      height: `889`,
      width: `1908`,
      videoId: appState.linkQueue[appState.playingVideoIndex],
      events: {
          'onStateChange': onPlayerStateChange,
          'onReady': onPlayerReady
        }
    });
  }
  
  const onPlayerStateChange = function (e) {
    switch (e.data) {
      case -1: // unstarted
        
        break;
      case 0: // ended
        selectNextVideo();
        break;
      case 1: // playing
        appState.isPlaying = 1;
        appState.isPaused = 0;
        break;
      case 2: // paused
        appState.isPlaying = 0;
        appState.isPaused = 1;
        break;
      case 3: // buffering
        
        break;
      case 5: // video cued
        
        break;
      default:
        console.log(`onPlayerStateChange e.data`, e.data)
        break;
    }
  }
  
  const onPlayerReady = function (e) {
    appState.YTPlayer.playVideo();
  }

  const selectPreviousVideo = function (e) {
    if(e) {
      e.preventDefault();
    }
    
    if(!!appState.isQueueReversed) {
      if(!increasePlayingVideoIndex()){
        return;
      }
    }else{
      if(!decreasePlayingVideoIndex()){
        return;
      }
    }
    
    appState.YTPlayer.loadVideoById(appState.linkQueue[appState.playingVideoIndex]);
    paginationCounter.children[0].innerHTML = appState.playingVideoIndex + 1;
  }
  
  const pauseOrPlayVideo = function (e) {
    if(e){
      e.preventDefault();
    }
    if(!!appState.isPlaying){
      appState.YTPlayer.pauseVideo();
      return;
    }
    if(!!appState.isPaused){
      appState.YTPlayer.playVideo();
      return;
    }
  }
  
  const selectNextVideo = function (e) {
    if(e) {
      e.preventDefault();
    }
    
    if(!!appState.isQueueReversed) {
      if(!decreasePlayingVideoIndex()){
        return;
      }
    }else{
      if(!increasePlayingVideoIndex()){
        return;
      }
    }
    
    appState.YTPlayer.loadVideoById(appState.linkQueue[appState.playingVideoIndex]);
    paginationCounter.children[0].innerHTML = appState.playingVideoIndex + 1;
  }
  
  const increasePlayingVideoIndex = function () {
    appState.playingVideoIndex++;
    if(appState.playingVideoIndex >= appState.linkQueue.length) {
      appState.playingVideoIndex--;
      return false;
    }
    return true;
  }
  
  const decreasePlayingVideoIndex = function () {
    appState.playingVideoIndex--;
    if(appState.playingVideoIndex < 0) {
      appState.playingVideoIndex++;
      return false;
    }
    return true;
  }
  
  const addVideosToQueue = async function (e) {
    if (e) {
      e.preventDefault();
    }
    
    if (appState.currentURL !== document.URL) {
      alert(`
        appState.currentURL !== document.URL
        click PlayAll button or go to ${appState.currentURL}
      `);
      return;
    }
    
    const linkQueueLength = appState.linkQueue.length;
    if(!!appState.isQueueReversed) {

    }else{
      appState.linkQueue = appState.linkQueue.concat(await loadVideoURLQueue());
      if(appState.linkQueue.length === linkQueueLength) {
        alert(`
          WARNING: appState.linkQueue = appState.linkQueue.concat(await loadVideoURLQueue()); appState.linkQueue.length === linkQueueLength
          You have already loaded all uploaded videos, or there are some problems :3
        `);
        return;
      }
    }
    paginationCounter.children[2].innerHTML = appState.linkQueue.length;
  }
  
  const reverseQueue = function (e) {
    if (e) {
      e.preventDefault();
    }
    
    if(!!appState.isQueueReversed){
      
    }else{
      
    }
    console.log('do nothing')
  }
  
  const showPlayer = function (e) {
    if (e) {
      e.preventDefault();
    }
    playerElement.style.display = 'flex';
  }
  
  const hidePlayer = function (e) {
    if (e) {
      e.preventDefault();
    }
    playerElement.style.display = 'none';
  }

  while (true) {
    let match;
    if(!!(match = document.URL.match(/https:\/\/www\.youtube.*(\/videos$)/))) {
      appState.pageSubtype = match[1];
      playAllButton.style.display = 'block';
    }else if(!!(match = document.URL.match(/https:\/\/www\.youtube(\.com\/$)/))) {
      appState.pageSubtype = match[1];
      playAllButton.style.display = 'block';
    }else if(!!(match = document.URL.match(/https:\/\/www\.youtube.*(\/subscriptions$)/))) {
      appState.pageSubtype = match[1];
      playAllButton.style.display = 'block';
    }else if(!!(match = document.URL.match(/https:\/\/www\.youtube.*(\/playlist)\?/))) {
      appState.pageSubtype = match[1];
      playAllButton.style.display = 'block';
    }else if(!!(match = document.URL.match(/https:\/\/www\.youtube.*(\/history$)/))) {
      appState.pageSubtype = match[1];
      playAllButton.style.display = 'block';
    }else{
      playAllButton.style.display = 'none';
    }
    await new Promise(resolve => setTimeout(resolve, 400));
  }

}
