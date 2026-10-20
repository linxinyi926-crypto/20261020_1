const WEATHER_TYPES = [ // 建立可抽選的十二種天氣資料
  { key: "sunny", name: "晴天", icon: "☀", gif: "https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif" }, // 定義晴天資料
  { key: "cloudy", name: "多雲", icon: "☁", gif: "https://media.giphy.com/media/3o7btPCcdNniyf0ArS/giphy.gif" }, // 定義多雲資料
  { key: "rainy", name: "下雨", icon: "☂", gif: "https://media.giphy.com/media/3o7bu3XilJ5BOiSGic/giphy.gif" }, // 定義下雨資料
  { key: "snowy", name: "下雪", icon: "❄", gif: "https://media.giphy.com/media/3o7abldj0b3rxrZUxW/giphy.gif" }, // 定義下雪資料
  { key: "storm", name: "雷雨", icon: "⚡", gif: "https://media.giphy.com/media/26BRQTezZrKak4BeE/giphy.gif" }, // 定義雷雨資料
  { key: "rainbow", name: "彩虹", icon: "◡", gif: "https://media.giphy.com/media/l0HlNaQ6gWfllcjDO/giphy.gif" }, // 定義彩虹資料
  { key: "foggy", name: "起霧", icon: "≋", gif: "https://media.giphy.com/media/3o7bu1iM5MSwG2y7NS/giphy.gif" }, // 定義起霧資料
  { key: "windy", name: "強風", icon: "➜", gif: "https://media.giphy.com/media/3o7TKqnN349PBUtGFO/giphy.gif" }, // 定義強風資料
  { key: "hot", name: "炎熱", icon: "♨", gif: "https://media.giphy.com/media/3o7ZezSB4ckAYlcCRy/giphy.gif" }, // 定義炎熱資料
  { key: "freezing", name: "寒冷", icon: "✦", gif: "https://media.giphy.com/media/3o7abAHdYvZdBNnGZq/giphy.gif" }, // 定義寒冷資料
  { key: "drizzle", name: "毛毛雨", icon: "⋮", gif: "https://media.giphy.com/media/3o7TKp8e8i3e7P8mY0/giphy.gif" }, // 定義毛毛雨資料
  { key: "aurora", name: "極光", icon: "✧", gif: "https://media.giphy.com/media/3o7aDcz6TQ6Yk5bqV2/giphy.gif" } // 定義極光資料
]; // 完成天氣資料表
const UI = { ink: "#18324a", navy: "#102a43", blue: "#1769aa", green: "#a7c957", red: "#e63946", gold: "#ffca3a", white: "#ffffff" }; // 集中管理介面色彩
const INSTRUCTION = "玩法：按住下方名稱，拖到上方對應天氣圖片下方的格子。可以拖回重放，已有名稱的格子會互換。完成後按『點我看答案』或『交卷看成績』。"; // 設定完整玩法說明
const SCENE_TIME = 8500; // 設定背景天氣場景切換時間
let quiz = null; // 儲存測驗狀態
let layoutData = null; // 儲存響應式版面位置
let dragging = null; // 儲存目前被拖曳的名稱
let beganAt = 0; // 儲存本回合作答開始時間
let confetti = []; // 儲存彩帶粒子資料
let lastTouchAt = 0; // 儲存最近一次觸控時間以避免重複觸發

function setup() { // 初始化 p5.js 畫布與測驗
  pixelDensity(Math.min(2, window.devicePixelRatio || 1)); // 設定清晰但不過度耗能的像素密度
  createCanvas(windowWidth, Math.max(windowHeight, 900)); // 建立至少足夠容納主要內容的全螢幕畫布
  textFont("Noto Sans TC, Microsoft JhengHei, sans-serif"); // 設定繁體中文字型與備援字型
  textAlign(CENTER, CENTER); // 設定文字預設為置中對齊
  textWrap(WORD); // 啟用文字自動換行
  imageMode(CORNER); // 設定圖片使用左上角座標模式
  quiz = createQuiz(); // 立即建立第一回合的六張題目卡
  beganAt = millis(); // 記錄第一回合開始時間
  refreshCanvasSize(); // 依內容重新配置畫布大小與版面
} // 完成初始化

function draw() { // 每一幀繪製完整遊戲畫面
  drawBackground(); // 繪製不遮蓋內容的動態天氣背景
  drawHeader(); // 繪製左上角標題與玩法說明
  drawCards(); // 繪製固定可見的六張天氣卡片
  drawTray(); // 繪製固定可見的六個名稱標籤
  drawButtons(); // 繪製三個可點擊的畫布按鈕
  drawResultPanel(); // 在交卷後繪製分數與答題結果
  if (dragging !== null) drawDraggingLabel(); // 在拖曳中繪製跟隨指標的標籤
  if (quiz.submitted && quiz.score > 60) drawConfetti(); // 高於百分之六十時繪製彩帶
} // 完成每幀繪製

function windowResized() { // 處理視窗尺寸變更
  refreshCanvasSize(); // 重新調整畫布高度與全部版面
} // 完成視窗尺寸處理

function mousePressed() { // 處理滑鼠按下與滑鼠點擊
  if (quiz === null) return false; // 測驗尚未準備好時停止操作
  const buttonName = hitButton(mouseX, mouseY); // 判斷是否按到畫布按鈕
  if (buttonName === "reset") { resetQuiz(); return false; } // 重新出題按鈕永遠保持可用
  if (buttonName === "answer" && !quiz.submitted) { quiz.showAnswer = true; dragging = null; return false; } // 顯示答案後鎖定拖曳
  if (buttonName === "submit" && !quiz.submitted) { submitQuiz(); return false; } // 點擊交卷按鈕並計算成績
  if (quiz.showAnswer || quiz.submitted) return false; // 答案模式與交卷後禁止繼續拖曳
  const slotIndex = hitSlot(mouseX, mouseY); // 判斷是否按到已有名稱的答案格
  if (slotIndex >= 0 && quiz.slots[slotIndex] !== null) { startDrag(quiz.slots[slotIndex], "slot", slotIndex); return false; } // 從答案格取回名稱開始拖曳
  const labelIndex = hitTrayLabel(mouseX, mouseY); // 判斷是否按到下方未放置名稱
  if (labelIndex >= 0) startDrag(labelIndex, "tray", -1); // 從名稱區開始拖曳
  return false; // 阻止瀏覽器預設選取與捲動行為
} // 完成滑鼠按下處理

