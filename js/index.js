// 获取DOM元素
const audio = document.getElementById("audio");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const minicoverImage = document.getElementById("mini-song-cover");
const songTitle = document.getElementById("song-title");
const songer = document.getElementById("song-artist");
const lyricsLeft = document.getElementById("lyrics-left");
const lyricsRight = document.getElementById("lyrics-right");
const player = document.getElementById("player");

// 全局变量
let songs = []; // 存储歌曲数据
let currentIndex = 0;
let currentLyrics = []; // 当前歌曲歌词
let currentLyricIndex = -1; // 当前歌词索引

/**
 * 歌曲数据加载与初始化
 */
// 加载歌曲数据（入口函数）
async function loadSongs() {
  try {
    const response = await fetch("/Music_player/songs.json");
    songs = await response.json();
    initPlayer();
  } catch (error) {
    console.error("加载歌曲数据失败:", error);
    alert("加载歌曲列表失败，请刷新页面重试");
  }
}

// 初始化播放器
async function initPlayer() {
  if (songs.length > 0) {
    await loadCurrentSongLyrics();
    updatePlayer();
    setupAudioEvents();
  } else {
    console.error("歌曲列表为空");
  }
}

// 加载当前歌曲歌词
async function loadCurrentSongLyrics() {
  const currentSong = songs[currentIndex];
  if (currentSong.lrc_url) {
    try {
      const response = await fetch(currentSong.lrc_url);
      const lrcText = await response.text();
      currentLyrics = parseLrc(lrcText);
    } catch (error) {
      console.error(`加载歌曲《${currentSong.name}》的歌词失败:`, error);
      currentLyrics = [];
    }
  } else {
    currentLyrics = [];
    console.log(`歌曲《${currentSong.name}》没有LRC歌词`);
  }
  displayLyrics(currentLyrics);
}

/**
 * 歌词解析与显示
 */
// 解析LRC歌词文件
function parseLrc(lrcText) {
  const lyrics = [];
  const lines = lrcText.split("\n");

  lines.forEach((line) => {
    if (!line.trim()) return;

    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    const match = line.match(timeReg);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      const content = match[4].trim();

      const time =
        minutes * 60 * 1000 +
        seconds * 1000 +
        (milliseconds >= 100 ? milliseconds : milliseconds * 10);

      lyrics.push({ time, content });
    }
  });

  return lyrics.sort((a, b) => a.time - b.time);
}

// 显示歌词
function displayLyrics(lyrics) {
  lyricsLeft.innerHTML = "";
  lyricsRight.innerHTML = "";

  if (lyrics.length === 0) {
    lyricsLeft.innerHTML = "<p>暂无歌词</p>";
    return;
  }

  const halfLength = Math.ceil(lyrics.length / 2);
  const leftLyrics = lyrics.slice(0, halfLength).map((item) => item.content);
  const rightLyrics = lyrics.slice(halfLength).map((item) => item.content);

  lyricsLeft.innerHTML = leftLyrics.map((line) => `<p>${line}</p>`).join("");
  lyricsRight.innerHTML = rightLyrics.map((line) => `<p>${line}</p>`).join("");
}

/**
 * 播放器核心控制
 */
// 更新播放器状态
function updatePlayer() {
  const currentSong = songs[currentIndex];
  audio.src = currentSong.audio_url;
  minicoverImage.src = currentSong.img;
  resetCoverRotation();

  if (songTitle) {
    songTitle.textContent = `${currentSong.name}`;
    songer.textContent = `${currentSong.singer}`;
  }

  currentLyricIndex = -1;
}

// 重置封面旋转
function resetCoverRotation() {
  const coverRotate = document.querySelector(".mini-cover-rotate");
  if (!coverRotate) return;

  coverRotate.style.animation = "none";
  coverRotate.style.transform = "rotate(0deg)";
  void coverRotate.offsetWidth;
  coverRotate.style.animation = "rotate 20s linear infinite";
  coverRotate.style.animationPlayState = audio.paused ? "paused" : "running";
}

// 播放上一首
function playPrevSong() {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadCurrentSongLyrics().then(() => {
    updatePlayer();
    resetCoverRotation();
    audio.play();
  });
}

// 播放下一首
function playNextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  loadCurrentSongLyrics().then(() => {
    updatePlayer();
    resetCoverRotation();
    audio.play();
  });
}

/**
 * 事件监听设置
 */
// 设置音频事件监听
function setupAudioEvents() {
  audio.addEventListener("timeupdate", syncLyrics);

  audio.addEventListener("play", () => {
    const coverRotate = document.querySelector(".mini-cover-rotate");
    coverRotate.style.animationPlayState = "running";
    console.log("音频播放中，封面开始旋转");
  });

  audio.addEventListener("pause", () => {
    const coverRotate = document.querySelector(".mini-cover-rotate");
    coverRotate.style.animationPlayState = "paused";
    console.log("音频暂停，封面停止旋转");
  });

  audio.addEventListener("ended", playNextSong);
}

// 为按钮添加点击事件
prevBtn.addEventListener("click", playPrevSong);
nextBtn.addEventListener("click", playNextSong);

/**
 * 歌词同步功能
 */
// 同步歌词
function syncLyrics() {
  const currentTime = audio.currentTime * 1000;
  const lyrics = currentLyrics;

  if (lyrics.length === 0) return;

  for (let i = 0; i < lyrics.length; i++) {
    const nextTime =
      i === lyrics.length - 1 ? audio.duration * 1000 : lyrics[i + 1].time;

    if (currentTime >= lyrics[i].time && currentTime < nextTime) {
      if (i !== currentLyricIndex) {
        highlightLyric(i);
        currentLyricIndex = i;
      }
      break;
    }
  }
}

// 高亮当前歌词
function highlightLyric(index) {
  document.querySelectorAll(".lyrics-column p.highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  const allLyrics = [
    ...lyricsLeft.querySelectorAll("p"),
    ...lyricsRight.querySelectorAll("p"),
  ];

  if (index < allLyrics.length) {
    allLyrics[index].classList.add("highlight");
    allLyrics[index].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

/**
 * 页面初始化
 */
document.addEventListener("DOMContentLoaded", loadSongs);
