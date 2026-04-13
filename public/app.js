const reports = [
  {
    id: "borrow-list",
    title: "Danh sach muon sach",
    description: "Liet ke cac phieu muon kem ten thanh vien va thu thu.",
    endpoint: "/api/reports/borrow-list"
  },
  {
    id: "overdue-books",
    title: "Sach dang qua han",
    description: "Cac sach dang muon va so ngay da qua han.",
    endpoint: "/api/reports/overdue-books"
  },
  {
    id: "shifts",
    title: "Thong ke ca lam",
    description: "Dem so ca lam cua tung thu thu theo thang/nam.",
    endpoint: "/api/reports/shifts",
    withDateFilter: true
  },
  {
    id: "book-category-count",
    title: "So luong sach theo loai",
    description: "Tong hop giao trinh va tieu thuyet theo tung nhom.",
    endpoint: "/api/reports/book-category-count"
  },
  {
    id: "member-borrow-count",
    title: "So lan muon theo thanh vien",
    description: "Xep hang tan suat muon sach cua thanh vien.",
    endpoint: "/api/reports/member-borrow-count"
  },
  {
    id: "overdue-members",
    title: "Thanh vien chua tra sach",
    description: "Thong tin thanh vien dang qua han va chua tra.",
    endpoint: "/api/reports/overdue-members"
  },
  {
    id: "branch-book-count",
    title: "Tong sach moi chi nhanh",
    description: "Dem so ban sao sach hien co tai tung chi nhanh.",
    endpoint: "/api/reports/branch-book-count"
  },
  {
    id: "supplier-branch-count",
    title: "Nha cung cap theo chi nhanh",
    description: "Moi nha cung cap dang phan phoi cho bao nhieu chi nhanh.",
    endpoint: "/api/reports/supplier-branch-count"
  },
  {
    id: "top-borrower",
    title: "Thanh vien muon nhieu nhat",
    description: "Tim thanh vien co so luot muon cao nhat.",
    endpoint: "/api/reports/top-borrower"
  },
  {
    id: "damaged-copies",
    title: "Ban sao sach can bao tri",
    description: "Loc ban sao co tinh trang trung binh hoac hu hong.",
    endpoint: "/api/reports/damaged-copies"
  }
];

const state = {
  activeReportId: null
};

const reportButtonsContainer = document.getElementById("reportButtons");
const tableShell = document.getElementById("tableShell");
const resultTitle = document.getElementById("resultTitle");
const resultMeta = document.getElementById("resultMeta");
const connectionStatus = document.getElementById("connectionStatus");
const summaryGrid = document.getElementById("summaryGrid");
const dateFilterForm = document.getElementById("dateFilterForm");
const monthInput = document.getElementById("monthInput");
const yearInput = document.getElementById("yearInput");

function formatValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString("vi-VN");
  }

  return String(value);
}

function showLoading(text = "Dang tai du lieu...") {
  tableShell.innerHTML = `<p class="loading-message">${text}</p>`;
}

function showError(message) {
  tableShell.innerHTML = `<p class="error-message">${message}</p>`;
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    tableShell.innerHTML = '<p class="empty-message">Khong co du lieu cho truy van nay.</p>';
    resultMeta.textContent = "0 dong";
    return;
  }

  const columns = Object.keys(rows[0]);
  const headHtml = columns.map((column) => `<th>${column}</th>`).join("");
  const bodyHtml = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${formatValue(row[column])}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  tableShell.innerHTML = `
    <table>
      <thead>
        <tr>${headHtml}</tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  resultMeta.textContent = `${rows.length} dong`;
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Khong the tai du lieu");
  }

  return data;
}

function highlightActiveButton() {
  document.querySelectorAll(".report-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.reportId === state.activeReportId);
  });
}

async function loadSummary() {
  summaryGrid.innerHTML = '<article class="summary-card loading-card">Dang tai so lieu tong quan...</article>';

  try {
    const summary = await fetchJson("/api/dashboard/summary");
    const cards = [
      { label: "Tong sach", value: summary.tong_sach },
      { label: "Tong ban sao", value: summary.tong_ban_sao },
      { label: "Thanh vien", value: summary.tong_thanh_vien },
      { label: "Chi nhanh", value: summary.tong_chi_nhanh },
      { label: "Dang muon", value: summary.dang_muon },
      { label: "Qua han", value: summary.qua_han }
    ];

    summaryGrid.innerHTML = cards
      .map(
        (card) => `
          <article class="summary-card">
            <p class="label">${card.label}</p>
            <p class="value">${card.value ?? 0}</p>
          </article>
        `
      )
      .join("");
  } catch (error) {
    summaryGrid.innerHTML = `<article class="summary-card">Khong tai duoc tong quan: ${error.message}</article>`;
  }
}

async function runReport(reportId) {
  const report = reports.find((item) => item.id === reportId);
  if (!report) {
    return;
  }

  state.activeReportId = report.id;
  highlightActiveButton();
  resultTitle.textContent = report.title;
  showLoading(`Dang chay: ${report.title}...`);

  let endpoint = report.endpoint;

  if (report.withDateFilter) {
    const month = Number(monthInput.value);
    const year = Number(yearInput.value);

    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
      showError("Gia tri thang/nam khong hop le.");
      return;
    }

    endpoint += `?month=${month}&year=${year}`;
  }

  try {
    const data = await fetchJson(endpoint);

    if (report.id === "shifts") {
      resultMeta.textContent = `Thang ${data.month}/${data.year}`;
      renderTable(data.data || []);
      return;
    }

    if (report.id === "top-borrower") {
      renderTable(data ? [data] : []);
      return;
    }

    renderTable(data);
  } catch (error) {
    showError(error.message);
  }
}

function buildReportButtons() {
  reportButtonsContainer.innerHTML = reports
    .map(
      (report) => `
        <button class="report-btn" data-report-id="${report.id}">
          <strong>${report.title}</strong>
          <span>${report.description}</span>
        </button>
      `
    )
    .join("");

  reportButtonsContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".report-btn");
    if (!button) {
      return;
    }

    runReport(button.dataset.reportId);
  });
}

async function checkConnection() {
  try {
    await fetchJson("/api/health");
    connectionStatus.textContent = "Da ket noi SQL Server thanh cong.";
    connectionStatus.classList.add("ok");
  } catch (error) {
    connectionStatus.textContent = `Loi ket noi database: ${error.message}`;
    connectionStatus.classList.add("error");
  }
}

function bindEvents() {
  dateFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.activeReportId === "shifts") {
      runReport("shifts");
      return;
    }

    runReport("shifts");
  });
}

async function init() {
  buildReportButtons();
  bindEvents();
  await Promise.all([checkConnection(), loadSummary()]);
  runReport("borrow-list");
}

init();