function mouseDragged() { // 處理滑鼠拖曳移動
  if (dragging !== null && !quiz.showAnswer && !quiz.submitted) { dragging.x = mouseX; dragging.y = mouseY; } // 更新拖曳標籤的位置
  return false; // 阻止瀏覽器預設拖曳行為
} // 完成滑鼠拖曳處理

function mouseReleased() { // 處理滑鼠放開與名稱放置
  if (dragging === null) return false; // 沒有拖曳資料時不執行放置
  const dropX = mouseX; // 保存放開瞬間的水平座標
  const dropY = mouseY; // 保存放開瞬間的垂直座標
  const slotIndex = hitSlot(dropX, dropY); // 找出放開時所對應的答案格
  if (slotIndex >= 0) dropInSlot(slotIndex); // 放在答案格時執行放置或互換
  else if (inTrayArea(dropX, dropY)) returnToTray(); // 放在名稱區時讓名稱回到可拖曳區
  else restoreDrag(); // 放在其他區域時復原原本答案格
  dragging = null; // 清除拖曳暫存資料
  return false; // 阻止瀏覽器預設放開行為
} // 完成滑鼠放開處理

function touchStarted() { // 處理觸控按下事件
  lastTouchAt = millis(); // 記錄觸控時間以標記觸控互動
  return mousePressed(); // 共用畫布滑鼠按下的命中測試
} // 完成觸控按下處理

function touchMoved() { // 處理觸控拖曳事件
  return mouseDragged(); // 共用畫布滑鼠拖曳的移動邏輯
} // 完成觸控拖曳處理

function touchEnded() { // 處理觸控放開事件
  return mouseReleased(); // 共用畫布滑鼠放開的放置邏輯
} // 完成觸控放開處理

function createQuiz() { // 建立一回合新的六題測驗
  const selected = shuffleArray(WEATHER_TYPES).slice(0, 6); // 從十二種天氣隨機選出六種
  const cards = selected.map((item) => createCard(item)); // 建立六張含安全圖片狀態的卡片
  const labels = shuffleArray(cards.map((card) => ({ key: card.key, name: card.name, icon: card.icon }))); // 打亂六個名稱標籤
  return { cards: cards, labels: labels, slots: [null, null, null, null, null, null], showAnswer: false, submitted: false, correct: 0, score: 0, elapsed: 0 }; // 回傳完整且已初始化的測驗資料
} // 完成新測驗建立

function createCard(item) { // 建立單張天氣卡片與 GIF 元素
  const card = { key: item.key, name: item.name, icon: item.icon, gif: item.gif, image: null, loaded: false, failed: false }; // 先建立不依賴圖片的卡片資料
  try { // 保護外部 GIF 建立流程避免中斷整個畫面
    const imageElement = createImg(card.gif, card.name + "天氣動畫"); // 建立具備替代文字的 GIF 元素
    imageElement.attribute("alt", card.name + "天氣動畫"); // 明確設定圖片替代文字
    imageElement.attribute("draggable", "false"); // 禁止原生 HTML 圖片拖曳干擾遊戲
    imageElement.style("position", "absolute"); // 將圖片元素放在畫布之外的安全位置
    imageElement.style("left", "-10000px"); // 將圖片移出可視範圍但保留載入能力
    imageElement.style("top", "0px"); // 設定圖片元素的安全垂直位置
    imageElement.style("width", "1px"); // 設定圖片元素的安全顯示寬度
    imageElement.style("height", "1px"); // 設定圖片元素的安全顯示高度
    imageElement.elt.onload = () => { card.loaded = true; card.failed = false; }; // 圖片載入成功時僅切換覆蓋狀態
    imageElement.elt.onerror = () => { card.loaded = false; card.failed = true; }; // 圖片載入失敗時保留 fallback 圖示
    card.image = imageElement; // 保存圖片元素供畫布嘗試繪製
  } catch (error) { // 捕捉 createImg 或 DOM 屬性錯誤
    card.failed = true; // 建立失敗時直接使用畫布 fallback
    card.image = null; // 確保後續繪圖不會存取不存在的元素
  } // 完成安全圖片建立
  return card; // 回傳即使無網路也能顯示的卡片
} // 完成單張卡片建立

function disposeImages() { // 移除上一回合的隱藏 GIF 元素
  if (quiz === null) return; // 尚未有測驗時不需要清除圖片
  quiz.cards.forEach((card) => { try { if (card.image !== null) card.image.remove(); } catch (error) { } }); // 逐一安全移除舊圖片元素
} // 完成舊圖片清理

function resetQuiz() { // 重新出題並解鎖整個測驗
  disposeImages(); // 清除上一回合的外部圖片元素
  quiz = createQuiz(); // 重新建立六張題目與六個名稱
  beganAt = millis(); // 重新記錄作答起始時間
  dragging = null; // 清除任何殘留拖曳狀態
  confetti = []; // 清除上一回合的彩帶粒子
  refreshCanvasSize(); // 重新依新狀態配置畫布
} // 完成重新出題

function refreshCanvasSize() { // 重新計算畫布尺寸與元件位置
  const targetHeight = calculateCanvasHeight(); // 依螢幕寬度與內容計算所需高度
  if (typeof width === "undefined" || width !== windowWidth || height !== targetHeight) resizeCanvas(windowWidth, targetHeight); // 只在必要時調整畫布避免閃爍
  layoutData = calculateLayout(); // 計算全部卡片、標籤與按鈕的位置
} // 完成畫布尺寸更新

function calculateCanvasHeight() { // 計算可容納全部內容的畫布高度
  const metrics = getLayoutMetrics(); // 取得不依賴目前畫布高度的版面尺寸
  const buttonGap = Math.max(8, Math.min(14, windowWidth * 0.018)); // 重新取得按鈕之間的安全間距
  const buttonRows = windowWidth < 620 ? 3 : 1; // 小螢幕按鈕採三列，大螢幕按鈕採一列
  const buttonsHeight = buttonRows * metrics.buttonH + (buttonRows - 1) * buttonGap; // 計算全部按鈕所需高度
  const resultExtra = quiz !== null && quiz.submitted ? 146 : 0; // 交卷後為成績摘要預留高度
  return Math.max(windowHeight, metrics.buttonY + buttonsHeight + resultExtra + 36); // 保證手機畫面不會裁切下方內容
} // 完成畫布高度計算

