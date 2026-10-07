# HANDOFF — Gorilla Gun 沙盒模式 POC

給下一位開發者（人或 AI）的接手地圖。先讀 `README.md` 的規格與操作，再看這份。

## 一句話

`index.html` 單檔 Three.js r128 原型：程式生成特效 × 34 把技能 × 5 元素 × 3 階 × 身上 6 把 GLB 武器 × Boss（GLB＋骨架動畫）。不用 build，雙擊或 GitHub Pages 直接跑。介面是「南瓜墨金美學 1.2」：紙底白卡面板＋深炭舞台，金色只給「召喚 Boss」。

## 執行與驗證

| 要做的事 | 怎麼做 |
|---|---|
| 本機開 | 雙擊 `index.html`（file://）。模型從 `models.js` 讀，不 fetch 檔案 |
| 線上 | <https://terry12260201.github.io/gorilla-gun-sandbox-poc/>（push 到 `main` 自動更新） |
| 改了 `assets/` | `node tools/build-models.mjs` → commit `models.js` |
| 自動化測試 | console 呼叫 `step(1/30)` 推進時間（見下方） |
| 載入成功的判斷 | 面板「角色與 Boss」右側顯示「模型 15/15 已載入」，console 無錯 |
| 深淺模式 | 導覽列右側月亮／太陽；記在 `localStorage.igTheme`，網址加 `?theme=night` 可直接開深色 |

外部依賴（CDN，Three.js 版本鎖死 r128）：
- `three.min.js`（cdnjs r128）
- `examples/js/loaders/GLTFLoader.js`、`examples/js/utils/SkeletonUtils.js`（jsdelivr three@0.128.0，非 module 版，掛在 `THREE.*`）
- Google Fonts：Roboto、Noto Sans TC、Roboto Mono（離線時退回蘋方／微軟正黑，不影響功能）

本機附帶（`vendor/ink-gold/`）：`ink-gold-ui.js`（磁吸點格＋深淺切換，從設計系統原樣複製）、`pumpkin-logo-black.svg`（正式 Logo）。

## 架構地圖（`index.html`，行號為本版約略位置）

| 行 | 區塊 | 重點 |
|---|---|---|
| 11–433 | **墨金 CSS 套件（原樣內嵌）** | `/* ink-gold kit:start */ … /* ink-gold kit:end */`；所有 `--ig-*` token 在這段的 `:root` |
| 434–630 | 本專案版面 CSS | 面板 `.gg-panel`、6 格 `#slots`、舞台 `.gg-stage`、HUD（`#hpBox`／`#toolkit`／`#toast`／`#bossBar`／`.lbl`）、900px 以下改直排 |
| 632–745 | HTML | 導覽 `.gg-nav` → 面板 `#ui` → 格子列 `.gg-bar` → 舞台 `#stage`（`#c` 畫布＋`#hurt`／`#flash`＋HUD） |
| 761–804 | **沙盒 POC 設定表** | `MODEL_INFO`、`WEAPON_MODEL`（武器↔模型）、`SLOT_OFFSETS`（6 槽位置）、`HERO_MODELS`／`HERO_FIT`、`BOSS`（Boss 全部數字）、`PLAYER_HP` |
| 805–831 | 元素設定 | `ELEM`（5 元素 × 色票 × 三階說明）、`COMPOUND`（混搭）、`EL`（目前選的主副元素）、`W`（所有面板開關） |
| 832–861 | 場景 | renderer（sRGB＋ACES）、燈、程式生成地板；舞台底色／霧／地板＝墨金深炭 |
| 862–891 | 玩家 | `player.group` 底下：`proc`（程式生成猩猩）、`hero`（英雄 GLB 掛點）、`hL/hR`（手的錨點）、`glow`、`drone`；`player.handBase` 決定手的位置 |
| 892–1177 | **特效 8 元件** | 見下表 |
| 1178–1292 | 怪物 `Enemies` | InstancedMesh 一次畫完；`hit()` 唯一命中入口；Boss 也住在這個陣列裡 |
| 1293–1420 | 元素三階 | `applyOne`／`applyElements`／`onDeathElements`／`updateStatus`／`updatePools` |
| 1421–1449 | 投射物 `Bullets` | ④ 拖尾 |
| 1450–1537 | V1 基礎 | 無人機、祝福鐵鎚、連鎖閃電、天空落雷、砸地、`flashScreen`、`toast` |
| 1538–2133 | 武器庫 V2／V3／V4 | 每把 `castXxx()`＋`updateXxx(dt)` |
| 2134–2200 | `WEAPONS` 陣列與裝備 | `updateWeapons`（自動施放）、`manualCast`、`setEquip`、`rebuildSlots`（上方 6 格，用 `<button>`） |
| 2201–2244 | **模型載入** | `loadModels` → `onModelsReady`；`makeWeaponPrefab`（置中、縮放、槍管轉 +Z）、`makeThumbs`（離屏渲染縮圖） |
| 2245–2260 | 外觀 | `applyLook()` |
| 2261–2301 | **身上 6 槽位** | `assignBodySlots`、`updateBodySlots`（跟隨＋瞄準）、`muzzleOf`／`muzzle`（槍口座標）、`slotKick`（後座＋發光） |
| 2302–2320 | 玩家 HP | `hurtPlayer(dmg, src)`、`updatePlayerHP(dt)` |
| 2321–2489 | **Boss** | `summonBoss`、`bossPlay`（動畫切換）、`updateBoss`（狀態機）、`bossSync`（位置＋狀態染色）、`bossShock`、`bossTriShot`／`bossRingShot`、`bossExplode`、骷髏彈 `fireSkull`／`updateBossShots`、`updateBossBar`（座標相對舞台畫布） |
| 2490–2506 | 鏡頭、輸入 | 拖曳轉鏡頭、滾輪縮放、鍵盤（B＝Boss） |
| 2507–2578 | UI 綁定 | `bindRange`／`bindCheck`、`seg`＋`syncPressed`（aria-pressed）、元素按鈕（`--el` 色點）、武器清單、快速換裝 `PRESETS`、`loadModels()` 起點、位置標籤 |
| 2579–2645 | 主迴圈 | `resize()` 跟著舞台大小（`ResizeObserver`）；`frame()` → `step(dt)`；`window.step = step` |

