const billForm = document.getElementById("billForm");
const billTitle = document.getElementById("billTitle");
const billAmount = document.getElementById("billAmount");
const billDueDate = document.getElementById("billDueDate");
const billMessage = document.getElementById("billMessage");
const billsTableBody = document.getElementById("billsTableBody");
const emptyBillsMessage = document.getElementById("emptyBillsMessage");

const totalBills = document.getElementById("totalBills");
const pendingBills = document.getElementById("pendingBills");
const paidBills = document.getElementById("paidBills");

const BILL_KEY = "spendwise_bills";

function getBills() {
  try {
    return JSON.parse(localStorage.getItem(BILL_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveBills(bills) {
  localStorage.setItem(BILL_KEY, JSON.stringify(bills));
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);
}

function renderBills() {
  const bills = getBills();

  billsTableBody.replaceChildren();

  totalBills.textContent = bills.length;
  pendingBills.textContent = bills.filter(
    bill => bill.status === "Pending"
  ).length;
  paidBills.textContent = bills.filter(
    bill => bill.status === "Paid"
  ).length;

  emptyBillsMessage.hidden = bills.length > 0;

  bills.forEach(bill => {
    const row = document.createElement("tr");

    const titleCell = document.createElement("td");
    titleCell.textContent = bill.title;

    const amountCell = document.createElement("td");
    amountCell.textContent = formatCurrency(bill.amount);

    const dateCell = document.createElement("td");
    dateCell.textContent = bill.dueDate;

    const statusCell = document.createElement("td");
    statusCell.textContent = bill.status;

    const actionCell = document.createElement("td");

    if (bill.status === "Pending") {
      const paidButton = document.createElement("button");
      paidButton.type = "button";
      paidButton.textContent = "Mark Paid";

      paidButton.addEventListener("click", () => {
        updateBillStatus(bill.id);
      });

      actionCell.appendChild(paidButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.style.marginLeft = "8px";

    deleteButton.addEventListener("click", () => {
      deleteBill(bill.id);
    });

    actionCell.appendChild(deleteButton);

    row.append(
      titleCell,
      amountCell,
      dateCell,
      statusCell,
      actionCell
    );

    billsTableBody.appendChild(row);
  });
}

billForm.addEventListener("submit", event => {
  event.preventDefault();

  const title = billTitle.value.trim();
  const amount = Number(billAmount.value);
  const dueDate = billDueDate.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !dueDate) {
    billMessage.textContent = "Please enter valid bill details.";
    return;
  }

  const bills = getBills();

  bills.push({
    id: crypto.randomUUID(),
    title,
    amount,
    dueDate,
    status: "Pending"
  });

  try {
    saveBills(bills);
    billForm.reset();
    billMessage.textContent = "Bill added successfully!";
    renderBills();
  } catch (error) {
    console.error(error);
    billMessage.textContent = "Unable to save the bill.";
  }
});

function updateBillStatus(id) {
  const bills = getBills().map(bill =>
    bill.id === id ? { ...bill, status: "Paid" } : bill
  );

  try {
    saveBills(bills);
    renderBills();
  } catch (error) {
    console.error(error);
    alert("Unable to update bill status.");
  }
}

function deleteBill(id) {
  if (!confirm("Are you sure you want to delete this bill?")) {
    return;
  }

  const bills = getBills().filter(bill => bill.id !== id);

  try {
    saveBills(bills);
    renderBills();
  } catch (error) {
    console.error(error);
    alert("Unable to delete the bill.");
  }
}

renderBills();