function getLayoutMetrics() { // 計算跨裝置共用的版面尺寸
  const margin = Math.max(14, Math.min(42, windowWidth * 0.035)); // 計算左右安全邊距
  const gap = Math.max(9, Math.min(16, windowWidth * 0.014)); // 計算卡片與標籤間距
  const cardColumns = windowWidth < 620 ? 2 : windowWidth < 1000 ? 3 : 6; // 依寬度決定卡片欄數
  const cardRows = Math.ceil(6 / cardColumns); // 計算卡片列數
  const headerH = windowWidth < 560 ? 184 : windowWidth < 900 ? 154 : 132; // 為標題與玩法保留可見高度
  const cardH = windowWidth < 560 ? 188 : windowWidth < 900 ? 204 : 218; // 依裝置寬度設定卡片高度
  const cardW = (windowWidth - margin * 2 - gap * (cardColumns - 1)) / cardColumns; // 計算單張卡片寬度
  const cardsBottom = headerH + cardRows * cardH + (cardRows - 1) * gap; // 計算六張卡片區底部
  const trayColumns = windowWidth < 620 ? 2 : windowWidth < 980 ? 3 : 6; // 依寬度決定名稱欄數
  const trayRows = Math.ceil(6 / trayColumns); // 計算名稱標籤列數
  const trayH = windowWidth < 560 ? 50 : 48; // 設定名稱標籤高度
  const trayY = cardsBottom + 58; // 在卡片下方保留清楚的名稱區間距
  const trayW = (windowWidth - margin * 2 - gap * (trayColumns - 1)) / trayColumns; // 計算名稱標籤寬度
  const buttonY = trayY + trayRows * trayH + (trayRows - 1) * gap + 58; // 設定按鈕區起點
  const buttonH = windowWidth < 560 ? 48 : 44; // 設定觸控友善的按鈕高度
  return { margin: margin, gap: gap, cardColumns: cardColumns, cardRows: cardRows, headerH: headerH, cardH: cardH, cardW: cardW, cardsBottom: cardsBottom, trayColumns: trayColumns, trayRows: trayRows, trayH: trayH, trayY: trayY, trayW: trayW, buttonY: buttonY, buttonH: buttonH }; // 回傳全部版面計算結果
} // 完成版面尺寸計算

function calculateLayout() { // 建立所有互動元件的實際矩形
  const metrics = getLayoutMetrics(); // 讀取目前裝置版面尺寸
  const cards = []; // 建立六張卡片位置陣列
  const tray = []; // 建立六個名稱位置陣列
  for (let i = 0; i < 6; i += 1) { const col = i % metrics.cardColumns; const row = Math.floor(i / metrics.cardColumns); cards.push({ x: metrics.margin + col * (metrics.cardW + metrics.gap), y: metrics.headerH + row * (metrics.cardH + metrics.gap), w: metrics.cardW, h: metrics.cardH }); } // 逐一建立六張卡片位置
  for (let i = 0; i < 6; i += 1) { const col = i % metrics.trayColumns; const row = Math.floor(i / metrics.trayColumns); tray.push({ x: metrics.margin + col * (metrics.trayW + metrics.gap), y: metrics.trayY + row * (metrics.trayH + metrics.gap), w: metrics.trayW, h: metrics.trayH }); } // 逐一建立六個標籤位置
  const buttonGap = Math.max(8, Math.min(14, windowWidth * 0.018)); // 計算按鈕間距
  const buttonColumns = windowWidth < 620 ? 1 : 3; // 小螢幕將按鈕改成直向排列
  const buttonW = buttonColumns === 1 ? Math.min(330, windowWidth - metrics.margin * 2) : (windowWidth - metrics.margin * 2 - buttonGap * 2) / 3; // 計算按鈕寬度
  const buttons = []; // 建立三個按鈕位置陣列
  for (let i = 0; i < 3; i += 1) { const col = buttonColumns === 1 ? 0 : i; const row = buttonColumns === 1 ? i : 0; buttons.push({ x: buttonColumns === 1 ? (windowWidth - buttonW) / 2 : metrics.margin + col * (buttonW + buttonGap), y: metrics.buttonY + row * (metrics.buttonH + buttonGap), w: buttonW, h: metrics.buttonH }); } // 逐一建立三個按鈕位置
  const resultY = metrics.buttonY + (buttonColumns === 1 ? 3 : 1) * metrics.buttonH + (buttonColumns === 1 ? 2 : 0) * buttonGap + 18; // 計算成績區起點
  return { metrics: metrics, cards: cards, tray: tray, buttons: buttons, resultY: resultY }; // 回傳完整互動版面資料
} // 完成互動版面建立

function drawHeader() { // 繪製左上角標題與玩法說明
  const margin = layoutData.metrics.margin; // 讀取版面左邊距
  noStroke(); // 移除標題外框
  fill(UI.navy); // 使用深色確保標題清楚可見
  textAlign(LEFT, TOP); // 設定標題靠左上對齊
  textSize(windowWidth < 560 ? 29 : windowWidth < 900 ? 35 : 42); // 依螢幕寬度設定大標字體
  text("天氣動畫連連看", margin, 22); // 繪製左上角大標題
  fill(255, 255, 255, 236); // 使用高不透明度底色提升玩法可讀性
  rect(margin, 72, width - margin * 2, layoutData.metrics.headerH - 88, 12); // 繪製玩法說明底板
  fill(UI.ink); // 設定玩法文字顏色
  textSize(windowWidth < 560 ? 13 : 15); // 設定玩法文字大小
  const lines = wrapChineseText(INSTRUCTION, width - margin * 2 - 28); // 依畫布寬度將完整說明換行
  text(lines.join("\n"), margin + 14, 82, width - margin * 2 - 28, layoutData.metrics.headerH - 96); // 繪製完整玩法說明
  textAlign(CENTER, CENTER); // 還原文字預設置中對齊
} // 完成標題與玩法繪製

function wrapChineseText(value, maxWidth) { // 將中文說明依像素寬度切成多行
  const lines = []; // 建立文字行陣列
  let current = ""; // 儲存正在組合的文字行
  for (const character of value) { // 逐字處理中文與標點
    const candidate = current + character; // 暫時組合下一個字
    if (current !== "" && textWidth(candidate) > maxWidth) { lines.push(current); current = character; } else { current = candidate; } // 超過寬度時換行
  } // 完成逐字換行
  if (current !== "") lines.push(current); // 將最後一行放入陣列
  return lines; // 回傳可繪製的文字行
} // 完成中文換行

