const inputPurchase = document.getElementById('purchase-value');
const btnCalculate = document.getElementById('btn-calculate');
const btnClear = document.getElementById('btn-clear');
const errorMessage = document.getElementById('error-message');
const resultsContainer = document.getElementById('results-container');
const btnCopy = document.getElementById('btn-copy');

const interestSelect = document.getElementById('interest-select');
const customInterestWrapper = document.getElementById('custom-interest-wrapper');
const customInterestInput = document.getElementById('custom-interest-input');

// Dom Elements for Summary
const sumOriginal = document.getElementById('sum-original');
const sum3xNoInterest = document.getElementById('sum-3x-no-interest');
const sum6xNoInterest = document.getElementById('sum-6x-no-interest');
const sum3xMax = document.getElementById('sum-3x-max');
const sum6xMax = document.getElementById('sum-6x-max');

// Format helpers
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

// Input mask and validation
inputPurchase.addEventListener('input', (e) => {
    errorMessage.textContent = '';
    let value = e.target.value;
    
    // Remove tudo que não for dígito
    value = value.replace(/\D/g, "");
    
    if (value === "") {
        e.target.value = "";
        return;
    }
    
    // Converte para centavos
    let numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) {
        e.target.value = "";
        return;
    }

    // Formata o valor na tela
    let formatted = (numericValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    e.target.value = "R$ " + formatted;
});

const getNumericValue = () => {
    let value = inputPurchase.value.replace(/\D/g, "");
    if (!value) return 0;
    return parseInt(value, 10) / 100;
};

// Calculation Logic
const getInterestRate = () => {
    if (interestSelect.value === 'custom') {
        let val = parseFloat(customInterestInput.value.replace(',','.'));
        if (isNaN(val) || val < 0) return 0;
        return val / 100;
    }
    return parseFloat(interestSelect.value);
};

const calculatePlan = (baseValue, limitNoInterest, rate) => {
    let planResults = [];
    for (let currentMonth = 1; currentMonth <= 12; currentMonth++) {
        let monthsWithInterest = Math.max(0, currentMonth - limitNoInterest);
        let interestPercent = monthsWithInterest * rate;
        let totalInterest = baseValue * interestPercent;
        let finalValue = baseValue + totalInterest;
        let installmentValue = finalValue / currentMonth;

        planResults.push({
            installment: currentMonth,
            monthsWithInterest: monthsWithInterest,
            interestPercent: (interestPercent * 100).toFixed(1) + "%",
            baseValue: baseValue,
            interestValue: totalInterest,
            finalValue: finalValue,
            installmentValue: installmentValue,
            hasInterest: monthsWithInterest > 0
        });
    }
    return planResults;
};

const renderTable = (planResults, tableId) => {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = ''; // Limpar antes

    planResults.forEach(row => {
        const tr = document.createElement('tr');
        tr.className = row.hasInterest ? 'row-warning' : 'row-success';

        tr.innerHTML = `
            <td data-label="Parcela">${row.installment}x</td>
            <td data-label="Meses C/ Juros">${row.monthsWithInterest > 0 ? row.monthsWithInterest : '-'}</td>
            <td data-label="Juros (%)">${row.hasInterest ? row.interestPercent : '0%'}</td>
            <td data-label="Juros (R$)">
                <span class="copyable-value" data-value="${formatCurrency(row.interestValue)}" title="Clique para copiar">
                    ${formatCurrency(row.interestValue)}
                    <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                </span>
            </td>
            <td data-label="Total Sem Juros">${formatCurrency(row.baseValue)}</td>
            <td data-label="Total Com Juros">${formatCurrency(row.finalValue)}</td>
            <td data-label="Valor Parcela">${formatCurrency(row.installmentValue)}</td>
        `;
        tbody.appendChild(tr);
    });
};

const updateSummary = (baseValue, plan3x, plan6x) => {
    sumOriginal.textContent = formatCurrency(baseValue);
    
    // 3x e 6x no interest (installment value)
    sum3xNoInterest.textContent = formatCurrency(plan3x[2].installmentValue);
    sum6xNoInterest.textContent = formatCurrency(plan6x[5].installmentValue);
    
    // Max values (12x)
    sum3xMax.textContent = formatCurrency(plan3x[11].finalValue);
    sum6xMax.textContent = formatCurrency(plan6x[11].finalValue);
};

// Global reference for copying
let currentResumo = "";

