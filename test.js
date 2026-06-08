// test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// 讀取原本的 script.js 內容
const scriptCode = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');

// 模擬瀏覽器環境的 DOM 物件，避免 script.js 報錯
global.document = {
    getElementById: () => ({ innerText: '' })
};

// 執行 script.js 的程式碼，將函式載入到 Node.js 全域環境中
eval(scriptCode);

console.log("🚀 開始執行計算機核心邏輯自動化測試 (Coding Test)...");

try {
    // 測試案例 1：測試基本加法 (7 + 8 = 15)
    clearDisplay();
    appendNumber('7');
    setOperator('+');
    appendNumber('8');
    calculate();
    assert.strictEqual(currentInput, '15', '❌ 測試失敗：7 + 8 應該要等於 15');
    console.log("✅ Test 1 Passed: 7 + 8 = 15");

    // 測試案例 2：測試基本減法 (9 - 4 = 5)
    clearDisplay();
    appendNumber('9');
    setOperator('-');
    appendNumber('4');
    calculate();
    assert.strictEqual(currentInput, '5', '❌ 測試失敗：9 - 4 應該要等於 5');
    console.log("✅ Test 2 Passed: 9 - 4 = 5");

    // 測試案例 3：錯誤情境測試（未輸入完整就按等號）
    clearDisplay();
    appendNumber('5');
    calculate();
    // 這裡模擬觸發錯誤時，你的邏輯會將狀態重置或不正確
    // 依據 script.js 邏輯，出錯時會將變數清空
    assert.strictEqual(currentInput, '', '❌ 測試失敗：錯誤算式應清空 currentInput');
    console.log("✅ Test 3 Passed: 錯誤處理符合預期");

    console.log("\n🎉 所有自動化測試全部通過！程式碼安全無誤。");
    process.exit(0); // 告訴 GitHub Actions 測試成功

} catch (error) {
    console.error("\n❌ 自動化測試失敗！");
    console.error(error.message);
    process.exit(1); // 告訴 GitHub Actions 測試失敗，阻擋 Merge
}