function drawCards() { // 繪製六張天氣卡片
  quiz.cards.forEach((card, index) => drawCard(card, layoutData.cards[index], index)); // 逐一繪製卡片與答案格
} // 完成六張卡片繪製

function drawCard(card, box, index) { // 繪製單張天氣卡片
  push(); // 保存卡片繪圖狀態
  drawingContext.shadowColor = "rgba(16,42,67,0.24)"; // 設定卡片陰影顏色
  drawingContext.shadowBlur = 16; // 設定卡片陰影模糊程度
  noStroke(); // 移除卡片外框
  fill(255, 255, 255, 246); // 使用近乎不透明白色保護內容可讀性
  rect(box.x, box.y, box.w, box.h, 16); // 繪製圓角天氣卡片
  drawingContext.shadowBlur = 0; // 清除陰影避免影響後續內容
  const imageBox = { x: box.x + 8, y: box.y + 8, w: box.w - 16, h: box.h - 66 }; // 計算 GIF 與 fallback 共用圖片區域
  drawFallback(card, imageBox); // 先立即繪製一定可見的天氣 fallback
  drawGifSafely(card, imageBox); // GIF 成功後才覆蓋在 fallback 上方
  const slot = getSlotBox(box); // 取得卡片下方的名稱放置格
  const labelId = quiz.slots[index]; // 讀取目前答案格所放的名稱索引
  const correct = labelId !== null && quiz.labels[labelId].key === card.key; // 計算目前配對是否正確
  const slotColor = quiz.showAnswer ? (correct ? UI.green : UI.red) : "#f8fbfd"; // 僅在答案模式後顯示正誤顏色
  fill(slotColor); // 套用答案格顏色
  stroke(23, 50, 74, 100); // 設定答案格邊框顏色
  strokeWeight(2); // 設定答案格邊框寬度
  rect(slot.x, slot.y, slot.w, slot.h, 10); // 繪製名稱放置格
  noStroke(); // 移除文字外框
  fill(UI.ink); // 設定答案格文字顏色
  textSize(Math.max(12, Math.min(18, box.w * 0.085))); // 依卡片寬度調整文字大小
  const slotText = labelId === null ? "拖到這裡放名稱" : quiz.labels[labelId].icon + "  " + quiz.labels[labelId].name; // 組合答案格顯示文字
  text(slotText, slot.x + slot.w / 2, slot.y + slot.h / 2); // 繪製放置提示或名稱
  if (quiz.showAnswer) drawCorrectMark(correct, box); // 答案模式後在卡片下方顯示對錯文字
  pop(); // 還原卡片繪圖狀態
} // 完成單張卡片繪製

function getSlotBox(cardBox) { // 計算單張卡片底部答案格位置
  return { x: cardBox.x + 8, y: cardBox.y + cardBox.h - 50, w: cardBox.w - 16, h: 38 }; // 回傳卡片內的放置格矩形
} // 完成答案格位置計算

function drawGifSafely(card, imageBox) { // 嘗試安全繪製載入成功的 GIF
  if (!card.loaded || card.image === null || card.image.elt === null) return; // GIF 未成功時保留已繪製的 fallback
  try { // 保護外部圖片繪製避免 draw 中斷
    const element = card.image.elt; // 取得原生圖片元素
    if (element.naturalWidth > 0 && element.naturalHeight > 0) image(element, imageBox.x, imageBox.y, imageBox.w, imageBox.h); // 僅在尺寸有效時覆蓋 fallback
  } catch (error) { card.loaded = false; card.failed = true; } // 任一圖片錯誤時繼續保留 fallback
} // 完成 GIF 安全繪製

function drawFallback(card, box) { // 繪製永遠可見的天氣圖形 fallback
  noStroke(); // 移除 fallback 外框
  const tone = fallbackTone(card.key); // 取得對應天氣的柔和底色
  fill(tone[0], tone[1], tone[2], 238); // 繪製清楚且不依賴網路的圖片底色
  rect(box.x, box.y, box.w, box.h, 12); // 繪製 fallback 圖片區
  drawWeatherIcon(card.key, box.x + box.w / 2, box.y + box.h * 0.45, Math.min(box.w, box.h) * 0.62); // 繪製向量天氣插圖
  fill(UI.ink); // 設定 fallback 說明文字顏色
  textSize(Math.max(9, Math.min(12, box.w * 0.045))); // 設定 fallback 小字大小
  text(card.failed ? "GIF 暫時無法載入，已顯示插圖" : "天氣圖示已就緒，GIF 載入中…", box.x + box.w / 2, box.y + box.h - 16); // 明確告知使用者目前仍有可見圖示
} // 完成 fallback 繪製

function fallbackTone(key) { // 取得各種天氣的 fallback 底色
  const tones = { sunny: [255, 242, 178], cloudy: [218, 232, 242], rainy: [191, 219, 239], snowy: [231, 241, 250], storm: [190, 190, 216], rainbow: [248, 218, 228], foggy: [218, 224, 226], windy: [205, 239, 235], hot: [255, 216, 185], freezing: [202, 229, 247], drizzle: [204, 225, 239], aurora: [205, 218, 244] }; // 定義各天氣的柔和底色
  return tones[key] || [220, 232, 240]; // 找不到資料時回傳安全預設色
} // 完成 fallback 色彩取得

function drawWeatherIcon(key, x, y, size) { // 使用 canvas 圖形繪製天氣插圖
  push(); // 保存圖示繪圖狀態
  translate(x, y); // 將圖示原點移到圖片中央
  strokeCap(ROUND); // 設定線段端點為圓角
  if (key === "sunny" || key === "hot") drawSunIcon(size, key === "hot"); // 繪製晴天或炎熱太陽
  else if (key === "cloudy" || key === "foggy") drawCloudIcon(size, key === "foggy"); // 繪製多雲或起霧雲朵
  else if (key === "rainy" || key === "drizzle") drawRainIcon(size, key === "drizzle"); // 繪製下雨或毛毛雨
  else if (key === "snowy" || key === "freezing") drawSnowIcon(size, key === "freezing"); // 繪製下雪或寒冷雪花
  else if (key === "storm") drawStormIcon(size); // 繪製雷雨閃電
  else if (key === "rainbow") drawRainbowIcon(size); // 繪製彩虹
  else if (key === "windy") drawWindIcon(size); // 繪製強風
  else drawAuroraIcon(size); // 繪製極光
  pop(); // 還原圖示繪圖狀態
} // 完成天氣插圖繪製

