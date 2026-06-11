/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('script(5).js Calculator 單元測試與整合測試', () => {
    let Calculator;
    let calculator;
    let registeredDocumentListeners;
    let originalAddEventListener;
    let originalRemoveEventListener;

    const createCalculatorDOM = () => {
        document.body.innerHTML = `
            <main>
                <section class="calculator-shell">
                    <section class="screen">
                        <button type="button" data-action="clearHistory">清除歷史</button>
                        <div id="expression"></div>
                        <output id="display">0</output>
                    </section>

                    <section class="function-pad">
                        <button type="button" data-function="square">x²</button>
                        <button type="button" data-function="sqrt">√x</button>
                        <button type="button" data-function="log">log</button>
                        <button type="button" data-function="ln">ln</button>
                        <button type="button" data-operator="^">xʸ</button>
                        <button type="button" data-function="inverse">1/x</button>
                        <button type="button" data-symbol="pi">π</button>
                        <button type="button" data-action="backspace">⌫</button>
                    </section>

                    <section class="keypad">
                        <button type="button" id="clearButton" data-action="clear">AC</button>
                        <button type="button" data-action="sign">±</button>
                        <button type="button" data-action="percent">%</button>
                        <button type="button" data-operator="/">÷</button>

                        <button type="button" data-digit="7">7</button>
                        <button type="button" data-digit="8">8</button>
                        <button type="button" data-digit="9">9</button>
                        <button type="button" data-operator="*">×</button>

                        <button type="button" data-digit="4">4</button>
                        <button type="button" data-digit="5">5</button>
                        <button type="button" data-digit="6">6</button>
                        <button type="button" data-operator="-">−</button>

                        <button type="button" data-digit="1">1</button>
                        <button type="button" data-digit="2">2</button>
                        <button type="button" data-digit="3">3</button>
                        <button type="button" data-operator="+">+</button>

                        <button type="button" data-digit="0">0</button>
                        <button type="button" data-action="decimal">.</button>
                        <button type="button" data-action="equals">=</button>
                    </section>
                </section>

                <aside>
                    <ol id="historyList"></ol>
                </aside>
            </main>
        `;
    };

    const loadCalculatorClass = () => {
        const scriptPath = path.join(__dirname, 'script(5).js');
        const scriptCode = fs.readFileSync(scriptPath, 'utf8');

        // 延續 test(1).js 的測試寫法：讀取原始 script，透過 Function 注入測試環境。
        // script(5).js 使用 class Calculator，因此這裡改為把 Calculator 類別掛到 global。
        const runInGlobal = new Function(`
            with (global) {
                ${scriptCode}
                global.Calculator = Calculator;
            }
        `);

        runInGlobal();
        return global.Calculator;
    };

    const displayText = () => document.querySelector('#display').textContent;
    const expressionText = () => document.querySelector('#expression').textContent;
    const clearButtonText = () => document.querySelector('#clearButton').textContent;
    const historyItems = () => Array.from(document.querySelectorAll('#historyList li')).map((li) => li.textContent);

    const click = (selector) => {
        const element = document.querySelector(selector);
        expect(element).not.toBeNull();
        element.click();
    };

    const pressKey = (key) => {
        const event = new KeyboardEvent('keydown', {
            key,
            bubbles: true,
            cancelable: true
        });

        document.dispatchEvent(event);
    };

    beforeEach(() => {
        createCalculatorDOM();

        registeredDocumentListeners = [];
        originalAddEventListener = document.addEventListener.bind(document);
        originalRemoveEventListener = document.removeEventListener.bind(document);

        jest.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
            registeredDocumentListeners.push({ type, listener, options });
            return originalAddEventListener(type, listener, options);
        });

        jest.spyOn(window, 'setTimeout').mockImplementation((callback) => {
            callback();
            return 0;
        });

        Calculator = loadCalculatorClass();
        calculator = new Calculator();

        // 還原 spy，後續測試事件仍然會走瀏覽器原本的事件系統。
        document.addEventListener.mockRestore();
    });

    afterEach(() => {
        registeredDocumentListeners.forEach(({ type, listener, options }) => {
            originalRemoveEventListener(type, listener, options);
        });

        jest.restoreAllMocks();
        delete global.Calculator;
    });

    // ==========================================
    // 1. 單元測試：狀態初始化與輸入控制
    // ==========================================
    describe('【單元測試：初始化、輸入與畫面渲染】', () => {
        test('TC-S5-U01: Calculator 初始化後應顯示 0、AC，且歷史紀錄為空狀態', () => {
            expect(displayText()).toBe('0');
            expect(expressionText()).toBe('');
            expect(clearButtonText()).toBe('AC');
            expect(historyItems()).toEqual(['尚無紀錄']);

            expect(calculator.displayValue).toBe('0');
            expect(calculator.firstOperand).toBeNull();
            expect(calculator.operator).toBeNull();
            expect(calculator.waitingForSecondOperand).toBe(false);
        });

        test('TC-S5-U02: inputDigit 應正確輸入數字，且不會保留開頭的 0', () => {
            calculator.inputDigit('0');
            calculator.inputDigit('8');

            expect(displayText()).toBe('8');
            expect(clearButtonText()).toBe('C');
        });

        test('TC-S5-U03: inputDecimal 應允許一個小數點，並阻擋同一數值重複輸入小數點', () => {
            calculator.inputDigit('1');
            calculator.inputDecimal();
            calculator.inputDecimal();
            calculator.inputDigit('5');

            expect(displayText()).toBe('1.5');
        });

        test('TC-S5-U04: inputDigit 應限制最多 16 位有效數字', () => {
            '12345678901234567890'.split('').forEach((digit) => calculator.inputDigit(digit));

            expect(displayText()).toBe('1234567890123456');
        });
    });

    // ==========================================
    // 2. 單元測試：核心運算邏輯
    // ==========================================
    describe('【單元測試：核心四則與次方運算】', () => {
        test('TC-S5-U05: compute 應支援加、減、乘、除、次方', () => {
            expect(calculator.compute(8, 2, '+')).toBe(10);
            expect(calculator.compute(8, 2, '-')).toBe(6);
            expect(calculator.compute(8, 2, '*')).toBe(16);
            expect(calculator.compute(8, 2, '/')).toBe(4);
            expect(calculator.compute(2, 3, '^')).toBe(8);
        });

        test('TC-S5-U06: chooseOperator 與 calculate 應完成一般四則運算', () => {
            calculator.inputDigit('8');
            calculator.chooseOperator('+');
            calculator.inputDigit('2');
            calculator.calculate();

            expect(displayText()).toBe('10');
            expect(expressionText()).toBe('8 + 2 =');
            expect(historyItems()[0]).toBe('8 + 2 = 10');
        });

        test('TC-S5-U07: 連續按運算子時，應先計算前一段結果再等待下一個運算元', () => {
            calculator.inputDigit('1');
            calculator.chooseOperator('+');
            calculator.inputDigit('2');
            calculator.chooseOperator('+');
            calculator.inputDigit('3');
            calculator.calculate();

            expect(displayText()).toBe('6');
            expect(expressionText()).toBe('3 + 3 =');
        });

        test('TC-S5-U08: 重複按等號時，應重複套用上一個運算', () => {
            calculator.inputDigit('5');
            calculator.chooseOperator('+');
            calculator.inputDigit('2');
            calculator.calculate();
            calculator.calculate();
            calculator.calculate();

            expect(displayText()).toBe('11');
            expect(historyItems()[0]).toBe('9 + 2 = 11');
        });

        test('TC-S5-U09: 未輸入第二運算元就按等號時，應使用第一運算元完成計算', () => {
            calculator.inputDigit('7');
            calculator.chooseOperator('+');
            calculator.calculate();

            expect(displayText()).toBe('14');
            expect(expressionText()).toBe('7 + 7 =');
        });
    });

    // ==========================================
    // 3. 單元測試：進階運算與符號功能
    // ==========================================
    describe('【單元測試：進階功能、符號與工具鍵】', () => {
        test('TC-S5-U10: applyFunction 應支援平方、平方根、log、ln、倒數', () => {
            calculator.inputDigit('5');
            calculator.applyFunction('square');
            expect(displayText()).toBe('25');

            calculator.clear();
            calculator.inputDigit('9');
            calculator.applyFunction('sqrt');
            expect(displayText()).toBe('3');

            calculator.clear();
            calculator.inputDigit('1');
            calculator.inputDigit('0');
            calculator.inputDigit('0');
            calculator.applyFunction('log');
            expect(displayText()).toBe('2');

            calculator.clear();
            calculator.inputDigit('1');
            calculator.applyFunction('ln');
            expect(displayText()).toBe('0');

            calculator.clear();
            calculator.inputDigit('4');
            calculator.applyFunction('inverse');
            expect(displayText()).toBe('0.25');
        });

        test('TC-S5-U11: inputSymbol 應支援 π，並可接續進行運算', () => {
            calculator.inputSymbol('pi');

            expect(displayText()).toBe('3.1415926535898');

            calculator.chooseOperator('*');
            calculator.inputDigit('2');
            calculator.calculate();

            expect(Number(displayText())).toBeCloseTo(6.2831853071796, 10);
        });

        test('TC-S5-U12: toggleSign 應切換正負號，applyPercent 應轉換為百分比數值', () => {
            calculator.inputDigit('5');
            calculator.toggleSign();
            expect(displayText()).toBe('-5');

            calculator.toggleSign();
            expect(displayText()).toBe('5');

            calculator.inputDigit('0');
            calculator.applyPercent();
            expect(displayText()).toBe('0.5');
        });

        test('TC-S5-U13: backspace 應刪除最後一位，刪到空值時回到 0', () => {
            calculator.inputDigit('1');
            calculator.inputDigit('2');
            calculator.inputDigit('3');
            calculator.backspace();
            expect(displayText()).toBe('12');

            calculator.backspace();
            calculator.backspace();
            expect(displayText()).toBe('0');
        });

        test('TC-S5-U14: clear 應先清除目前輸入，再於第二次恢復完整預設狀態', () => {
            calculator.inputDigit('9');
            calculator.chooseOperator('+');
            calculator.inputDigit('5');

            calculator.clear();
            expect(displayText()).toBe('0');
            expect(calculator.operator).toBe('+');

            calculator.clear();
            expect(displayText()).toBe('0');
            expect(calculator.operator).toBeNull();
            expect(calculator.firstOperand).toBeNull();
        });
    });

    // ==========================================
    // 4. 單元測試：錯誤處理與歷史紀錄
    // ==========================================
    describe('【單元測試：錯誤處理與歷史紀錄】', () => {
        test('TC-S5-U15: 除以 0 時應顯示錯誤訊息並進入錯誤狀態', () => {
            const result = calculator.compute(8, 0, '/');

            expect(result).toBeNull();
            expect(displayText()).toBe('無法除以 0');
            expect(expressionText()).toBe('錯誤');
            expect(calculator.hasError).toBe(true);
        });

        test('TC-S5-U16: 負數開平方根、log 0、ln 0、0 的倒數皆應顯示對應錯誤', () => {
            calculator.inputDigit('9');
            calculator.toggleSign();
            calculator.applyFunction('sqrt');
            expect(displayText()).toBe('負數不能開平方根');

            calculator.inputDigit('0');
            calculator.applyFunction('log');
            expect(displayText()).toBe('log 僅接受正數');

            calculator.inputDigit('0');
            calculator.applyFunction('ln');
            expect(displayText()).toBe('ln 僅接受正數');

            calculator.inputDigit('0');
            calculator.applyFunction('inverse');
            expect(displayText()).toBe('0 沒有倒數');
        });

        test('TC-S5-U17: 錯誤狀態下重新輸入數字，應自動重置錯誤並顯示新數字', () => {
            calculator.compute(8, 0, '/');
            expect(calculator.hasError).toBe(true);

            calculator.inputDigit('9');

            expect(displayText()).toBe('9');
            expect(calculator.hasError).toBe(false);
        });

        test('TC-S5-U18: 歷史紀錄最多應保留 8 筆，且新紀錄應排在最上方', () => {
            for (let i = 1; i <= 9; i += 1) {
                calculator.clear();
                calculator.inputDigit(String(i));
                calculator.chooseOperator('+');
                calculator.inputDigit('1');
                calculator.calculate();
            }

            const items = historyItems();

            expect(items).toHaveLength(8);
            expect(items[0]).toBe('9 + 1 = 10');
            expect(items[7]).toBe('2 + 1 = 3');
            expect(items).not.toContain('1 + 1 = 2');
        });

        test('TC-S5-U19: clearHistory 應清空所有歷史紀錄並回到空狀態提示', () => {
            calculator.inputDigit('8');
            calculator.chooseOperator('+');
            calculator.inputDigit('2');
            calculator.calculate();

            expect(historyItems()[0]).toBe('8 + 2 = 10');

            calculator.clearHistory();

            expect(historyItems()).toEqual(['尚無紀錄']);
        });
    });

    // ==========================================
    // 5. 整合測試：滑鼠點擊按鈕流程
    // ==========================================
    describe('【整合測試：按鈕點擊操作流程】', () => {
        test('TC-S5-I01: 使用畫面按鈕完成 8 + 2 = 10', () => {
            click('[data-digit="8"]');
            click('[data-operator="+"]');
            click('[data-digit="2"]');
            click('[data-action="equals"]');

            expect(displayText()).toBe('10');
            expect(expressionText()).toBe('8 + 2 =');
            expect(historyItems()[0]).toBe('8 + 2 = 10');
        });

        test('TC-S5-I02: 使用畫面按鈕完成小數運算 1.5 + 2.5 = 4', () => {
            click('[data-digit="1"]');
            click('[data-action="decimal"]');
            click('[data-digit="5"]');
            click('[data-operator="+"]');
            click('[data-digit="2"]');
            click('[data-action="decimal"]');
            click('[data-digit="5"]');
            click('[data-action="equals"]');

            expect(displayText()).toBe('4');
            expect(historyItems()[0]).toBe('1.5 + 2.5 = 4');
        });

        test('TC-S5-I03: 使用畫面按鈕完成平方根、倒退刪除與清除', () => {
            click('[data-digit="1"]');
            click('[data-digit="2"]');
            click('[data-action="backspace"]');

            expect(displayText()).toBe('1');

            click('[data-action="clear"]');
            click('[data-digit="9"]');
            click('[data-function="sqrt"]');

            expect(displayText()).toBe('3');
            expect(historyItems()[0]).toBe('√(9) = 3');
        });

        test('TC-S5-I04: 點擊運算子後再點另一個運算子，應更新目前運算子與顯示算式', () => {
            click('[data-digit="8"]');
            click('[data-operator="+"]');
            click('[data-operator="*"]');

            expect(expressionText()).toBe('8 ×');
            expect(document.querySelector('[data-operator="*"]').classList.contains('is-active')).toBe(true);
            expect(document.querySelector('[data-operator="+"]').classList.contains('is-active')).toBe(false);
        });

        test('TC-S5-I05: 點擊清除歷史按鈕應清空歷史列表', () => {
            click('[data-digit="8"]');
            click('[data-operator="+"]');
            click('[data-digit="2"]');
            click('[data-action="equals"]');

            expect(historyItems()[0]).toBe('8 + 2 = 10');

            click('[data-action="clearHistory"]');

            expect(historyItems()).toEqual(['尚無紀錄']);
        });
    });

    // ==========================================
    // 6. 整合測試：鍵盤快捷鍵流程
    // ==========================================
    describe('【整合測試：鍵盤快捷鍵操作流程】', () => {
        test('TC-S5-I06: 使用鍵盤完成 9 / 3 Enter = 3', () => {
            pressKey('9');
            pressKey('/');
            pressKey('3');
            pressKey('Enter');

            expect(displayText()).toBe('3');
            expect(expressionText()).toBe('9 ÷ 3 =');
        });

        test('TC-S5-I07: 使用鍵盤 Backspace 應刪除最後一位', () => {
            pressKey('1');
            pressKey('2');
            pressKey('3');
            pressKey('Backspace');

            expect(displayText()).toBe('12');
        });

        test('TC-S5-I08: 使用鍵盤 Escape 應執行清除功能', () => {
            pressKey('7');
            pressKey('+');
            pressKey('3');
            pressKey('Escape');

            expect(displayText()).toBe('0');

            pressKey('Escape');

            expect(calculator.operator).toBeNull();
            expect(calculator.firstOperand).toBeNull();
        });

        test('TC-S5-I09: 使用鍵盤 ^ 應完成次方運算', () => {
            pressKey('2');
            pressKey('^');
            pressKey('3');
            pressKey('=');

            expect(displayText()).toBe('8');
            expect(expressionText()).toBe('2 ^ 3 =');
        });

        test('TC-S5-I10: 使用鍵盤 % 應轉換為百分比數值', () => {
            pressKey('5');
            pressKey('0');
            pressKey('%');

            expect(displayText()).toBe('0.5');
        });
    });
});
