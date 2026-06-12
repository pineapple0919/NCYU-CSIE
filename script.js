/**
 * Calculator
 *
 * 功能：
 * - 管理整個網頁計算機的狀態、事件綁定、畫面渲染與計算邏輯。
 * - 支援數字輸入、四則運算、次方、平方、平方根、log、ln、倒數、百分比、歷史紀錄等功能。
 *
 * 主要狀態：
 * - displayValue：目前顯示在畫面上的數值或錯誤訊息。
 * - firstOperand：第一個運算元。
 * - operator：目前選擇的運算子。
 * - waitingForSecondOperand：是否正在等待第二個運算元。
 * - lastOperation：最後一次運算，用於支援重複按等號。
 * - hasError：目前是否處於錯誤狀態。
 * - history：計算歷史紀錄。
 */
class Calculator {
    /**
     * constructor()
     *
     * 功能：
     * - 初始化 Calculator 實例。
     * - 取得畫面上需要操作的 DOM 元素。
     * - 設定最大輸入長度、歷史紀錄上限與初始歷史陣列。
     * - 呼叫 reset() 初始化計算狀態。
     * - 呼叫 bindEvents() 綁定滑鼠與鍵盤事件。
     * - 呼叫 render() 將初始狀態渲染到畫面。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會建立並初始化一個 Calculator 物件。
     */
    constructor() {
        this.display = document.querySelector('#display');
        this.expression = document.querySelector('#expression');
        this.clearButton = document.querySelector('#clearButton');
        this.historyList = document.querySelector('#historyList');
        this.buttons = Array.from(document.querySelectorAll('button'));

        this.maxInputLength = 16;
        this.historyLimit = 8;
        this.history = [];

        this.reset();
        this.bindEvents();
        this.render();
    }

