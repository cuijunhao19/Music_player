// 获取DOM元素（新增歌词容器）
const audio = document.getElementById("audio");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const backgroundImage = document.getElementById("background-image");
const songTitle = document.getElementById("song-title");
const songer = document.getElementById("song-artist");
const lyricsLeft = document.getElementById("lyrics-left");
const lyricsRight = document.getElementById("lyrics-right");

let songs = []; // 存储从JSON加载的歌曲数据
let currentIndex = 0;
let currentLyrics = []; // 存储当前歌曲的歌词
let currentLyricIndex = -1; // 当前歌词行索引

// 加载歌曲数据
async function loadSongs() {
  try {
    const response = await fetch("../songs.json");
    songs = await response.json();
    initPlayer(); // 初始化播放器
  } catch (error) {
    console.error("加载歌曲数据失败:", error);
    alert("加载歌曲列表失败，请刷新页面重试");
  }
}

// 初始化播放器
async function initPlayer() {
  if (songs.length > 0) {
    await loadCurrentSongLyrics(); // 加载当前歌曲歌词
    updatePlayer();
    setupAudioEvents(); // 设置音频事件监听
  } else {
    console.error("歌曲列表为空");
  }
}

// 加载当前歌曲的LRC歌词
async function loadCurrentSongLyrics() {
  const currentSong = songs[currentIndex];
  if (currentSong.lrc_url) {
    try {
      const response = await fetch(currentSong.lrc_url);
      const lrcText = await response.text();
      currentLyrics = parseLrc(lrcText); // 解析LRC歌词
    } catch (error) {
      console.error(`加载歌曲《${currentSong.name}》的歌词失败:`, error);
      currentLyrics = [];
    }
  } else {
    currentLyrics = [];
    console.log(`歌曲《${currentSong.name}》没有LRC歌词`);
  }
  displayLyrics(currentLyrics); // 显示歌词
}

// 解析LRC歌词文件
function parseLrc(lrcText) {
  const lyrics = [];
  const lines = lrcText.split("\n");

  lines.forEach((line) => {
    if (!line.trim()) return;

    // 匹配时间戳和歌词内容 ([mm:ss.xx]歌词)
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    const match = line.match(timeReg);

    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3], 10);
      const content = match[4].trim();

      // 计算总毫秒数 (支持00:00.000和00:00.00两种格式)
      const time =
        minutes * 60 * 1000 +
        seconds * 1000 +
        (milliseconds >= 100 ? milliseconds : milliseconds * 10);

      lyrics.push({
        time,
        content,
      });
    }
  });

  // 按时间排序
  return lyrics.sort((a, b) => a.time - b.time);
}

// 更新播放器状态
function updatePlayer() {
  const currentSong = songs[currentIndex];
  audio.src = currentSong.audio_url;
  backgroundImage.style.backgroundImage = `url('${currentSong.img}')`;

  // 更新歌曲信息
  if (songTitle) {
    songTitle.textContent = `${currentSong.name}`;
    songer.textContent = `${currentSong.singer}`;
  }

  currentLyricIndex = -1; // 重置歌词索引
}

// 显示歌词
function displayLyrics(lyrics) {
  lyricsLeft.innerHTML = "";
  lyricsRight.innerHTML = "";

  if (lyrics.length === 0) {
    lyricsLeft.innerHTML = "<p>暂无歌词</p>";
    return;
  }

  // 将歌词分成两列显示
  const halfLength = Math.ceil(lyrics.length / 2);
  const leftLyrics = lyrics.slice(0, halfLength).map((item) => item.content);
  const rightLyrics = lyrics.slice(halfLength).map((item) => item.content);

  lyricsLeft.innerHTML = leftLyrics.map((line) => `<p>${line}</p>`).join("");
  lyricsRight.innerHTML = rightLyrics.map((line) => `<p>${line}</p>`).join("");
}

// 设置音频事件监听（用于歌词同步）
function setupAudioEvents() {
  // 音频时间更新事件（每200ms触发一次）
  audio.addEventListener("timeupdate", syncLyrics);

  // 音频播放事件
  audio.addEventListener("play", () => {
    console.log("音频开始播放");
  });

  // 音频结束事件（自动切换下一首）
  audio.addEventListener("ended", playNextSong);
}

// 同步歌词（根据当前播放时间高亮显示对应歌词）
function syncLyrics() {
  const currentTime = audio.currentTime * 1000; // 转换为毫秒
  const lyrics = currentLyrics;

  if (lyrics.length === 0) return;

  // 查找当前时间对应的歌词行
  for (let i = 0; i < lyrics.length; i++) {
    // 下一行歌词的时间或歌曲总时长
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

// 高亮显示当前歌词
function highlightLyric(index) {
  // 移除之前的高亮
  document.querySelectorAll(".lyrics-column p.highlight").forEach((el) => {
    el.classList.remove("highlight");
  });

  // 添加新高亮
  const allLyrics = [
    ...lyricsLeft.querySelectorAll("p"),
    ...lyricsRight.querySelectorAll("p"),
  ];
  if (index < allLyrics.length) {
    allLyrics[index].classList.add("highlight");

    // 滚动到高亮歌词（平滑滚动）
    allLyrics[index].scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// 播放上一首歌曲
function playPrevSong() {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadCurrentSongLyrics().then(() => {
    updatePlayer();
    audio.play();
  });
}

// 播放下一首歌曲
function playNextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  loadCurrentSongLyrics().then(() => {
    updatePlayer();
    audio.play();
  });
}

// 为按钮添加点击事件监听器
prevBtn.addEventListener("click", playPrevSong);
nextBtn.addEventListener("click", playNextSong);

// 页面加载时加载歌曲数据
document.addEventListener("DOMContentLoaded", loadSongs);