const generateResumoText = (baseValue, plan3x, plan6x) => {
    let text = `Compra: ${formatCurrency(baseValue)}\n`;
    text += `Plano 3x sem juros: 3x de ${formatCurrency(plan3x[2].installmentValue)}\n`;
    text += `Plano 6x sem juros: 6x de ${formatCurrency(plan6x[5].installmentValue)}\n`;
    text += `Plano 3x em 12x: 12x de ${formatCurrency(plan3x[11].installmentValue)} | Total: ${formatCurrency(plan3x[11].finalValue)}\n`;
    text += `Plano 6x em 12x: 12x de ${formatCurrency(plan6x[11].installmentValue)} | Total: ${formatCurrency(plan6x[11].finalValue)}`;
    return text;
};

// Handlers
btnCalculate.addEventListener('click', () => {
    const value = getNumericValue();
    
    if (value <= 0) {
        errorMessage.textContent = "Por favor, defina um valor de compra válido.";
        resultsContainer.classList.add('hidden');
        return;
    }

    const rate = getInterestRate();
    if (interestSelect.value === 'custom' && (isNaN(parseFloat(customInterestInput.value.replace(',','.'))) || parseFloat(customInterestInput.value.replace(',','.')) <= 0)) {
         errorMessage.textContent = "Por favor, digite uma taxa de juros personalizada válida.";
         resultsContainer.classList.add('hidden');
         return;
    }

    errorMessage.textContent = "";

    const plan3x = calculatePlan(value, 3, rate);
    const plan6x = calculatePlan(value, 6, rate);

    renderTable(plan3x, 'table-3x');
    renderTable(plan6x, 'table-6x');
    updateSummary(value, plan3x, plan6x);

    currentResumo = generateResumoText(value, plan3x, plan6x);

    // Save to LocalStorage
    localStorage.setItem('calcCardState', JSON.stringify({
        purchaseValue: inputPurchase.value,
        interestSelect: interestSelect.value,
        customInterest: customInterestInput.value
    }));

    // Show Results
    resultsContainer.classList.remove('hidden');
    // Scroll To Results optionally
    setTimeout(() => {
        if (!window.isRestoringState) {
            resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
});

btnClear.addEventListener('click', () => {
    inputPurchase.value = '';
    interestSelect.value = '0.025';
    customInterestWrapper.classList.add('hidden');
    customInterestInput.value = '';
    errorMessage.textContent = '';
    resultsContainer.classList.add('hidden');
    currentResumo = '';
    localStorage.removeItem('calcCardState');
});

btnCopy.addEventListener('click', () => {
    if (!currentResumo) return;
    navigator.clipboard.writeText(currentResumo).then(() => {
        const originalText = btnCopy.querySelector('span').textContent;
        btnCopy.querySelector('span').textContent = "Copiado com sucesso!";
        setTimeout(() => {
            btnCopy.querySelector('span').textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Falha ao copiar. Tente selecionar o texto manualmente.');
    });
});

// Setup on Enter
inputPurchase.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnCalculate.click();
    }
});

customInterestInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        btnCalculate.click();
    }
});

interestSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
        customInterestWrapper.classList.remove('hidden');
        customInterestInput.focus();
    } else {
        customInterestWrapper.classList.add('hidden');
        errorMessage.textContent = "";
    }
});

// Tabs Logic
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Add active class to corresponding pane
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// Copy interaction for table cells (Juros R$)
document.addEventListener('click', (e) => {
    const copyable = e.target.closest('.copyable-value');
    if (copyable) {
        let textToCopy = copyable.getAttribute('data-value');
        // Remove 'R$', espaços em branco e espaços do tipo nbs
        textToCopy = textToCopy.replace(/[R$\s\u00A0]/g, '').trim();

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = copyable.innerHTML;
            copyable.style.pointerEvents = 'none'; // Prevent double click
            copyable.innerHTML = `<span class="copied-feedback">Copiado!</span>`;
            setTimeout(() => {
                copyable.innerHTML = originalHTML;
                copyable.style.pointerEvents = 'auto'; // Re-enable click
            }, 1200);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
});

// Load state from LocalStorage on initialization
window.addEventListener('DOMContentLoaded', () => {
    const savedState = localStorage.getItem('calcCardState');
    if (savedState) {
        try {
            const state = JSON.parse(savedState);
            if (state.purchaseValue) {
                inputPurchase.value = state.purchaseValue;
                interestSelect.value = state.interestSelect || '0.025';
                if (state.interestSelect === 'custom') {
                    customInterestWrapper.classList.remove('hidden');
                    customInterestInput.value = state.customInterest || '';
                }
                window.isRestoringState = true;
                btnCalculate.click();
                setTimeout(() => { window.isRestoringState = false; }, 200);
            }
        } catch (e) {
            console.error('State parse error', e);
        }
    }
});

// PWA Service Worker Register
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registrado com sucesso:', registration.scope);
            })
            .catch(err => {
                console.error('Falha ao registrar ServiceWorker:', err);
            });
    });
}
