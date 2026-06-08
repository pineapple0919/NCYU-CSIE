# 擬真網頁計算機 V2

這是一個使用 **HTML、CSS、JavaScript** 製作的網頁版計算機專案。  
專案提供簡潔的計算機介面，支援基本四則運算，並加入除以零的錯誤處理機制。

## 專案特色

- 使用純前端技術開發，無需額外安裝套件
- 支援基本四則運算：
  - 加法 `+`
  - 減法 `-`
  - 乘法 `×`
  - 除法 `÷`
- 提供清除功能 `C`
- 具備除以零防呆處理
- 使用 CSS Grid 建立按鍵版面
- 按鈕具有擬真按壓效果
- 適合用於前端基礎練習與 JavaScript 重構練習

## 檔案結構

```text
.
├── index.html   # 網頁主結構與計算機按鈕
├── style.css    # 計算機外觀、排版與按鈕樣式
└── script.js    # 計算機互動邏輯與四則運算功能
```

## 各檔案說明

### `index.html`

負責建立計算機的 HTML 結構，包含：

- 計算機外層容器
- 顯示螢幕 `#display`
- 數字按鈕 `0 ~ 9`
- 運算子按鈕 `+`、`-`、`×`、`÷`
- 等號按鈕 `=`
- 清除按鈕 `C`

此檔案透過：

```html
<link rel="stylesheet" href="style.css">
<script src="script.js"></script>
```

分別載入樣式檔與 JavaScript 邏輯檔。

## `style.css`

負責整體畫面與計算機外觀設計，包含：

- 頁面置中排版
- 深色背景
- 計算機卡片外觀
- 顯示螢幕樣式
- 四欄式按鍵網格
- 數字、運算子、清除按鈕的不同顏色設計
- 按鈕按下時的位移與陰影效果

主要使用的 CSS 技術包括：

- `display: flex`
- `display: grid`
- `grid-template-columns`
- `box-shadow`
- `border-radius`
- `:active` 互動效果

## `script.js`

負責計算機的互動與運算邏輯。

### 主要狀態變數

```javascript
let currentInput = '';
let previousInput = '';
let currentOperator = null;
```

| 變數名稱 | 用途 |
|---|---|
| `currentInput` | 儲存目前輸入的數字 |
| `previousInput` | 儲存前一個輸入的數字 |
| `currentOperator` | 儲存目前選擇的運算子 |

### 主要函式

| 函式名稱 | 功能 |
|---|---|
| `updateDisplay(value)` | 更新計算機螢幕顯示 |
| `appendNumber(number)` | 處理數字輸入 |
| `setOperator(operator)` | 設定目前選擇的運算子 |
| `calculate()` | 執行加、減、乘、除運算 |
| `clearDisplay()` | 清除畫面與計算狀態 |
| `resetState()` | 重置所有狀態變數 |

## 使用方式

1. 將以下三個檔案放在同一個資料夾中：

   ```text
   index.html
   style.css
   script.js
   ```

2. 使用瀏覽器開啟 `index.html`

3. 點擊計算機按鈕即可開始使用

不需要安裝 Node.js、npm 或其他套件。

## 操作範例

### 加法

```text
8 + 2 = 10
```

### 減法

```text
9 - 4 = 5
```

### 乘法

```text
6 × 3 = 18
```

### 除法

```text
8 ÷ 2 = 4
```

### 除以零

```text
8 ÷ 0 = 錯誤
```

當使用者進行除以零時，畫面會顯示 `錯誤`，並重置目前計算狀態。

### V2

相較於 V1，此版本新增：

- 乘法 `×`
- 除法 `÷`
- 除以零錯誤處理
- `resetState()` 狀態重置函式
- 更完整的四則運算功能

