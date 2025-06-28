// 获取 DOM 元素
const audio = document.getElementById("audio");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const backgroundImage = document.getElementById("background-image");
const songTitle = document.getElementById("song-title"); 
const songer = document.getElementById("song-artist")

let songs = []; // 存储从 JSON 加载的歌曲数据
let currentIndex = 0;

// 加载歌曲数据
async function loadSongs() {
  try {
    const response = await fetch("../songs.json"); // 路径根据实际情况调整
    songs = await response.json();
    initPlayer(); // 初始化播放器
  } catch (error) {
    console.error("加载歌曲数据失败:", error);
    alert("加载歌曲列表失败，请刷新页面重试");
  }
}

// 初始化播放器
function initPlayer() {
  if (songs.length > 0) {
    updatePlayer();
  } else {
    console.error("歌曲列表为空");
  }
}

// 更新播放器状态
function updatePlayer() {
  const currentSong = songs[currentIndex];
  audio.src = currentSong.audio_url;
  backgroundImage.style.backgroundImage = `url('${currentSong.img}')`;
  
  // 如果有歌曲标题元素，更新标题
  if (songTitle) {
    songTitle.textContent = `${currentSong.name}`;
    songer.textContent = `${currentSong.singer}`;
  }
}

// 播放上一首歌曲
function playPrevSong() {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  updatePlayer();
  audio.play();
}

// 播放下一首歌曲
function playNextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  updatePlayer();
  audio.play();
}

// 为按钮添加点击事件监听器
prevBtn.addEventListener("click", playPrevSong);
nextBtn.addEventListener("click", playNextSong);

// 页面加载时加载歌曲数据
document.addEventListener("DOMContentLoaded", loadSongs);