function drawSunIcon(size, hot) { // 繪製太陽向量圖示
  noStroke(); // 移除太陽外框
  fill(hot ? "#f77f00" : "#ffca3a"); // 設定太陽本體顏色
  ellipse(0, 0, size * 0.55, size * 0.55); // 繪製太陽本體
  stroke(hot ? "#e85d04" : "#f4a261"); // 設定太陽光芒顏色
  strokeWeight(Math.max(2, size * 0.035)); // 設定太陽光芒寬度
  for (let i = 0; i < 8; i += 1) { const angle = i * TWO_PI / 8; line(Math.cos(angle) * size * 0.39, Math.sin(angle) * size * 0.39, Math.cos(angle) * size * 0.55, Math.sin(angle) * size * 0.55); } // 繪製八道太陽光芒
} // 完成太陽圖示

function drawCloudIcon(size, fog) { // 繪製雲朵或霧氣向量圖示
  noStroke(); // 移除雲朵外框
  fill(fog ? "#8d99ae" : "#ffffff"); // 設定雲朵顏色
  ellipse(-size * 0.18, size * 0.05, size * 0.48, size * 0.34); // 繪製左側雲朵
  ellipse(size * 0.13, -size * 0.08, size * 0.62, size * 0.48); // 繪製中央雲朵
  ellipse(size * 0.38, size * 0.08, size * 0.46, size * 0.31); // 繪製右側雲朵
  rect(-size * 0.38, size * 0.04, size * 0.92, size * 0.25, size * 0.12); // 連接雲朵底部
  if (fog) { stroke("#667085"); strokeWeight(Math.max(2, size * 0.035)); line(-size * 0.38, size * 0.34, size * 0.38, size * 0.34); line(-size * 0.30, size * 0.49, size * 0.30, size * 0.49); } // 起霧時補上霧線
} // 完成雲朵圖示

function drawRainIcon(size, drizzle) { // 繪製雨滴向量圖示
  drawCloudIcon(size * 0.9, false); // 先繪製一朵雲
  stroke(drizzle ? "#4d96c7" : "#1769aa"); // 設定雨滴顏色
  strokeWeight(Math.max(2, size * 0.035)); // 設定雨滴寬度
  for (let i = -1; i <= 1; i += 1) line(i * size * 0.2, size * 0.29, i * size * 0.2 - size * 0.07, size * 0.5); // 繪製三道斜雨絲
} // 完成雨天圖示

function drawSnowIcon(size, freezing) { // 繪製雪花向量圖示
  noStroke(); // 移除雪花外框
  fill("#ffffff"); // 設定雲朵顏色
  ellipse(0, -size * 0.15, size * 0.62, size * 0.42); // 繪製雪雲
  stroke(freezing ? "#457b9d" : "#5fa8d3"); // 設定雪花顏色
  strokeWeight(Math.max(2, size * 0.035)); // 設定雪花線寬
  for (let i = 0; i < 3; i += 1) { const angle = i * PI / 3; line(Math.cos(angle) * size * 0.35, Math.sin(angle) * size * 0.35 + size * 0.26, Math.cos(angle + PI) * size * 0.35, Math.sin(angle + PI) * size * 0.35 + size * 0.26); } // 繪製六向雪花
} // 完成雪花圖示

function drawStormIcon(size) { // 繪製雷雨向量圖示
  drawCloudIcon(size, false); // 先繪製雲朵
  noStroke(); // 移除閃電外框
  fill("#f4a261"); // 設定閃電顏色
  beginShape(); // 開始繪製閃電多邊形
  vertex(-size * 0.02, size * 0.15); // 設定閃電上端
  vertex(size * 0.25, size * 0.15); // 設定閃電右上端
  vertex(size * 0.02, size * 0.58); // 設定閃電中段
  vertex(size * 0.10, size * 0.58); // 設定閃電右下端
  vertex(-size * 0.25, size * 0.98); // 設定閃電底端
  vertex(-size * 0.08, size * 0.47); // 設定閃電左中端
  vertex(-size * 0.26, size * 0.47); // 設定閃電左上端
  endShape(CLOSE); // 完成閃電多邊形
} // 完成雷雨圖示

