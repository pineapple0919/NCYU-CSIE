/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('網頁計算機 V3 核心邏輯與進階運算功能測試', () => {

    beforeEach(() => {
        // 1. 初始化模擬瀏覽器的 DOM 結構
        document.body.innerHTML = `<div id="display"></div>`;

        // 2. 讀取並動態載入 script.js 的內容
        const scriptPath = path.join(__dirname, 'script.js');
        const scriptCode = fs.readFileSync(scriptPath, 'utf8');
        
        // 3. 關鍵魔法：利用 Function 執行並將環境對象強行注入 global
        const runInGlobal = new Function(`
            with (global) {
                ${scriptCode}
                // 將 V3 方法與變數掛載到 global，讓測試案例直接調用
                global.appendNumber = appendNumber;
                global.setOperator = setOperator;
                global.calculate = calculate;
                global.clearDisplay = clearDisplay;
                global.applyAdvanced = applyAdvanced;
            }
        `);
        runInGlobal();

        // 4. 每題開始前，初始化清除狀態
        clearDisplay();
    });

    // ==========================================
    // 1. 基礎四則運算功能測試套件 (Basic Functionality)
    // ==========================================
    describe('【基礎四則運算功能測試】', () => {

        test('TC-V3-01: 正常的加法與乘法運算測試', () => {
            appendNumber('8');
            setOperator('+');
            appendNumber('2');
            calculate();
            expect(document.getElementById('display').innerText).toBe('10');

            clearDisplay();
            appendNumber('6');
            setOperator('*');
            appendNumber('3');
            calculate();
            expect(document.getElementById('display').innerText).toBe('18');
        });

        test('TC-V3-02: 正常的減法與除法運算測試', () => {
            appendNumber('9');
            setOperator('-');
            appendNumber('4');
            calculate();
            expect(document.getElementById('display').innerText).toBe('5');

            clearDisplay();
            appendNumber('8');
            setOperator('/');
            appendNumber('2');
            calculate();
            expect(document.getElementById('display').innerText).toBe('4');
        });

        test('TC-V3-03: Clear (C) 按鍵重置功能應回歸預設值 0', () => {
            appendNumber('9');
            setOperator('+');
            appendNumber('5');
            clearDisplay();
            // V3 功能需求：沒有值時顯示 '0'
            expect(document.getElementById('display').innerText).toBe('0');
        });
    });

    // ==========================================
    // 2. V3 新增功能：小數點與連續運算測試 (New Features)
    // ==========================================
    describe('【小數點與自動連續運算測試】', () => {

        test('TC-V3-04: 正常小數點輸入與運算 (1.5 + 2.5 = 4)', () => {
            appendNumber('1');
            appendNumber('.');
            appendNumber('5');
            setOperator('+');
            appendNumber('2');
            appendNumber('.');
            appendNumber('5');
            calculate();
            expect(document.getElementById('display').innerText).toBe('4');
        });

        test('TC-V3-05: 異常小數點輸入限制（同一組數字不允許重複輸入小數點）', () => {
            appendNumber('1');
            appendNumber('.');
            appendNumber('.'); // 重複輸入應被忽略
            appendNumber('5');
            expect(document.getElementById('display').innerText).toBe('1.5');
        });

        test('TC-V3-06: 連續運算功能測試 (1 + 2 + 3 = 6，不按等號直接按運算子)', () => {
            appendNumber('1');
            setOperator('+');
            appendNumber('2');
            setOperator('+'); // 此時應自動觸發前面的計算並更新，將 3 作為下一步
            appendNumber('3');
            calculate();
            expect(document.getElementById('display').innerText).toBe('6');
        });
    });

    // ==========================================
    // 3. V3 新增功能：進階科學運算測試 (Advanced Operations)
    // ==========================================
    describe('【進階功能（平方、平方根、對數）測試】', () => {

        test('TC-V3-07: 平方運算測試 (5 x² = 25)', () => {
            appendNumber('5');
            applyAdvanced('square');
            expect(document.getElementById('display').innerText).toBe('25');
        });

        test('TC-V3-08: 平方根運算測試 (9 √ = 3)', () => {
            appendNumber('9');
            applyAdvanced('sqrt');
            expect(document.getElementById('display').innerText).toBe('3');
        });

        test('TC-V3-09: 常用對數運算測試 (100 log = 2)', () => {
            appendNumber('100');
            applyAdvanced('log');
            expect(document.getElementById('display').innerText).toBe('2');
        });

        test('TC-V3-10: 針對上一筆計算結果直接進行進階運算 (5 + 4 = 9 -> √ = 3)', () => {
            appendNumber('5');
            setOperator('+');
            appendNumber('4');
            calculate(); // 畫面上是 '9'
            applyAdvanced('sqrt'); // 應對前一次的結果 '9' 開根號
            expect(document.getElementById('display').innerText).toBe('3');
        });
    });

    // ==========================================
    // 4. V3 嚴格錯誤處理與邊界條件測試 (Error Handling)
    // ==========================================
    describe('【異常與數學邊界錯誤處理測試】', () => {

        test('TC-V3-11: 數學錯誤：除以零 (8 ÷ 0 = 錯誤)', () => {
            appendNumber('8');
            setOperator('/');
            appendNumber('0');
            calculate();
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V3-12: 數學錯誤：對負數開平方根 (√ -9 = 錯誤)', () => {
            appendNumber('9');
            setOperator('-'); // 先做成負數（或是輸入負值邏輯）
            // 這裡模擬使用者產生負數後點選根號
            // 因專案未實作單純正負號切換，先以減法計算製造負數結果
            appendNumber('1');
            setOperator('-');
            appendNumber('10');
            calculate(); // 得到 -9
            applyAdvanced('sqrt');
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V3-13: 數學錯誤：對小於等於 0 的數取對數 (log 0 = 錯誤)', () => {
            appendNumber('0');
            applyAdvanced('log');
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V3-14: 流程錯誤：算式未完成直接按等號應顯示錯誤', () => {
            appendNumber('7');
            setOperator('+');
            calculate();
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V3-15: 錯誤狀態回復：當顯示「錯誤」時，重新輸入數字應自動清除錯誤狀態並顯示新數字', () => {
            // 製造一個錯誤
            calculate();
            expect(document.getElementById('display').innerText).toBe('錯誤');

            // 重新輸入數字
            appendNumber('9');
            expect(document.getElementById('display').innerText).toBe('9');
        });
    });
});