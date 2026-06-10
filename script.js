let currentInput = '';
let previousInput = '';
let currentOperator = null;

const displayElement = document.getElementById('display');

function updateDisplay(value) {
    displayElement.innerText = value || '0';
}

function appendNumber(number) {
    if (displayElement.innerText === '錯誤') clearDisplay();
    // 避免重複輸入小數點
    if (number === '.' && currentInput.includes('.')) return;
    
    currentInput += number;
    updateDisplay(currentInput);
}

function setOperator(operator) {
    if (currentInput === '' && previousInput === '') return;
    if (currentInput === '') {
        currentOperator = operator;
        return;
    }
    
    // 如果已經有上一筆運算，允許連續計算
    if (previousInput !== '') calculate();
    
    currentOperator = operator;
    previousInput = currentInput;
    currentInput = ''; 
    updateDisplay('');
}

// 【壞味道增加】新的進階功能，產生了重複的錯誤處理與另一組 if-else
function applyAdvanced(type) {
    if (currentInput === '' && previousInput === '') return;
    
    // 若當前沒有輸入，就針對前一次的結果進行進階運算
    let targetStr = currentInput !== '' ? currentInput : previousInput;
    let num = parseFloat(targetStr);
    let result = 0;

    if (type === 'square') {
        result = Math.pow(num, 2);
    } else if (type === 'sqrt') {
        if (num < 0) {
            showError();
            return;
        }
        result = Math.sqrt(num);
    } else if (type === 'log') {
        if (num <= 0) {
            showError();
            return;
        }
        result = Math.log10(num);
    }

    currentInput = result.toString();
    previousInput = '';
    currentOperator = null;
    updateDisplay(currentInput);
}

function calculate() {
    if (previousInput === '' || currentInput === '' || currentOperator === null) {
        showError();
        return;
    }

    let num1 = parseFloat(previousInput);
    let num2 = parseFloat(currentInput);
    let result = 0;

    if (currentOperator === '+') {
        result = num1 + num2;
    } else if (currentOperator === '-') {
        result = num1 - num2;
    } else if (currentOperator === '*') {
        result = num1 * num2;
    } else if (currentOperator === '/') {
        if (num2 === 0) {
            showError();
            return;
        }
        result = num1 / num2;
    }

    currentInput = result.toString();
    currentOperator = null;
    previousInput = '';
    updateDisplay(currentInput);
}

function clearDisplay() {
    currentInput = '';
    previousInput = '';
    currentOperator = null;
    updateDisplay('');
}

function showError() {
    updateDisplay('錯誤');
    currentInput = '';
    previousInput = '';
    currentOperator = null;
}