
const addMemberForm = document.getElementById("add-member-form");
const addExpenseForm = document.getElementById("add-expense-form");

const MEMBERS_LOCALSTORAGE_KEY = "members";
const EXPENSES_LOCALSTORAGE_KEY = "expenses";

const DEFAULT_MEMBERS = [
    { id: "m_1", name: "ram" },
    { id: "m_2", name: "shyam" },
    { id: "m_3", name: "sita" }
];

const DEFAULT_EXPENSES = [
    {
        id: "exp_1",
        title: "Groceries",
        amount: 600,
        payer: "ram",
        splitBetween: ["ram", "shyam", "sita"]
    },
    {
        id: "exp_2",
        title: "Dinner",
        amount: 360,
        payer: "shyam",
        splitBetween: ["ram", "shyam", "sita"]
    },
    {
        id: "exp_3",
        title: "Coffee & Snacks",
        amount: 90,
        payer: "shyam",
        splitBetween: ["ram", "shyam", "sita"]
    },
    {
        id: "exp_4",
        title: "Cab Fare",
        amount: 300,
        payer: "sita",
        splitBetween: ["ram", "shyam", "sita"]
    }
];

function getItems(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function setItems(key, item) {
    localStorage.setItem(key, JSON.stringify(item));
}

let members;
let expenses;

if (localStorage.getItem(MEMBERS_LOCALSTORAGE_KEY) === null) {
    members = DEFAULT_MEMBERS;
    setItems(MEMBERS_LOCALSTORAGE_KEY, members);
} else {
    members = getItems(MEMBERS_LOCALSTORAGE_KEY);
}

if (localStorage.getItem(EXPENSES_LOCALSTORAGE_KEY) === null) {
    expenses = DEFAULT_EXPENSES;
    setItems(EXPENSES_LOCALSTORAGE_KEY, expenses);
} else {
    expenses = getItems(EXPENSES_LOCALSTORAGE_KEY);
}

function generateId(prefix) {
    return prefix + "_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 7);
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function saveData() {
    setItems(MEMBERS_LOCALSTORAGE_KEY, members);
    setItems(EXPENSES_LOCALSTORAGE_KEY, expenses);
}

function formatAmount(amount) {
    return Number(amount).toFixed(2);
}

const MEMBER_COLORS = [
    "#2F6B4F",
    "#3D5A80",
    "#8C5E58",
    "#8B6F47",
    "#695D8B",
    "#477B83"
];

function getMemberColor(index) {
    return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function renderMembers() {
    const membersList = document.getElementById("members-list");
    const membersCount = document.getElementById("members-count");
    const membersEmpty = document.getElementById("members-empty");

    membersCount.textContent =
        `${members.length} ${members.length === 1 ? "member" : "members"}`;

    membersList.innerHTML = "";

    members.forEach((member, index) => {
        const li = document.createElement("li");

        li.className =
            "flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors gap-2";

        li.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium text-white shrink-0"
                    style="background-color: ${getMemberColor(index)}">
                    ${escapeHTML(member.name.charAt(0).toUpperCase())}
                </span>
                <span class="font-sans text-sm font-medium text-ledger-ink truncate">
                    ${escapeHTML(member.name)}
                </span>
            </div>
            <button type="button"
                class="remove-member-btn text-ledger-muted hover:text-ledger-rust p-2 rounded-sm transition-colors cursor-pointer shrink-0 ml-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                data-id="${escapeHTML(member.id)}"
                title="Remove ${escapeHTML(member.name)}"
                aria-label="Remove ${escapeHTML(member.name)}">
                <svg class="w-4 h-4 pointer-events-none" fill="none"
                    stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </button>
        `;

        membersList.appendChild(li);
    });

    membersEmpty.classList.toggle("hidden", members.length !== 0);

    updateMemberDropdown();
    updateSplitCheckboxes();
    updateExpenseFormState();
}

addMemberForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const input = document.getElementById("member-name-input");
    const errorMsg = document.getElementById("member-error-msg");

    const value = input.value.trim();

    errorMsg.classList.add("hidden");

    if (!value) return;

    const exists = members.some(
        member => member.name.toLowerCase() === value.toLowerCase()
    );

    if (exists) {
        errorMsg.textContent = "This member already exists.";
        errorMsg.classList.remove("hidden");
        return;
    }

    const newMember = {
        id: generateId("m"),
        name: value
    };

    members.push(newMember);

    saveData();
    renderMembers();

    input.value = "";
    input.focus();
});

document.getElementById("members-list").addEventListener("click", function (e) {
    const button = e.target.closest(".remove-member-btn");

    if (!button) return;

    const memberId = button.dataset.id;
    const member = members.find(m => m.id === memberId);

    if (!member) return;

    if (!confirm(`Are you sure you want to remove ${member.name}?`)) return;

    members = members.filter(m => m.id !== memberId);

    expenses = expenses.filter(expense => {
        expense.splitBetween = expense.splitBetween.filter(
            name => name !== member.name
        );

        if (expense.splitBetween.length === 0) return false;

        if (expense.payer === member.name) {
            expense.payer = members[0]?.name;
        }

        return true;
    });

    saveData();
    renderMembers();
    renderExpenses();
    renderBalances();
});

function updateMemberDropdown() {
    const payerSelect = document.getElementById("expense-payer-select");
    const previousValue = payerSelect.value;

    payerSelect.innerHTML = "";

    members.forEach(member => {
        const option = document.createElement("option");

        option.value = member.name;
        option.textContent = member.name;

        payerSelect.appendChild(option);
    });

    if (members.some(m => m.name === previousValue)) {
        payerSelect.value = previousValue;
    }
}

function updateSplitCheckboxes() {
    const container = document.getElementById("split-members-container");

    container.innerHTML = "";

    members.forEach(member => {
        const label = document.createElement("label");

        label.className =
            "flex items-center gap-2.5 text-xs font-sans text-ledger-ink cursor-pointer hover:bg-slate-100/60 px-2 py-2 rounded-sm select-none border border-transparent hover:border-ledger-border transition-colors min-h-[36px]";

        label.innerHTML = `
            <input type="checkbox"
                value="${escapeHTML(member.name)}"
                class="split-member-checkbox rounded-sm text-ledger-forest accent-[#2F6B4F] cursor-pointer w-4 h-4 shrink-0"
                checked>
            <span class="truncate break-all min-w-0">
                ${escapeHTML(member.name)}
            </span>
        `;

        container.appendChild(label);
    });

    updateSplitHint();
}

document.getElementById("split-select-all-btn").addEventListener("click", function () {
    document.querySelectorAll(".split-member-checkbox").forEach(checkbox => {
        checkbox.checked = true;
    });

    updateSplitHint();
});

document.getElementById("split-clear-all-btn").addEventListener("click", function () {
    document.querySelectorAll(".split-member-checkbox").forEach(checkbox => {
        checkbox.checked = false;
    });

    updateSplitHint();
});

document.getElementById("split-members-container").addEventListener("change", updateSplitHint);

function updateSplitHint() {
    const checkboxes = document.querySelectorAll(".split-member-checkbox:checked");
    const hint = document.getElementById("expense-validation-hint");

    hint.textContent =
        `Splitting between ${checkboxes.length} ${checkboxes.length === 1 ? "person" : "people"}`;
}

function updateExpenseFormState() {
    const warning = document.getElementById("expense-members-warning");
    const form = document.getElementById("add-expense-form");

    const disabled = members.length < 2;

    warning.classList.toggle("hidden", !disabled);
    form.classList.toggle("hidden", disabled);

    document.getElementById("add-expense-btn").disabled = disabled;
}

addExpenseForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const titleInput = document.getElementById("expense-title-input");
    const amountInput = document.getElementById("expense-amount-input");
    const payerSelect = document.getElementById("expense-payer-select");
    const hint = document.getElementById("expense-validation-hint");

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const payer = payerSelect.value;

    const splitBetween = Array.from(
        document.querySelectorAll(".split-member-checkbox:checked")
    ).map(checkbox => checkbox.value);

    if (!title) {
        hint.textContent = "Please enter expense title.";
        titleInput.focus();
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        hint.textContent = "Please enter a valid amount.";
        amountInput.focus();
        return;
    }

    if (!payer) {
        hint.textContent = "Please select who paid.";
        return;
    }

    if (splitBetween.length === 0) {
        hint.textContent = "Select at least one member.";
        return;
    }

    const newExpense = {
        id: generateId("exp"),
        title: title,
        amount: amount,
        payer: payer,
        splitBetween: splitBetween
    };

    expenses.push(newExpense);

    saveData();

    renderExpenses();
    renderBalances();

    addExpenseForm.reset();

    updateSplitCheckboxes();
    updateMemberDropdown();

    hint.textContent = `Splitting between ${members.length} people`;
});

function renderExpenses() {
    const expensesList = document.getElementById("expenses-list");
    const expensesCount = document.getElementById("expenses-count");
    const expensesEmpty = document.getElementById("expenses-empty");

    expensesList.innerHTML = "";

    expensesCount.textContent =
        `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"}`;

    expenses.forEach(expense => {
        const li = document.createElement("li");

        const perPerson = expense.amount / expense.splitBetween.length;

        li.className = "py-3 px-1 hover:bg-slate-100/50 transition-colors";

        li.innerHTML = `
            <div class="flex items-start justify-between gap-3 sm:gap-4">
                <div class="min-w-0 flex-1">
                    <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
                        <h3 class="font-sans text-sm sm:text-base font-semibold text-ledger-ink break-words min-w-0">
                            ${escapeHTML(expense.title)}
                        </h3>
                        <div class="flex items-baseline gap-2 shrink-0 self-start sm:self-auto">
                            <span class="font-mono text-sm sm:text-base font-semibold text-ledger-ink">
                                ₹${formatAmount(expense.amount)}
                            </span>
                            <span class="font-mono text-xs text-ledger-muted">
                                (₹${formatAmount(perPerson)} / person)
                            </span>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-ledger-muted font-sans">
                        <span>
                            Paid by
                            <strong class="font-medium text-ledger-ink">
                                ${escapeHTML(expense.payer)}
                            </strong>
                        </span>
                        <span class="text-ledger-border">•</span>
                        <span>
                            Split between:
                            <span class="text-ledger-ink font-medium break-words">
                                ${expense.splitBetween.map(escapeHTML).join(", ")}
                            </span>
                        </span>
                    </div>
                </div>
                <button type="button"
                    class="delete-expense-btn text-ledger-muted hover:text-ledger-rust p-2 rounded-sm transition-colors cursor-pointer shrink-0 ml-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    data-id="${escapeHTML(expense.id)}"
                    title="Delete ${escapeHTML(expense.title)}"
                    aria-label="Delete ${escapeHTML(expense.title)}">
                    <svg class="w-4 h-4 pointer-events-none" fill="none"
                        stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
        `;

        expensesList.appendChild(li);
    });

    expensesEmpty.classList.toggle("hidden", expenses.length !== 0);
}

document.getElementById("expenses-list").addEventListener("click", function (e) {
    const button = e.target.closest(".delete-expense-btn");

    if (!button) return;

    const expenseId = button.dataset.id;

    expenses = expenses.filter(expense => expense.id !== expenseId);

    saveData();

    renderExpenses();
    renderBalances();
});

function calculateBalances() {
    const balances = {};

    members.forEach(member => {
        balances[member.name] = 0;
    });

    expenses.forEach(expense => {
        const amount = Number(expense.amount);
        const participants = expense.splitBetween;

        if (participants.length === 0) return;

        const share = amount / participants.length;

        if (balances[expense.payer] !== undefined) {
            balances[expense.payer] += amount;
        }

        participants.forEach(name => {
            if (balances[name] !== undefined) {
                balances[name] -= share;
            }
        });
    });

    return balances;
}

function renderBalances() {
    const balancesList = document.getElementById("balances-list");
    const balancesEmpty = document.getElementById("balances-empty");

    balancesList.innerHTML = "";

    const balances = calculateBalances();

    members.forEach((member, index) => {
        const balance = Math.round(balances[member.name] * 100) / 100;

        let status = "";

        if (balance > 0.009) {
            status = `
                <span class="text-ledger-forest font-medium">
                    gets back ₹${formatAmount(balance)}
                </span>
            `;
        } else if (balance < -0.009) {
            status = `
                <span class="text-ledger-rust font-medium">
                    owes ₹${formatAmount(Math.abs(balance))}
                </span>
            `;
        } else {
            status = `
                <span class="text-ledger-muted">settled up</span>
            `;
        }

        const li = document.createElement("li");

        li.className =
            "flex items-center justify-between py-2.5 px-1 hover:bg-slate-100/50 transition-colors gap-3";

        li.innerHTML = `
            <div class="flex items-center gap-3 min-w-0 flex-1">
                <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium text-white shrink-0"
                    style="background-color: ${getMemberColor(index)}">
                    ${escapeHTML(member.name.charAt(0).toUpperCase())}
                </span>
                <span class="font-sans text-sm font-medium text-ledger-ink truncate break-words">
                    ${escapeHTML(member.name)}
                </span>
            </div>
            <div class="font-mono text-sm shrink-0 ml-2 text-right">
                ${status}
            </div>
        `;

        balancesList.appendChild(li);
    });

    balancesEmpty.classList.toggle("hidden", members.length !== 0);
}

const clearAllDefault = document.getElementById("clear-all-default");
const clearAllConfirm = document.getElementById("clear-all-confirm");

document.getElementById("clear-all-btn").addEventListener("click", function () {
    clearAllDefault.classList.add("hidden");
    clearAllConfirm.classList.remove("hidden");
    clearAllConfirm.classList.add("flex");
});

document.getElementById("cancel-clear-btn").addEventListener("click", function () {
    clearAllConfirm.classList.add("hidden");
    clearAllConfirm.classList.remove("flex");
    clearAllDefault.classList.remove("hidden");
});

document.getElementById("confirm-clear-btn").addEventListener("click", function () {
    members = [];
    expenses = [];

    saveData();

    renderMembers();
    renderExpenses();
    renderBalances();

    clearAllConfirm.classList.add("hidden");
    clearAllConfirm.classList.remove("flex");
    clearAllDefault.classList.remove("hidden");
});

function initApp() {
    renderMembers();
    renderExpenses();
    renderBalances();
    updateMemberDropdown();
    updateSplitCheckboxes();
    updateExpenseFormState();

    console.log("Expense Splitter initialized successfully!");
}

initApp();
