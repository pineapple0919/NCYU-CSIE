class Calculator {
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

    bindEvents() {
        document.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            this.handleButton(button);
            this.flashButton(button);
        });

        document.addEventListener('keydown', (event) => this.handleKeyboard(event));
    }

    reset() {
        this.displayValue = '0';
        this.firstOperand = null;
        this.operator = null;
        this.waitingForSecondOperand = false;
        this.lastOperation = null;
        this.hasError = false;
        this.currentExpression = '';
    }

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

    clear() {
        if (this.displayValue !== '0' && !this.hasError) {
            this.displayValue = '0';
            this.waitingForSecondOperand = false;
        } else {
            this.reset();
        }

        this.render();
    }

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

    toggleSign() {
        if (this.hasError) this.reset();
        if (this.displayValue === '0') return;

        this.displayValue = this.displayValue.startsWith('-')
            ? this.displayValue.slice(1)
            : `-${this.displayValue}`;

        this.render();
    }

    applyPercent() {
        if (this.hasError) this.reset();

        const value = Number(this.displayValue) / 100;
        this.displayValue = this.formatResult(value);
        this.waitingForSecondOperand = true;
        this.currentExpression = `${this.formatDisplay(Number(this.displayValue))}`;
        this.render();
    }

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

    addHistory(record) {
        this.history.unshift(record);
        this.history = this.history.slice(0, this.historyLimit);
    }

    clearHistory() {
        this.history = [];
        this.render();
    }

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

    renderHistory() {
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<li class="empty-history">尚無紀錄</li>';
            return;
        }

        this.historyList.innerHTML = this.history
            .map((item) => `<li>${this.escapeHtml(item)}</li>`)
            .join('');
    }

    formatResult(number) {
        if (Math.abs(number) > 999999999999999 || (Math.abs(number) < 0.0000001 && number !== 0)) {
            return Number(number.toPrecision(10)).toString();
        }

        const rounded = Number(Number(number).toPrecision(14));
        return rounded.toString();
    }

    formatDisplay(number) {
        if (Number.isNaN(Number(number))) return String(number);
        return this.formatResult(Number(number));
    }

    operatorSymbol(operator) {
        return {
            '+': '+',
            '-': '−',
            '*': '×',
            '/': '÷',
            '^': '^'
        }[operator] || operator;
    }

    rawLength(value) {
        return value.replace('-', '').replace('.', '').length;
    }

    flashButton(button) {
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 110);
    }

    escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