    /**
     * bindEvents()
     *
     * 功能：
     * - 綁定整個文件的 click 事件，透過事件委派處理所有按鈕點擊。
     * - 綁定 keydown 事件，支援鍵盤快捷鍵操作。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會在 document 上註冊 click 與 keydown 事件監聽器。
     */
    bindEvents() {
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            this.handleButton(button);
            this.flashButton(button);
        });

        document.addEventListener('keydown', (event) => this.handleKeyboard(event));
    }

    /**
     * reset()
     *
     * 功能：
     * - 將計算機內部狀態重設為初始狀態。
     * - 不會清除 history 歷史紀錄。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會重設 displayValue、firstOperand、operator、waitingForSecondOperand、lastOperation、hasError、currentExpression。
     */
    reset() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.operator = null;
        this.waitingForSecondOperand = false;
        this.lastOperation = null;
        this.hasError = false;
        this.currentExpression = '';
    }

    /**
     * handleButton(button)
     *
     * 功能：
     * - 根據按鈕上的 data-* 屬性判斷使用者點擊的是哪一種按鍵。
     * - 將按鍵事件分派給對應的處理方法。
     *
     * Input：
     * - button {HTMLButtonElement}：使用者點擊的按鈕元素。
     *
     * Output：
     * - 無回傳值。
     * - 會依按鈕類型觸發數字輸入、運算子選擇、進階功能、符號輸入或其他操作。
     */
    handleButton(button) {
        if (button.dataset.digit !== undefined) {
            this.inputDigit(button.dataset.digit);
            return;
        }

        if (button.dataset.operator !== undefined) {
            this.chooseOperator(button.dataset.operator);
            return;
        }

        if (button.dataset.function !== undefined) {
            this.applyFunction(button.dataset.function);
            return;
        }

        if (button.dataset.symbol !== undefined) {
            this.inputSymbol(button.dataset.symbol);
            return;
        }

        const actionMap = {
            clear: () => this.clear(),
            decimal: () => this.inputDecimal(),
            sign: () => this.toggleSign(),
            percent: () => this.applyPercent(),
            equals: () => this.calculate(),
            backspace: () => this.backspace(),
            clearHistory: () => this.clearHistory()
        };

        actionMap[button.dataset.action]?.();
    }

    /**
     * handleKeyboard(event)
     *
     * 功能：
     * - 處理鍵盤快捷鍵操作。
     * - 支援數字、小數點、四則運算、次方、Enter / =、Escape、Backspace、百分比。
     *
     * Input：
     * - event {KeyboardEvent}：鍵盤按下事件。
     *
     * Output：
     * - 無回傳值。
     * - 若按鍵符合支援項目，會呼叫對應的計算機方法並阻止瀏覽器預設行為。
     */
    handleKeyboard(event) {
        const key = event.key;
        const operatorKeys = {
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '^': '^'
        };

        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            this.inputDigit(key);
        } else if (key === '.') {
            event.preventDefault();
            this.inputDecimal();
        } else if (operatorKeys[key]) {
            event.preventDefault();
            this.chooseOperator(operatorKeys[key]);
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            this.calculate();
        } else if (key === 'Escape') {
            event.preventDefault();
            this.clear();
        } else if (key === 'Backspace') {
            event.preventDefault();
            this.backspace();
        } else if (key === '%') {
            event.preventDefault();
            this.applyPercent();
        }
    }

    /**
     * inputDigit(digit)
     *
     * 功能：
     * - 處理數字輸入。
     * - 若目前為錯誤狀態，會先重設狀態。
     * - 若正在等待第二個運算元，會用新輸入取代目前顯示值。
     * - 避免一般數字前方保留不必要的 0。
     * - 限制有效數字長度不可超過 maxInputLength。
     *
     * Input：
     * - digit {string}：使用者輸入的數字字元，例如 '0' ~ '9'。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue 並重新渲染畫面。
     */
    inputDigit(digit) {
        if (this.hasError) this.reset();

        if (this.waitingForSecondOperand) {
            this.displayValue = digit;
            this.waitingForSecondOperand = false;
        } else if (this.displayValue === '0') {
            this.displayValue = digit;
        } else if (this.displayValue === '-0') {
            this.displayValue = `-${digit}`;
        } else if (this.rawLength(this.displayValue) < this.maxInputLength) {
            this.displayValue += digit;
        }

        this.render();
    }

    /**
     * inputDecimal()
     *
     * 功能：
     * - 處理小數點輸入。
     * - 若正在等待第二個運算元，會從 '0.' 開始輸入。
     * - 同一個數值中只允許出現一個小數點。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue 並重新渲染畫面。
     */
    inputDecimal() {
        if (this.hasError) this.reset();

        if (this.waitingForSecondOperand) {
            this.displayValue = '0.';
            this.waitingForSecondOperand = false;
        } else if (!this.displayValue.includes('.')) {
            this.displayValue += '.';
        }

        this.render();
    }

    /**
     * inputSymbol(symbolName)
     *
     * 功能：
     * - 處理常數符號輸入。
     * - 目前支援 pi，會將畫面值改為 Math.PI 的格式化結果。
     *
     * Input：
     * - symbolName {string}：符號名稱，目前支援 'pi'。
     *
     * Output：
     * - 無回傳值。
     * - 若 symbolName 存在，會更新 displayValue 並重新渲染畫面。
     * - 若 symbolName 不存在，直接結束不做任何變更。
     */
    inputSymbol(symbolName) {
        if (this.hasError) this.reset();

        const symbols = {
            pi: Math.PI
        };

        if (!(symbolName in symbols)) return;

        this.displayValue = this.formatResult(symbols[symbolName]);
        this.waitingForSecondOperand = false;
        this.render();
    }

    /**
     * chooseOperator(nextOperator)
     *
     * 功能：
     * - 處理運算子輸入。
     * - 若已經有第一運算元與目前運算子，會先完成前一段連續運算。
     * - 若使用者連續按運算子，會更新目前運算子。
     * - 設定等待第二個運算元的狀態。
     *
     * Input：
     * - nextOperator {string}：下一個運算子，例如 '+', '-', '*', '/', '^'。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 firstOperand、operator、waitingForSecondOperand、currentExpression 並重新渲染畫面。
     */
    chooseOperator(nextOperator) {
        if (this.hasError) this.reset();

        const inputValue = Number(this.displayValue);

        if (this.operator && this.waitingForSecondOperand) {
            this.operator = nextOperator;
            this.currentExpression = `${this.formatDisplay(this.firstOperand)} ${this.operatorSymbol(nextOperator)}`;
            this.render();
            return;
        }

        if (this.firstOperand === null) {
            this.firstOperand = inputValue;
        } else if (this.operator) {
            const result = this.compute(this.firstOperand, inputValue, this.operator);
            if (result === null) return;

            this.displayValue = this.formatResult(result);
            this.firstOperand = Number(this.displayValue);
        }

        this.operator = nextOperator;
        this.waitingForSecondOperand = true;
        this.lastOperation = null;
        this.currentExpression = `${this.formatDisplay(this.firstOperand)} ${this.operatorSymbol(nextOperator)}`;
        this.render();
    }

    /**
     * calculate()
     *
     * 功能：
     * - 執行等號計算。
     * - 若目前沒有運算子，但有 lastOperation，則支援重複按等號。
     * - 若已選擇運算子但未輸入第二運算元，會用第一運算元作為第二運算元。
     * - 計算成功後會更新畫面、算式文字與歷史紀錄。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue、currentExpression、history、lastOperation 等狀態並重新渲染畫面。
     */
    calculate() {
        if (this.hasError) return;

        const inputValue = Number(this.displayValue);

        if (!this.operator) {
            if (!this.lastOperation) return;

            const result = this.compute(inputValue, this.lastOperation.operand, this.lastOperation.operator);
            if (result === null) return;

            const expressionText = `${this.formatDisplay(inputValue)} ${this.operatorSymbol(this.lastOperation.operator)} ${this.formatDisplay(this.lastOperation.operand)} =`;
            this.displayValue = this.formatResult(result);
            this.currentExpression = expressionText;
            this.addHistory(`${expressionText} ${this.displayValue}`);
            this.waitingForSecondOperand = true;
            this.render();
            return;
        }

        const secondOperand = this.waitingForSecondOperand ? this.firstOperand : inputValue;
        const result = this.compute(this.firstOperand, secondOperand, this.operator);
        if (result === null) return;

        const expressionText = `${this.formatDisplay(this.firstOperand)} ${this.operatorSymbol(this.operator)} ${this.formatDisplay(secondOperand)} =`;
        this.displayValue = this.formatResult(result);
        this.currentExpression = expressionText;
        this.addHistory(`${expressionText} ${this.displayValue}`);
        this.lastOperation = {
            operator: this.operator,
            operand: secondOperand
        };
        this.firstOperand = null;
        this.operator = null;
        this.waitingForSecondOperand = true;
        this.render();
    }

    /**
     * compute(first, second, operator)
     *
     * 功能：
     * - 執行實際的數學運算。
     * - 支援加、減、乘、除、次方。
     * - 處理除以 0 與結果超出可表示範圍的錯誤。
     *
     * Input：
     * - first {number}：第一個運算元。
     * - second {number}：第二個運算元。
     * - operator {string}：運算子，例如 '+', '-', '*', '/', '^'。
     *
     * Output：
     * - {number|null}
     * - 成功時回傳計算結果。
     * - 發生錯誤時呼叫 showError() 顯示錯誤訊息，並回傳 null。
     */
    compute(first, second, operator) {
        const operations = {
            '+': () => first + second,
            '-': () => first - second,
            '*': () => first * second,
            '/': () => {
                if (second === 0) throw new Error('無法除以 0');
                return first / second;
            },
            '^': () => first ** second
        };

        try {
            const result = operations[operator]?.();
            if (!Number.isFinite(result)) {
                throw new Error('計算結果超出可表示範圍');
            }
            return result;
        } catch (error) {
            this.showError(error.message);
            return null;
        }
    }

    /**
     * applyFunction(type)
     *
     * 功能：
     * - 執行單一數值的進階計算功能。
     * - 支援 square、sqrt、log、ln、inverse。
     * - 會處理負數開平方根、非正數取對數、0 的倒數等錯誤。
     *
     * Input：
     * - type {string}：進階功能類型。
     *   - 'square'：平方。
     *   - 'sqrt'：平方根。
     *   - 'log'：常用對數。
     *   - 'ln'：自然對數。
     *   - 'inverse'：倒數。
     *
     * Output：
     * - 無回傳值。
     * - 成功時會更新 displayValue、currentExpression、history 並重新渲染畫面。
     * - 發生錯誤時會呼叫 showError()。
     */
    applyFunction(type) {
        if (this.hasError) this.reset();

        const value = Number(this.displayValue);
        const functions = {
            square: {
                label: (number) => `sqr(${this.formatDisplay(number)})`,
                calculate: (number) => number ** 2
            },
            sqrt: {
                label: (number) => `√(${this.formatDisplay(number)})`,
                calculate: (number) => {
                    if (number < 0) throw new Error('負數不能開平方根');
                    return Math.sqrt(number);
                }
            },
            log: {
                label: (number) => `log(${this.formatDisplay(number)})`,
                calculate: (number) => {
                    if (number <= 0) throw new Error('log 僅接受正數');
                    return Math.log10(number);
                }
            },
            ln: {
                label: (number) => `ln(${this.formatDisplay(number)})`,
                calculate: (number) => {
                    if (number <= 0) throw new Error('ln 僅接受正數');
                    return Math.log(number);
                }
            },
            inverse: {
                label: (number) => `1 / ${this.formatDisplay(number)}`,
                calculate: (number) => {
                    if (number === 0) throw new Error('0 沒有倒數');
                    return 1 / number;
                }
            }
        };

        try {
            const selectedFunction = functions[type];
            if (!selectedFunction) return;

            const result = selectedFunction.calculate(value);
            if (!Number.isFinite(result)) {
                throw new Error('計算結果超出可表示範圍');
            }

            const expressionText = `${selectedFunction.label(value)} =`;
            this.displayValue = this.formatResult(result);
            this.currentExpression = expressionText;
            this.addHistory(`${expressionText} ${this.displayValue}`);
            this.firstOperand = null;
            this.operator = null;
            this.waitingForSecondOperand = true;
            this.lastOperation = null;
            this.render();
        } catch (error) {
            this.showError(error.message);
        }
    }

    /**
     * clear()
     *
     * 功能：
     * - 處理 C / AC 清除按鈕。
     * - 若目前顯示值不是 0 且沒有錯誤，只清除目前輸入。
     * - 若目前顯示值已經是 0 或處於錯誤狀態，則完整重設計算狀態。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新狀態並重新渲染畫面。
     */
    clear() {
        if (this.displayValue !== '0' && !this.hasError) {
            this.displayValue = '0';
            this.waitingForSecondOperand = false;
        } else {
            this.reset();
        }

        this.render();
    }

    /**
     * backspace()
     *
     * 功能：
     * - 刪除目前顯示值的最後一個字元。
     * - 若刪到沒有有效數字，回到 0。
     * - 若正在等待第二運算元或處於錯誤狀態，會重設計算機。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue 並重新渲染畫面。
     */
    backspace() {
        if (this.hasError || this.waitingForSecondOperand) {
            this.reset();
            this.render();
            return;
        }

        if (this.displayValue.length <= 1 || (this.displayValue.length === 2 && this.displayValue.startsWith('-'))) {
            this.displayValue = '0';
        } else {
            this.displayValue = this.displayValue.slice(0, -1);
        }

        this.render();
    }

    /**
     * toggleSign()
     *
     * 功能：
     * - 切換目前顯示值的正負號。
     * - 0 不會切換成 -0。
     * - 若處於錯誤狀態，會先重設。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue 並重新渲染畫面。
     */
    toggleSign() {
        if (this.hasError) this.reset();
        if (this.displayValue === '0') return;

        this.displayValue = this.displayValue.startsWith('-')
            ? this.displayValue.slice(1)
            : `-${this.displayValue}`;

        this.render();
    }

    /**
     * applyPercent()
     *
     * 功能：
     * - 將目前顯示值轉換為百分比數值。
     * - 計算方式為目前數值除以 100。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue、waitingForSecondOperand、currentExpression 並重新渲染畫面。
     */
    applyPercent() {
        if (this.hasError) this.reset();

        const value = Number(this.displayValue) / 100;
        this.displayValue = this.formatResult(value);
        this.waitingForSecondOperand = true;
        this.currentExpression = `${this.formatDisplay(Number(this.displayValue))}`;
        this.render();
    }

    /**
     * showError(message = '錯誤')
     *
     * 功能：
     * - 顯示錯誤訊息並進入錯誤狀態。
     * - 清除目前運算中的運算元、運算子與最後一次運算。
     *
     * Input：
     * - message {string}：要顯示的錯誤訊息，預設為 '錯誤'。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 displayValue、currentExpression、hasError 等狀態並重新渲染畫面。
     */
    showError(message = '錯誤') {
        this.displayValue = message;
        this.currentExpression = '錯誤';
        this.hasError = true;
        this.firstOperand = null;
        this.operator = null;
        this.waitingForSecondOperand = false;
        this.lastOperation = null;
        this.render();
    }

    /**
     * addHistory(record)
     *
     * 功能：
     * - 新增一筆計算歷史紀錄。
     * - 新紀錄會放在最前面。
     * - 最多只保留 historyLimit 筆紀錄。
     *
     * Input：
     * - record {string}：要加入歷史紀錄的算式與結果文字。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 history 陣列。
     */
    addHistory(record) {
        this.history.unshift(record);
        this.history = this.history.slice(0, this.historyLimit);
    }

    /**
     * clearHistory()
     *
     * 功能：
     * - 清空所有計算歷史紀錄。
     * - 清空後重新渲染歷史紀錄區域。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會將 history 設為空陣列並重新渲染畫面。
     */
    clearHistory() {
        this.history = [];
        this.render();
    }

    /**
     * render()
     *
     * 功能：
     * - 將目前 Calculator 狀態同步到 DOM 畫面。
     * - 更新主顯示區、算式顯示區、C / AC 按鈕文字。
     * - 更新目前作用中的運算子樣式。
     * - 呼叫 renderHistory() 更新歷史紀錄。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會直接修改 DOM 顯示內容與 CSS class。
     */
    render() {
        this.display.textContent = this.displayValue || '0';
        this.expression.textContent = this.currentExpression || '';
        this.clearButton.textContent = this.displayValue !== '0' && !this.hasError ? 'C' : 'AC';

        this.buttons.forEach((button) => {
            button.classList.toggle(
                'is-active',
                button.dataset.operator === this.operator && this.waitingForSecondOperand
            );
        });

        this.renderHistory();
    }

    /**
     * renderHistory()
     *
     * 功能：
     * - 將 history 陣列渲染到歷史紀錄列表。
     * - 若沒有任何紀錄，顯示「尚無紀錄」。
     * - 會透過 escapeHtml() 避免歷史文字被當成 HTML 執行。
     *
     * Input：
     * - 無。
     *
     * Output：
     * - 無回傳值。
     * - 會更新 historyList.innerHTML。
     */
    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<li class="empty-history">尚無紀錄</li>';
            return;
        }

        this.historyList.innerHTML = this.history
            .map((item) => `<li>${this.escapeHtml(item)}</li>`)
            .join('');
    }

    /**
     * formatResult(number)
     *
     * 功能：
     * - 將計算結果格式化成適合顯示的字串。
     * - 對過大或過小的數字使用 toPrecision() 簡化顯示。
     * - 對一般數字進行精度整理，避免浮點數誤差顯示太長。
     *
     * Input：
     * - number {number}：需要格式化的數值。
     *
     * Output：
     * - {string}
     * - 回傳格式化後的數字字串。
     */
    formatResult(number) {
        if (Math.abs(number) > 999999999999999 || (Math.abs(number) < 0.0000001 && number !== 0)) {
            return Number(number.toPrecision(10)).toString();
        }

        const rounded = Number(Number(number).toPrecision(14));
        return rounded.toString();
    }

    /**
     * formatDisplay(number)
     *
     * 功能：
     * - 將數值轉成畫面可顯示格式。
     * - 若輸入無法轉為有效數字，直接回傳字串形式。
     * - 若是有效數字，交給 formatResult() 統一格式化。
     *
     * Input：
     * - number {number|string}：要顯示的數字或文字。
     *
     * Output：
     * - {string}
     * - 回傳適合顯示的文字。
     */
    formatDisplay(number) {
        if (Number.isNaN(Number(number))) return String(number);
        return this.formatResult(Number(number));
    }

    /**
     * operatorSymbol(operator)
     *
     * 功能：
     * - 將程式內部使用的運算子轉換為畫面顯示用符號。
     * - 例如 '*' 轉為 '×'，'/' 轉為 '÷'。
     *
     * Input：
     * - operator {string}：程式內部運算子，例如 '+', '-', '*', '/', '^'。
     *
     * Output：
     * - {string}
     * - 回傳畫面上要顯示的運算子符號。
     */
    operatorSymbol(operator) {
        return {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '^': '^'
        }[operator] || operator;
    }

    /**
     * rawLength(value)
     *
     * 功能：
     * - 計算輸入值中的有效數字長度。
     * - 會排除負號 '-' 與小數點 '.'。
     * - 用於限制最大輸入長度。
     *
     * Input：
     * - value {string}：目前顯示值。
     *
     * Output：
     * - {number}
     * - 回傳排除符號與小數點後的字元長度。
     */
    rawLength(value) {
        return value.replace('-', '').replace('.', '').length;
    }

    /**
     * flashButton(button)
     *
     * 功能：
     * - 在按鈕上加入短暫的 is-pressed class，產生按壓動畫效果。
     * - 110 毫秒後自動移除 is-pressed class。
     *
     * Input：
     * - button {HTMLButtonElement}：要套用按壓動畫的按鈕元素。
     *
     * Output：
     * - 無回傳值。
     * - 會修改 button 的 classList。
     */
    flashButton(button) {
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 110);
    }

    /**
     * escapeHtml(value)
     *
     * 功能：
     * - 將字串中的特殊 HTML 字元轉義。
     * - 避免歷史紀錄內容被瀏覽器當成 HTML 或 script 執行。
     *
     * Input：
     * - value {*}：要轉義的任意值，會先轉成字串。
     *
     * Output：
     * - {string}
     * - 回傳已轉義的安全字串。
     */
    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
}

/**
 * DOMContentLoaded event listener
 *
 * 功能：
 * - 等待 HTML DOM 載入完成後建立 Calculator 實例。
 * - 確保 querySelector 可以正確取得畫面元素。
 *
 * Input：
 * - 無。
 *
 * Output：
 * - 無回傳值。
 * - 會建立新的 Calculator 物件並啟動計算機功能。
 */
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