function drawRainbowIcon(size) { // 繪製彩虹向量圖示
  noFill(); // 將彩虹設定為弧線
  strokeWeight(Math.max(4, size * 0.07)); // 設定彩虹線寬
  const colors = ["#e63946", "#f77f00", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"]; // 定義彩虹顏色
  colors.forEach((rainbowColor, index) => { stroke(rainbowColor); arc(0, size * 0.42, size * (1.18 - index * 0.14), size * (0.9 - index * 0.11), PI, TWO_PI); }); // 逐層繪製彩虹弧線
} // 完成彩虹圖示

function drawWindIcon(size) { // 繪製強風向量圖示
  noFill(); // 將風線設定為空心
  stroke("#168aad"); // 設定風線顏色
  strokeWeight(Math.max(3, size * 0.045)); // 設定風線寬度
  arc(-size * 0.08, -size * 0.10, size * 0.75, size * 0.38, PI, TWO_PI); // 繪製上方風線
  arc(size * 0.04, size * 0.14, size * 0.9, size * 0.42, PI, TWO_PI); // 繪製中間風線
  line(size * 0.23, size * 0.14, size * 0.42, size * 0.14); // 繪製風線箭頭前端
  line(size * 0.42, size * 0.14, size * 0.32, size * 0.05); // 繪製風線箭頭上斜線
  line(size * 0.42, size * 0.14, size * 0.32, size * 0.23); // 繪製風線箭頭下斜線
  arc(-size * 0.08, size * 0.38, size * 0.62, size * 0.28, PI, TWO_PI); // 繪製下方風線
} // 完成強風圖示

function drawAuroraIcon(size) { // 繪製極光向量圖示
  noFill(); // 將極光設定為曲線
  strokeWeight(Math.max(5, size * 0.08)); // 設定極光線寬
  stroke("#5e60ce"); // 設定第一道極光顏色
  arc(0, size * 0.35, size * 1.05, size * 1.18, PI, TWO_PI); // 繪製第一道極光
  stroke("#4cc9a5"); // 設定第二道極光顏色
  arc(size * 0.06, size * 0.38, size * 0.72, size * 0.92, PI, TWO_PI); // 繪製第二道極光
  stroke("#80ed99"); // 設定第三道極光顏色
  arc(size * 0.12, size * 0.41, size * 0.43, size * 0.67, PI, TWO_PI); // 繪製第三道極光
  noStroke(); // 移除星星外框
  fill("#ffffff"); // 設定星星顏色
  ellipse(-size * 0.35, -size * 0.25, size * 0.07, size * 0.07); // 繪製左側星星
  ellipse(size * 0.30, -size * 0.36, size * 0.07, size * 0.07); // 繪製右側星星
} // 完成極光圖示

function drawCorrectMark(correct, box) { // 繪製答案模式下的正誤提示
  fill(correct ? "#386641" : "#9d1c2b"); // 使用與答案底色對應的深色文字
  textSize(Math.max(11, Math.min(15, box.w * 0.07))); // 設定正誤文字大小
  text(correct ? "✓ 正確" : "✕ 錯誤", box.x + box.w / 2, box.y + box.h + 13); // 顯示本題正誤但不提前透露答案
} // 完成正誤提示繪製

function drawTray() { // 繪製下方六個名稱標籤
  const trayTop = layoutData.tray[0].y; // 取得名稱區起點
  noStroke(); // 移除區域標題外框
  fill(UI.navy); // 設定名稱區標題顏色
  textAlign(LEFT, CENTER); // 設定區域標題靠左
  textSize(windowWidth < 560 ? 14 : 16); // 設定名稱區標題大小
  text("可拖曳的天氣名稱", layoutData.metrics.margin, trayTop - 26); // 清楚標示下方名稱區
  textAlign(CENTER, CENTER); // 還原文字預設置中
  quiz.labels.forEach((label, index) => { if (!isPlaced(index) && (!dragging || dragging.labelId !== index)) drawLabel(label, layoutData.tray[index], false); }); // 只繪製尚未放入答案格的標籤
} // 完成名稱區繪製

function drawLabel(label, box, active) { // 繪製單一名稱標籤
  fill(active ? "#fff1b8" : "#ffffff"); // 設定一般或拖曳中的標籤底色
  stroke(active ? UI.gold : "rgba(24,50,74,0.30)"); // 設定一般或拖曳中的邊框色
  strokeWeight(2); // 設定標籤邊框寬度
  rect(box.x, box.y, box.w, box.h, 12); // 繪製圓角名稱標籤
  noStroke(); // 移除名稱文字外框
  fill(UI.ink); // 設定名稱文字顏色
  textSize(Math.max(14, Math.min(20, box.w * 0.105))); // 依標籤寬度調整文字大小
  text(label.icon + "  " + label.name, box.x + box.w / 2, box.y + box.h / 2); // 繪製天氣圖示與中文名稱
} // 完成單一名稱標籤

function drawDraggingLabel() { // 繪製跟隨游標或手指的名稱標籤
  const label = quiz.labels[dragging.labelId]; // 讀取目前拖曳中的名稱
  const box = { x: dragging.x - 90, y: dragging.y - 25, w: 180, h: 50 }; // 建立拖曳中的安全尺寸
  drawLabel(label, box, true); // 以高亮樣式繪製拖曳標籤
} // 完成拖曳標籤繪製

function drawButtons() { // 繪製三個畫布互動按鈕
  drawButton(layoutData.buttons[0], "點我看答案", quiz.showAnswer || quiz.submitted, "answer"); // 繪製查看答案按鈕
  drawButton(layoutData.buttons[1], quiz.submitted ? "已交卷看成績" : "交卷看成績", quiz.submitted, "submit"); // 繪製交卷按鈕
  drawButton(layoutData.buttons[2], "重新出題", false, "reset"); // 繪製永遠可用的重新出題按鈕
} // 完成三個按鈕繪製

function drawButton(box, label, disabled, kind) { // 繪製單一可點擊按鈕
  const buttonColor = kind === "reset" ? "#5c677d" : kind === "submit" ? "#1769aa" : "#386641"; // 依按鈕用途選擇顏色
  fill(disabled ? "rgba(24,50,74,0.44)" : buttonColor); // 鎖定按鈕使用半透明深色
  noStroke(); // 移除按鈕外框
  rect(box.x, box.y, box.w, box.h, 12); // 繪製圓角按鈕
  fill("#ffffff"); // 設定按鈕文字為白色
  textSize(Math.max(14, Math.min(18, box.w * 0.075))); // 依按鈕寬度設定文字大小
  text(label, box.x + box.w / 2, box.y + box.h / 2); // 繪製清楚可見的按鈕文字
} // 完成單一按鈕繪製

function drawResultPanel() { // 繪製交卷後的分數、時間與每題結果
  if (!quiz.submitted) return; // 未交卷前完全不顯示正誤與成績
  const panelX = layoutData.metrics.margin; // 設定成績面板左側位置
  const panelW = width - layoutData.metrics.margin * 2; // 設定成績面板寬度
  const panelY = layoutData.resultY; // 讀取成績面板起點
  fill(255, 255, 255, 242); // 使用高可讀性的面板底色
  noStroke(); // 移除成績面板外框
  rect(panelX, panelY, panelW, 116, 16); // 繪製成績摘要面板
  fill(UI.navy); // 設定成績文字顏色
  textSize(windowWidth < 560 ? 17 : 21); // 設定摘要標題大小
  text("成績：" + quiz.score + "%　答對 " + quiz.correct + "/6　用時 " + formatTime(quiz.elapsed), width / 2, panelY + 27); // 顯示百分比答對題數與用時
  fill(quiz.score > 60 ? "#386641" : "#9d1c2b"); // 依分數設定鼓勵文字顏色
  textSize(windowWidth < 560 ? 15 : 18); // 設定鼓勵文字大小
  text(quiz.score > 60 ? "太棒了！彩帶正在為你慶祝！" : "繼續努力！再挑戰一次！", width / 2, panelY + 55); // 顯示高分彩帶或鼓勵訊息
  const resultText = quiz.cards.map((card, index) => { const labelId = quiz.slots[index]; const correct = labelId !== null && quiz.labels[labelId].key === card.key; return (index + 1) + " " + (correct ? "✓" : "✕"); }).join("　"); // 組合六題逐題對錯
  fill(UI.ink); // 設定逐題結果文字顏色
  textSize(windowWidth < 560 ? 13 : 16); // 設定逐題結果字體大小
  text("每題結果：" + resultText, width / 2, panelY + 88); // 顯示每一題的對錯
} // 完成交卷結果繪製

function startDrag(labelId, source, sourceSlot) { // 開始拖曳指定名稱
  if (!Number.isInteger(labelId) || labelId < 0 || labelId >= quiz.labels.length) return; // 驗證名稱索引避免資料錯誤
  if (source === "slot") quiz.slots[sourceSlot] = null; // 從答案格取出時先清空來源格
  dragging = { labelId: labelId, source: source, sourceSlot: sourceSlot, x: mouseX, y: mouseY }; // 儲存拖曳來源與目前座標
} // 完成拖曳開始

function dropInSlot(targetSlot) { // 將拖曳中的名稱放入目標答案格
  if (dragging === null || targetSlot < 0 || targetSlot >= 6) return; // 驗證拖曳資料與目標索引
  const oldLabel = quiz.slots[targetSlot]; // 讀取目標格原本的名稱
  if (oldLabel !== null && dragging.source === "slot" && dragging.sourceSlot !== targetSlot) quiz.slots[dragging.sourceSlot] = oldLabel; // 從格子拖到另一格時執行互換
  quiz.slots[targetSlot] = dragging.labelId; // 將拖曳名稱放入目標格
} // 完成名稱放入

function returnToTray() { // 將名稱拖回下方名稱區
  if (dragging !== null && dragging.source === "slot") quiz.slots[dragging.sourceSlot] = null; // 從答案格拖回時保持來源格清空
} // 完成拖回名稱區

function restoreDrag() { // 將未成功放置的名稱復原
  if (dragging !== null && dragging.source === "slot") quiz.slots[dragging.sourceSlot] = dragging.labelId; // 從答案格拖出失敗時放回原格
} // 完成拖曳復原

function isPlaced(labelId) { // 判斷名稱是否已經放入答案格
  return quiz.slots.indexOf(labelId) >= 0; // 回傳名稱是否位於任一答案格
} // 完成名稱放置判斷

function hitSlot(x, y) { // 判斷座標命中的答案格索引
  for (let i = 0; i < layoutData.cards.length; i += 1) { if (inside(x, y, getSlotBox(layoutData.cards[i]))) return i; } // 逐一檢查六個答案格
  return -1; // 沒有命中時回傳無效索引
} // 完成答案格命中測試

function hitTrayLabel(x, y) { // 判斷座標命中的名稱標籤索引
  for (let i = 0; i < layoutData.tray.length; i += 1) { if (!isPlaced(i) && inside(x, y, layoutData.tray[i])) return i; } // 逐一檢查尚未放置的標籤
  return -1; // 沒有命中時回傳無效索引
} // 完成名稱標籤命中測試

function inTrayArea(x, y) { // 判斷座標是否落在下方名稱區
  const first = layoutData.tray[0]; // 取得名稱區第一格
  const last = layoutData.tray[5]; // 取得名稱區最後一格
  return x >= first.x - 12 && x <= width - layoutData.metrics.margin + 12 && y >= first.y - 18 && y <= last.y + last.h + 18; // 回傳名稱區範圍判斷
} // 完成名稱區判斷

function hitButton(x, y) { // 判斷座標命中的功能按鈕
  if (inside(x, y, layoutData.buttons[0])) return "answer"; // 命中查看答案按鈕時回傳答案
  if (inside(x, y, layoutData.buttons[1])) return "submit"; // 命中交卷按鈕時回傳交卷
  if (inside(x, y, layoutData.buttons[2])) return "reset"; // 命中重新出題按鈕時回傳重設
  return ""; // 沒有命中按鈕時回傳空字串
} // 完成按鈕命中測試

function inside(x, y, box) { // 判斷座標是否位於矩形內
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h; // 回傳矩形碰撞結果
} // 完成矩形碰撞判斷

function submitQuiz() { // 計算交卷成績並鎖定拖曳
  if (quiz.submitted) return; // 已交卷時不重複計算
  quiz.correct = 0; // 將答對題數歸零
  quiz.cards.forEach((card, index) => { const labelId = quiz.slots[index]; if (labelId !== null && quiz.labels[labelId].key === card.key) quiz.correct += 1; }); // 逐題檢查配對答案
  quiz.score = Math.round(quiz.correct / 6 * 100); // 將答對題數換算成百分比
  quiz.elapsed = Math.max(0, Math.floor((millis() - beganAt) / 1000)); // 計算從開始到交卷的秒數
  quiz.showAnswer = true; // 交卷後顯示每格正誤顏色
  quiz.submitted = true; // 交卷後鎖定拖曳與作答
  if (quiz.score > 60) createConfetti(); // 分數高於百分之六十時建立彩帶
  refreshCanvasSize(); // 為交卷後成績區重新配置畫布高度
} // 完成交卷計算

function formatTime(seconds) { // 將秒數格式化成分鐘與秒數
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" + String(seconds % 60).padStart(2, "0"); // 回傳 MM:SS 格式時間
} // 完成時間格式化

function createConfetti() { // 建立高分彩帶粒子
  confetti = []; // 清空舊彩帶資料
  const colors = ["#e63946", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"]; // 定義彩帶顏色
  for (let i = 0; i < 100; i += 1) confetti.push({ x: Math.random() * width, y: -Math.random() * height, speed: 1.4 + Math.random() * 3.2, size: 5 + Math.random() * 7, phase: Math.random() * TWO_PI, color: colors[i % colors.length] }); // 建立隨機彩帶粒子
} // 完成彩帶建立

function drawConfetti() { // 更新並繪製高分彩帶
  noStroke(); // 移除彩帶外框
  confetti.forEach((piece) => { piece.y += piece.speed; piece.x += Math.sin(frameCount * 0.03 + piece.phase) * 0.8; fill(piece.color); push(); translate(piece.x, piece.y); rotate(frameCount * 0.04 + piece.phase); rect(0, 0, piece.size, piece.size * 0.48, 2); pop(); if (piece.y > height + 20) { piece.y = -20; piece.x = Math.random() * width; } }); // 更新位置並循環繪製彩帶
} // 完成彩帶繪製

function drawBackground() { // 繪製全螢幕場景變換天氣背景
  const scene = Math.floor(millis() / SCENE_TIME) % 6; // 依時間取得目前背景場景
  const palettes = [["#8ec5fc", "#e0c3fc"], ["#c8d6e5", "#f5f6fa"], ["#4b79a1", "#283e51"], ["#b8d8e8", "#eaf6ff"], ["#384a69", "#182848"], ["#56ccf2", "#f2c94c"]]; // 定義六組背景漸層色
  const palette = palettes[scene]; // 讀取目前場景漸層色
  noStroke(); // 移除背景色帶外框
  for (let y = 0; y < height; y += 10) { fill(lerpColor(color(palette[0]), color(palette[1]), y / height)); rect(0, y, width, 10); } // 以色帶繪製全畫布漸層
  if (scene === 0) drawSceneSunny(); // 繪製晴天背景裝飾
  if (scene === 1) drawSceneCloudy(); // 繪製多雲背景裝飾
  if (scene === 2) drawSceneRain(); // 繪製下雨背景裝飾
  if (scene === 3) drawSceneSnow(); // 繪製下雪背景裝飾
  if (scene === 4) drawSceneStorm(); // 繪製雷雨背景裝飾
  if (scene === 5) drawSceneRainbow(); // 繪製彩虹背景裝飾
  fill(255, 255, 255, 72); // 加上半透明淺色 overlay 提高整體可讀性
  rect(0, 0, width, height); // 讓背景裝飾不蓋住卡片與文字
} // 完成背景繪製

function drawSceneSunny() { // 繪製晴天動態背景
  const pulse = 84 + Math.sin(frameCount * 0.025) * 8; // 計算太陽呼吸大小
  noStroke(); // 移除太陽外框
  fill(255, 202, 58, 70); // 繪製太陽光暈
  ellipse(width - 90, 100, pulse * 2.4, pulse * 2.4); // 繪製太陽光暈圓
  fill(255, 202, 58, 175); // 設定太陽本體色
  ellipse(width - 90, 100, pulse, pulse); // 繪製太陽本體
  drawSoftCloud(120, 126, 1, 115); // 繪製左側漂浮雲朵
  drawSoftCloud(width - 250, 200, 0.75, 80); // 繪製右側漂浮雲朵
} // 完成晴天背景

function drawSceneCloudy() { // 繪製多雲漂移背景
  const drift = (frameCount * 0.25) % (width + 260) - 130; // 計算第一朵雲的水平移動
  drawSoftCloud(drift, 115, 1.15, 145); // 繪製第一朵移動雲
  drawSoftCloud((drift + width * 0.55) % (width + 280) - 140, 220, 0.8, 105); // 繪製第二朵移動雲
  drawSoftCloud((drift + width * 0.82) % (width + 280) - 140, 70, 0.62, 85); // 繪製第三朵移動雲
} // 完成多雲背景

function drawSceneRain() { // 繪製下雨動態背景
  drawSoftCloud(width * 0.2, 92, 1.05, 80); // 繪製左側雨雲
  drawSoftCloud(width * 0.78, 168, 0.9, 65); // 繪製右側雨雲
  stroke(255, 255, 255, 105); // 設定雨絲顏色
  strokeWeight(1.5); // 設定雨絲寬度
  for (let i = 0; i < 55; i += 1) { const x = (i * 83 + frameCount * 1.8) % (width + 80) - 40; const y = (i * 47 + frameCount * 3.4) % (height + 90) - 90; line(x, y, x - 8, y + 20); } // 繪製持續下落雨絲
} // 完成下雨背景

function drawSceneSnow() { // 繪製下雪動態背景
  noStroke(); // 移除雪花外框
  for (let i = 0; i < 48; i += 1) { const x = (i * 97 + Math.sin(frameCount * 0.01 + i) * 35) % width; const y = (i * 61 + frameCount * (0.5 + i % 3 * 0.18)) % (height + 30) - 30; fill(255, 255, 255, 170); ellipse(x, y, 4 + i % 4, 4 + i % 4); } // 繪製緩慢飄落雪花
} // 完成下雪背景

function drawSceneStorm() { // 繪製雷雨動態背景
  drawSoftCloud(width * 0.25, 106, 1.25, 60); // 繪製左側厚雷雲
  drawSoftCloud(width * 0.73, 145, 1, 50); // 繪製右側厚雷雲
  if (Math.floor(frameCount / 30) % 5 === 0) { fill(255, 255, 255, 70); rect(0, 0, width, height); stroke(255, 202, 58, 210); strokeWeight(4); line(width * 0.52, 90, width * 0.47, 160); line(width * 0.47, 160, width * 0.54, 160); line(width * 0.54, 160, width * 0.49, 235); } // 週期閃爍繪製雷電
} // 完成雷雨背景

function drawSceneRainbow() { // 繪製彩虹動態背景
  noFill(); // 將彩虹設定為弧線
  strokeWeight(13); // 設定彩虹線寬
  const colors = ["#e63946", "#f77f00", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93"]; // 定義背景彩虹色
  colors.forEach((rainbowColor, index) => { stroke(rainbowColor); arc(width * 0.5, height * 0.54, 420 - index * 25, 330 - index * 25, PI, TWO_PI); }); // 逐層繪製背景彩虹
  drawSoftCloud(width * 0.12, height * 0.45, 1, 150); // 繪製彩虹左側雲朵
  drawSoftCloud(width * 0.88, height * 0.45, 1, 150); // 繪製彩虹右側雲朵
} // 完成彩虹背景

function drawSoftCloud(x, y, scale, alpha) { // 繪製半透明背景雲朵
  noStroke(); // 移除雲朵外框
  fill(255, 255, 255, alpha); // 設定背景雲朵透明色
  ellipse(x, y, 100 * scale, 42 * scale); // 繪製雲朵底部
  ellipse(x - 36 * scale, y + 2 * scale, 58 * scale, 38 * scale); // 繪製雲朵左側
  ellipse(x + 31 * scale, y - 8 * scale, 67 * scale, 54 * scale); // 繪製雲朵右側
  ellipse(x + 3 * scale, y - 23 * scale, 70 * scale, 62 * scale); // 繪製雲朵中央
} // 完成背景雲朵

function shuffleArray(source) { // 建立不修改來源的隨機陣列
  const result = source.slice(); // 複製來源陣列
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); const temporary = result[i]; result[i] = result[j]; result[j] = temporary; } // 使用 Fisher-Yates 演算法打亂資料
  return result; // 回傳隨機排列結果
} // 完成隨機排列
