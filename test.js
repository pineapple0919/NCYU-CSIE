/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('網頁計算機 V1 核心邏輯功能測試', () => {

    beforeEach(() => {
        // 1. 初始化模擬瀏覽器的 DOM 結構
        document.body.innerHTML = `<div id="display"></div>`;

        // 2. 讀取並動態載入 script.js 的內容
        const scriptPath = path.join(__dirname, 'script.js');
        const scriptCode = fs.readFileSync(scriptPath, 'utf8');
        
        // 3. 關鍵魔法：利用 Function 執行並將環境對象強行注入 global
        // 這能確保 let 變數和 function 能被測試案例直接讀取，且每次測試前都徹底重置
        const runInGlobal = new Function(`
            with (global) {
                ${scriptCode}
                // 將方法與變數顯示掛載到 global，讓測試案例直接叫得到
                global.appendNumber = appendNumber;
                global.setOperator = setOperator;
                global.calculate = calculate;
                global.clearDisplay = clearDisplay;
            }
        `);
        runInGlobal();

        // 4. 每題開始前，初始化清除狀態
        clearDisplay();
    });

    // ==========================================
    // 2. 基礎功能測試套件 (Basic Functionality)
    // ==========================================
    describe('【基礎功能測試】', () => {

        test('TC-V1-01: 正常的加法運算 (5 + 3 = 8)', () => {
            appendNumber('5');
            setOperator('+');
            appendNumber('3');
            calculate();

            expect(document.getElementById('display').innerText).toBe('8');
        });

        test('TC-V1-02: 正常的減法運算 (10 - 4 = 6)', () => {
            appendNumber('1');
            appendNumber('0');
            setOperator('-');
            appendNumber('4');
            calculate();

            expect(document.getElementById('display').innerText).toBe('6');
        });

        test('TC-V1-03: 多位數連續輸入測試 (1024)', () => {
            appendNumber('1');
            appendNumber('0');
            appendNumber('2');
            appendNumber('4');

            expect(document.getElementById('display').innerText).toBe('1024');
        });

        test('TC-V1-04: Clear (C) 按鍵重置功能', () => {
            appendNumber('9');
            setOperator('+');
            appendNumber('9');
            clearDisplay();

            expect(document.getElementById('display').innerText).toBe('');
        });
    });

    // ==========================================
    // 3. 異常與邊界條件測試套件 (Edge Cases & Error Handling)
    // ==========================================
    describe('【異常與邊界條件測試】', () => {

        test('TC-V1-05: 空畫面直接按等號應顯示錯誤', () => {
            calculate();
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V1-06: 不完整算式直接按等號（有數字、有符號、無第二數字）應顯示錯誤', () => {
            appendNumber('7');
            setOperator('+');
            calculate();

            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V1-07: 空畫面下直接點選運算符號不應有任何連帶反應', () => {
            setOperator('-'); 
            appendNumber('5');
            calculate(); 
            expect(document.getElementById('display').innerText).toBe('錯誤');
        });

        test('TC-V1-08: 畫面上顯示「錯誤」時，重新輸入數字應自動清除錯誤狀態並顯示新數字', () => {
            calculate(); 
            expect(document.getElementById('display').innerText).toBe('錯誤');

            appendNumber('9'); 

            expect(document.getElementById('display').innerText).toBe('9');
        });

        test('TC-V1-09: 數字 0 的邊界輸入處理', () => {
            appendNumber('0');
            appendNumber('0');
            appendNumber('0');

            expect(document.getElementById('display').innerText).toBe('000'); 
        });
    });

    // ==========================================
    // 4. 進階與邏輯重構準備測試套件 (Advanced Logical Tests)
    // ==========================================
    describe('【進階複合運算測試】', () => {

        test('TC-V1-10: 負數運算結果測試 (3 - 8 = -5)', () => {
            appendNumber('3');
            setOperator('-');
            appendNumber('8');
            calculate();

            expect(document.getElementById('display').innerText).toBe('-5');
        });

        test('TC-V1-11: 運算結果作為下一次運算的起點 (5 + 5 = 10, 10 - 3 = 7)', () => {
            appendNumber('5');
            setOperator('+');
            appendNumber('5');
            calculate(); 
            expect(document.getElementById('display').innerText).toBe('10');

            setOperator('-');
            appendNumber('3');
            calculate();

            expect(document.getElementById('display').innerText).toBe('7');
        });
    });
});