## 命中入口（最重要的一條規則）

```
任何武器 → enemies.hit(e, dmg, dir, col, opts) → 數值／暴擊 → 打擊感（閃白、hitstop、擊退、數字、hitFX）
                                              → applyElements(e, …)（主副元素各一次＋混搭）
                                              → hp ≤ 0 → dying → pop()（碎塊、金幣、擊殺爆炸卡、onDeathElements）
```

- `opts`：`knock` 擊退、`fxScale` 特效大小、`lift` 頂飛、`small` 小字、`noElem` 不觸發元素（元素本身造成的傷害要帶，避免無限連鎖）、`depth` 連鎖深度。
- **Boss（`e.boss === true`）**：同一個 `hit()`，但跳過 hitstop／擊退／頂飛，改呼叫 `bossOnHit(e)`（Hit 動畫）。`Enemies.update()` 遇到 Boss 直接交給 `updateBoss(e, dt)`，不畫 instanced 方塊。
- Boss 的位置以 `boss.pos` 為準，每幀覆寫 `e.pos`，所以其他系統直接改 `e.pos`（黑洞、龍捲風、防護罩推擠）對 Boss 無效——這是刻意的。

## 特效 8 元件（所有武器只用這 8 種拼出來）

| # | 元件 | 類別／函式 | 池大小 |
|---|---|---|---|
| ① | 震波環 Ring | `AgedPool` → `ringAt(pos, r, col, dur, w)` | 72 |
| ② | 爆裂球 Burst | `Bursts` → `bursts.spawn(pos, r, col, dur)` | 64 |
| ③ | 光束／閃電 Bolt | `Bolts`（ribbon）→ `bolts.fire(a, b, col, dur, width, amp)` | 96 |
| ④ | 拖尾 Trail | `Bullets`、`Missiles`（投射物＋粒子尾） | 220／48 |
| ⑤ | 火花／碎塊 Spark | `Particles` → `sparks.spawn(pos, vel, col, size, life, {grav, drag, target, delay})` | 3000 |
| ⑥ | 地面貼花 Decal | `crackAt`（地裂）、`discAt`（火海／毒池／預警圈）、`webAt`（網） | 24／24／16 |
| ⑦ | 光柱 Pillar | `Pillars` → `pillars.spawn(pos, r, h, col, dur)` | 14 |
| ⑧ | 傷害數字 Number | `Numbers` → `numbers.spawn(pos, text, crit, col, small)` | 56 |

池子是環狀覆寫（cursor），爆量時最舊的會被蓋掉，不會報錯。舞台右下的特效面板即時顯示各元件數量。

## 擴充點

