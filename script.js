let currentInput = '';
let previousInput = '';
let currentOperator = null;

const displayElement = document.getElementById('display');

function updateDisplay(value) {
    displayElement.innerText = value; 
}

function appendNumber(number) {
    if (displayElement.innerText === '錯誤') {
        clearDisplay();
    }
    
    currentInput += number;
    updateDisplay(currentInput);
}

function setOperator(operator) {
    if (currentInput === '') return; 
    
    currentOperator = operator;
    previousInput = currentInput;
    currentInput = ''; 
    updateDisplay('');
}

function calculate() {
    if (previousInput === '' || currentInput === '' || currentOperator === null) {
        updateDisplay('錯誤');
        resetState();
        return;
    }

    let num1 = parseFloat(previousInput);
    let num2 = parseFloat(currentInput);
    let result = 0;

    // 【壞味道：Long Method & Switch Statements】
    // 隨著功能增加，這裡的 if-else 越來越長了，後續非常適合拿來展示重構
    if (currentOperator === '+') {
        result = num1 + num2;
    } else if (currentOperator === '-') {
        result = num1 - num2;
    } else if (currentOperator === '*') {
        result = num1 * num2;
    } else if (currentOperator === '/') {
        // 【新增防呆】處理除以零的狀況
        if (num2 === 0) {
            updateDisplay('錯誤');
            resetState();
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
    resetState();
    updateDisplay('');
}

// 抽取出來的小工具函式
function resetState() {
    currentInput = '';
    previousInput = '';
    currentOperator = null;
}