| 想做 | 改哪裡 |
|---|---|
| 新武器 | `castXxx()`＋`WEAPONS` 一行＋（選）`WEAPON_MODEL` 一行；從槍口出用 `muzzle('id')` |
| 武器換模型 | `WEAPON_MODEL`；新 GLB 放 `assets/weapons/` 後跑 `node tools/build-models.mjs`，`MODEL_INFO` 加中文名 |
| 槽位排列 | `SLOT_OFFSETS`（x 右、y 高、z 前；負 z＝背後） |
| 新元素／新混搭 | `ELEM`、`applyOne` 的 switch、`onDeathElements`、`updateStatus`、`COMPOUND`＋`hasCompound()` |
| 新外觀 | `HERO_MODELS`＋面板 `<select id="look">`；大小 `HERO_FIT` |
| Boss 數值 | `BOSS` 常數（節奏、傷害、距離、階段門檻） |
| Boss 招式 | `updateBoss()` 的 `switch (b.state)` 加狀態；子彈用 `fireSkull()`；AOE 用 `bossShock()` |
| 換 Boss 模型 | `BOSS.model`；需含 `Idle/Walk/Attack/Hit/Death` 五個 clip |
| 玩家受擊反饋 | `hurtPlayer()`、`updatePlayerHP()`、CSS `#hurt` |
| 快速換裝組合 | `PRESETS`（UI 綁定區） |
| 介面配色／字體 | 只改 `--ig-*` token（套件段）；本專案版面在「工作區版面」段，HUD 底色是 `--gg-hud` |
| 更新墨金套件 | 新版 `ink-gold.css` 整段貼回 `kit:start`／`kit:end` 之間；`ink-gold-ui.js` 覆蓋 `vendor/ink-gold/` |

## 測試（`window.step(dt)`）

```js
W.spawnRate = 0; for (const e of enemies.live()) e.hp = 0;     // 清場、停生怪
summonBoss(); for (let i = 0; i < 60; i++) step(1/30);         // Boss 進場
let k = 0; while (boss.state !== 'tele' && k++ < 400) step(1/30); // 推到跳砸預警
boss.e.hp = boss.e.maxhp * .49; step(1/30); boss.phase           // → 2
boss.e.hp = .01; step(1/30); boss.state                          // → 'dying'
```

驗證過的項目（headless Chrome 走 file://＋線上 Pages）：模型 15/15 載入、console 無錯、6 槽位出現且會瞄準與後座、四種外觀切換、Boss 進場→彈跳→三連彈→紅圈預警→跳砸扣血→階段 2 震波→環射 12 發→Death 動畫→大爆炸＋金色碎塊、375px 寬無水平捲動。

墨金版另外驗證：B 鍵與金色按鈕都能召喚 Boss、Boss 血條與位置標籤落在舞台內、分段按鈕 aria-pressed 跟著切換、深淺切換會記住、1440／1024／768／414／375／320px 頁面寬＝視窗寬（無水平捲動）、面板每列標籤與控制項不重疊、點格游標吸附有反應。

## 注意事項

1. **所有時間都要走 `step(dt)`**：延遲動作用 `after(秒, fn)`，不要用 `setTimeout`／`performance.now()`；Boss 動畫的 `mixer.update(dt)` 也在 `updateBoss()` 裡。唯一例外是擊殺／分統計（`killLog`）與 `flashScreen()` 的淡出。
2. **共用暫存向量**（`_v`、`_v2`、`_s`、`_hv`、`_d`、`_c`）會被很多函式覆寫。傳進 `spawn()` 的位置會被複製，安全；但不要在呼叫 `enemies.hit()` 之後還拿 `_v2` 當資料用。
3. **模型 key** ＝ `assets/` 底下的相對路徑去掉 `.glb`（例：`weapons/smg`、`boss/coffin_hopper`）。
4. **`models.js` 是產生物**，不要手改；改了 `assets/` 一定要重跑工具再 commit，否則線上版不會更新。
5. 武器 GLB 的**槍管要朝 +X**；程式會轉成 +Z 給 `lookAt` 用。槍口位置＝bbox 的 +X 端。
6. Boss 模型的材質是「底色黑＋emissiveMap」（無光照做法），所以染色是從原本 emissive（白）往狀態色偏，不能直接把 emissive 設成某個顏色，不然整隻會變黑。換 Boss 時注意材質做法。
7. 按鍵已用：WASD／方向鍵、Space、B（Boss）、以及 `WEAPONS` 裡每把的 `key`（陷阱已從 B 改到 1）。加新武器前先查不要撞鍵。
8. Three.js 鎖 r128（`examples/js` 非 module 版在 r148 之後被移除），升級版本要改成 ES module 寫法。
9. 交接文件與 commit 訊息不寫客戶名、發行商、金額、時程與真人分工；分工只寫職能。
10. **舞台座標**：Boss 血條、位置標籤的 `left/top` 是相對 `#stage`（用 `canvas.clientWidth/clientHeight` 換算），不是整個視窗；新增 3D 跟隨的 HTML 標籤請放進 `#stage`。
11. **金色只有一顆**：新按鈕預設白底；次要主動作用 `class="ink"`；不要在面板裡再加金色按鈕或金色字。

## 待確認（交給專案負責人決定）

- LICENSE 尚未加（待決定授權方式）。
- 「借用」的模型（冰封球、陷阱、哨塔、雷暴雲、黑洞）之後是否要做專屬模型。
- 英雄模型目前是 T-pose 上半身，正式版的手部姿勢／動畫來源待定。
