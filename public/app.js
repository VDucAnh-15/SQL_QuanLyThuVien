const reports = [
  {
    id: "borrow-list",
    title: "Danh sách mượn sách",
    description: "Liệt kê các phiếu mượn kèm tên thành viên và thủ thư.",
    endpoint: "/api/reports/borrow-list"
  },
  {
    id: "overdue-books",
    title: "Sách đang quá hạn",
    description: "Các sách đang mượn và số ngày đã quá hạn.",
    endpoint: "/api/reports/overdue-books"
  },
  {
    id: "shifts",
    title: "Thống kê ca làm",
    description: "Đếm số ca làm của từng thủ thư theo tháng/năm.",
    endpoint: "/api/reports/shifts",
    withDateFilter: true
  },
  {
    id: "book-category-count",
    title: "Số lượng sách theo loại",
    description: "Tổng hợp giáo trình và tiểu thuyết theo từng nhóm.",
    endpoint: "/api/reports/book-category-count"
  },
  {
    id: "member-borrow-count",
    title: "Số lần mượn theo thành viên",
    description: "Xếp hạng tần suất mượn sách của thành viên.",
    endpoint: "/api/reports/member-borrow-count"
  },
  {
    id: "overdue-members",
    title: "Thành viên chưa trả sách",
    description: "Thông tin thành viên đang quá hạn và chưa trả.",
    endpoint: "/api/reports/overdue-members"
  },
  {
    id: "branch-book-count",
    title: "Tổng sách mỗi chi nhánh",
    description: "Đếm số bản sao sách hiện có tại từng chi nhánh.",
    endpoint: "/api/reports/branch-book-count"
  },
  {
    id: "supplier-branch-count",
    title: "Nhà cung cấp theo chi nhánh",
    description: "Mỗi nhà cung cấp đang phân phối cho bao nhiêu chi nhánh.",
    endpoint: "/api/reports/supplier-branch-count"
  },
  {
    id: "top-borrower",
    title: "Thành viên mượn nhiều nhất",
    description: "Tìm thành viên có số lượt mượn cao nhất.",
    endpoint: "/api/reports/top-borrower"
  },
  {
    id: "damaged-copies",
    title: "Bản sao sách cần bảo trì",
    description: "Lọc bản sao có tình trạng trung bình hoặc hư hỏng.",
    endpoint: "/api/reports/damaged-copies"
  }
];

const viewMeta = {
  dashboard: {
    title: "Tổng quan hệ thống",
    subtitle: "Theo dõi dữ liệu và thao tác nhanh với cơ sở dữ liệu thư viện."
  },
  members: {
    title: "Quản lý thành viên",
    subtitle: "Thêm, tìm kiếm, chỉnh sửa và xóa thành viên."
  },
  books: {
    title: "Quản lý sách",
    subtitle: "Thêm sách, thêm bản sao theo lô và cập nhật trạng thái từng bản sao."
  },
  suppliers: {
    title: "Quản lý nhà cung cấp",
    subtitle: "Thêm, tìm kiếm, chỉnh sửa và xóa nhà cung cấp."
  },
  borrows: {
    title: "Quản lý mượn / trả sách",
    subtitle: "Quét mã thành viên và bản sao sách, xác nhận trả nhanh và theo dõi tiền phạt."
  },
  reports: {
    title: "Báo cáo",
    subtitle: "Xem nhanh các thống kê và danh sách quan trọng."
  }
};

const state = {
  activeReportId: null,
  editingMemberId: null,
  editingBookId: null,
  editingBookCopyKey: null,
  editingSupplierId: null,
  editingBorrowKey: null,
  borrowCurrentMember: null,
  borrowCurrentCopy: null,
  currentLibrarian: null,
  activeView: "dashboard"
};

const sidebarNav = document.getElementById("sidebarNav");
const panels = Array.from(document.querySelectorAll(".workspace-panel"));
const viewTitle = document.getElementById("viewTitle");
const viewSubtitle = document.getElementById("viewSubtitle");

const reportButtonsContainer = document.getElementById("reportButtons");
const reportOverviewGrid = document.getElementById("reportOverviewGrid");
const tableShell = document.getElementById("tableShell");
const resultTitle = document.getElementById("resultTitle");
const resultMeta = document.getElementById("resultMeta");
const connectionStatus = document.getElementById("connectionStatus");
const summaryGrid = document.getElementById("summaryGrid");
const dateFilterForm = document.getElementById("dateFilterForm");
const monthInput = document.getElementById("monthInput");
const yearInput = document.getElementById("yearInput");

const memberForm = document.getElementById("memberForm");
const memberSubmitBtn = document.getElementById("memberSubmitBtn");
const memberCancelEditBtn = document.getElementById("memberCancelEditBtn");
const memberFormMessage = document.getElementById("memberFormMessage");
const memberSearchForm = document.getElementById("memberSearchForm");
const memberSearchInput = document.getElementById("memberSearchInput");
const memberStatusFilter = document.getElementById("memberStatusFilter");
const memberResetFilterBtn = document.getElementById("memberResetFilterBtn");
const memberCrudMeta = document.getElementById("memberCrudMeta");
const memberCrudTableShell = document.getElementById("memberCrudTableShell");

const bookForm = document.getElementById("bookForm");
const bookIdInput = bookForm.querySelector('[name="ma_sach"]');
const bookCopyCountInput = bookForm.querySelector('[name="so_ban_sao"]');
const bookCopyBranchInput = bookForm.querySelector('[name="ma_chi_nhanh"]');
const bookSubmitBtn = document.getElementById("bookSubmitBtn");
const bookCancelEditBtn = document.getElementById("bookCancelEditBtn");
const bookFormMessage = document.getElementById("bookFormMessage");
const bookSearchForm = document.getElementById("bookSearchForm");
const bookSearchInput = document.getElementById("bookSearchInput");
const bookYearFilter = document.getElementById("bookYearFilter");
const bookResetFilterBtn = document.getElementById("bookResetFilterBtn");
const bookCrudMeta = document.getElementById("bookCrudMeta");
const bookCrudTableShell = document.getElementById("bookCrudTableShell");

const bookCopyForm = document.getElementById("bookCopyForm");
const bookCopyBookIdInput = document.getElementById("bookCopyBookIdInput");
const bookCopyNoInput = document.getElementById("bookCopyNoInput");
const bookCopyQuantityInput = document.getElementById("bookCopyQuantityInput");
const bookCopyBranchInputForm = document.getElementById("bookCopyBranchInput");
const bookCopyBorrowStatusInput = document.getElementById("bookCopyBorrowStatusInput");
const bookCopyPhysicalStatusInput = document.getElementById("bookCopyPhysicalStatusInput");
const bookCopyImportDateInput = document.getElementById("bookCopyImportDateInput");
const bookCopyNoteInput = document.getElementById("bookCopyNoteInput");
const bookCopySubmitBtn = document.getElementById("bookCopySubmitBtn");
const bookCopyCancelEditBtn = document.getElementById("bookCopyCancelEditBtn");
const bookCopyFormMessage = document.getElementById("bookCopyFormMessage");
const bookCopySearchForm = document.getElementById("bookCopySearchForm");
const bookCopySearchInput = document.getElementById("bookCopySearchInput");
const bookCopyBranchFilter = document.getElementById("bookCopyBranchFilter");
const bookCopyBorrowStatusFilter = document.getElementById("bookCopyBorrowStatusFilter");
const bookCopyPhysicalStatusFilter = document.getElementById("bookCopyPhysicalStatusFilter");
const bookCopyResetFilterBtn = document.getElementById("bookCopyResetFilterBtn");
const bookCopyCrudMeta = document.getElementById("bookCopyCrudMeta");
const bookCopyCrudTableShell = document.getElementById("bookCopyCrudTableShell");

const supplierForm = document.getElementById("supplierForm");
const supplierIdInput = supplierForm.querySelector('[name="ma_ncc"]');
const supplierSubmitBtn = document.getElementById("supplierSubmitBtn");
const supplierCancelEditBtn = document.getElementById("supplierCancelEditBtn");
const supplierFormMessage = document.getElementById("supplierFormMessage");
const supplierSearchForm = document.getElementById("supplierSearchForm");
const supplierSearchInput = document.getElementById("supplierSearchInput");
const supplierResetFilterBtn = document.getElementById("supplierResetFilterBtn");
const supplierCrudMeta = document.getElementById("supplierCrudMeta");
const supplierCrudTableShell = document.getElementById("supplierCrudTableShell");

const borrowForm = document.getElementById("borrowForm");
const borrowRefreshBtn = document.getElementById("borrowRefreshBtn");
const borrowSubmitBtn = document.getElementById("borrowSubmitBtn");
const borrowFormMessage = document.getElementById("borrowFormMessage");
const borrowMemberCodeInput = document.getElementById("borrowMemberCodeInput");
const borrowLookupMemberBtn = document.getElementById("borrowLookupMemberBtn");
const borrowMemberCard = document.getElementById("borrowMemberCard");
const borrowBookCodeInput = document.getElementById("borrowBookCodeInput");
const borrowCopyNoInput = document.getElementById("borrowCopyNoInput");
const borrowLookupCopyBtn = document.getElementById("borrowLookupCopyBtn");
const borrowCopyCard = document.getElementById("borrowCopyCard");
const borrowLibrarianDisplay = document.getElementById("borrowLibrarianDisplay");
const borrowLibrarianInput = document.getElementById("borrowLibrarianInput");
const borrowDateInput = document.getElementById("borrowDateInput");
const borrowDueDateInput = document.getElementById("borrowDueDateInput");
const borrowSearchForm = document.getElementById("borrowSearchForm");
const borrowSearchInput = document.getElementById("borrowSearchInput");
const borrowStatusFilter = document.getElementById("borrowStatusFilter");
const borrowResetFilterBtn = document.getElementById("borrowResetFilterBtn");
const borrowCrudMeta = document.getElementById("borrowCrudMeta");
const borrowCrudTableShell = document.getElementById("borrowCrudTableShell");
const borrowEditPanel = document.getElementById("borrowEditPanel");
const borrowEditForm = document.getElementById("borrowEditForm");
const borrowEditLibrarianSelect = document.getElementById("borrowEditLibrarianSelect");
const borrowEditSubmitBtn = document.getElementById("borrowEditSubmitBtn");
const borrowEditCancelBtn = document.getElementById("borrowEditCancelBtn");
const borrowEditMessage = document.getElementById("borrowEditMessage");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleDateString("vi-VN");
  }

  return String(value);
}

function getTodayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")} VND`;
}

function getBorrowStatusChip(status) {
  const normalized = String(status || "").trim();

  if (normalized === "Đã trả") {
    return '<span class="status-chip returned">Đã trả</span>';
  }

  if (normalized === "Quá hạn") {
    return '<span class="status-chip overdue">Quá hạn</span>';
  }

  if (normalized === "Đang mượn") {
    return '<span class="status-chip borrowing">Đang mượn</span>';
  }

  return `<span class="status-chip borrowing">${escapeHtml(normalized || "Đang mượn")}</span>`;
}

function buildQueryString(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      query.set(key, String(value).trim());
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

function setMessage(target, message, type = "") {
  target.textContent = message;
  target.className = "member-form-message";

  if (type) {
    target.classList.add(type);
  }
}

function ensureSelectValue(selectElement, value, fallback = "") {
  Array.from(selectElement.querySelectorAll('option[data-dynamic="true"]')).forEach((option) => option.remove());

  if (value && !Array.from(selectElement.options).some((option) => option.value === value)) {
    const dynamicOption = document.createElement("option");
    dynamicOption.value = value;
    dynamicOption.textContent = value;
    dynamicOption.dataset.dynamic = "true";
    selectElement.appendChild(dynamicOption);
  }

  if (value) {
    selectElement.value = value;
    return;
  }

  if (fallback) {
    selectElement.value = fallback;
  }
}

function setMemberFormMode(mode = "create") {
  if (mode === "edit") {
    memberSubmitBtn.textContent = "Cập nhật thành viên";
    memberCancelEditBtn.classList.remove("hidden");
    return;
  }

  state.editingMemberId = null;
  memberSubmitBtn.textContent = "Thêm thành viên";
  memberCancelEditBtn.classList.add("hidden");
}

function setBookFormMode(mode = "create") {
  if (mode === "edit") {
    bookSubmitBtn.textContent = "Cập nhật sách";
    bookCancelEditBtn.classList.remove("hidden");
    bookIdInput.disabled = false;
    bookCopyCountInput.disabled = false;
    bookCopyBranchInput.disabled = false;
    return;
  }

  state.editingBookId = null;
  bookSubmitBtn.textContent = "Thêm sách";
  bookCancelEditBtn.classList.add("hidden");
  bookIdInput.disabled = false;
  bookCopyCountInput.disabled = false;
  bookCopyBranchInput.disabled = false;
  bookCopyCountInput.value = "0";
  bookCopyBranchInput.value = "";
}

function setBookCopyFormMode(mode = "create") {
  if (mode === "edit") {
    bookCopySubmitBtn.textContent = "Cập nhật bản sao";
    bookCopyCancelEditBtn.classList.remove("hidden");
    bookCopyBookIdInput.disabled = true;
    bookCopyQuantityInput.disabled = true;
    return;
  }

  state.editingBookCopyKey = null;
  bookCopyForm.reset();
  bookCopyNoInput.value = "";
  bookCopyQuantityInput.value = "1";
  bookCopyQuantityInput.disabled = false;
  bookCopyBookIdInput.disabled = false;
  bookCopyBorrowStatusInput.value = "Chưa mượn";
  bookCopyPhysicalStatusInput.value = "Tốt";
  bookCopySubmitBtn.textContent = "Thêm bản sao theo lô";
  bookCopyCancelEditBtn.classList.add("hidden");
}

function setSupplierFormMode(mode = "create") {
  if (mode === "edit") {
    supplierSubmitBtn.textContent = "Cập nhật nhà cung cấp";
    supplierCancelEditBtn.classList.remove("hidden");
    return;
  }

  state.editingSupplierId = null;
  supplierSubmitBtn.textContent = "Thêm nhà cung cấp";
  supplierCancelEditBtn.classList.add("hidden");
  supplierIdInput.disabled = false;
}

function setBorrowEditMode(mode = "create") {
  if (mode === "edit") {
    borrowEditPanel.classList.remove("hidden");
    return;
  }

  state.editingBorrowKey = null;
  borrowEditForm.reset();
  setMessage(borrowEditMessage, "");
  borrowEditPanel.classList.add("hidden");
}

function toDateInputValue(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(0, 10);
}

function setActiveView(view) {
  if (!viewMeta[view]) {
    return;
  }

  state.activeView = view;

  document.querySelectorAll(".side-link").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.view === view);
  });

  viewTitle.textContent = viewMeta[view].title;
  viewSubtitle.textContent = viewMeta[view].subtitle;

  if (view === "borrows") {
    loadBorrowLookups();
    loadBorrowCrudList();
  }

  if (view === "books") {
    loadBookCrudList();
    loadBookCopyCrudList();
  }

  if (view === "suppliers") {
    loadSupplierCrudList();
  }

  if (view === "reports") {
    loadReportsOverview();
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể tải dữ liệu");
  }

  return data;
}

async function sendJson(url, method, payload) {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload ? JSON.stringify(payload) : undefined
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Không thể xử lý dữ liệu");
  }

  return data;
}

function showLoading(text = "Đang tải dữ liệu...") {
  tableShell.innerHTML = `<p class="loading-message">${text}</p>`;
}

function showError(message) {
  tableShell.innerHTML = `<p class="error-message">${escapeHtml(message)}</p>`;
}

function renderTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    tableShell.innerHTML = '<p class="empty-message">Không có dữ liệu cho truy vấn này.</p>';
    resultMeta.textContent = "0 dòng";
    return;
  }

  const columns = Object.keys(rows[0]);
  const headHtml = columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("");
  const bodyHtml = rows
    .map((row) => {
      const cells = columns
        .map((column) => `<td>${escapeHtml(formatValue(row[column]))}</td>`)
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

  resultMeta.textContent = `${rows.length} dòng`;
}

function highlightActiveButton() {
  document.querySelectorAll(".report-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.reportId === state.activeReportId);
  });
}

async function loadSummary() {
  summaryGrid.innerHTML = '<article class="summary-card loading-card">Đang tải số liệu tổng quan...</article>';

  try {
    const summary = await fetchJson("/api/dashboard/summary");
    const cards = [
      { label: "Tổng sách", value: summary.tong_sach },
      { label: "Tổng bản sao", value: summary.tong_ban_sao },
      { label: "Thành viên", value: summary.tong_thanh_vien },
      { label: "Nhà cung cấp", value: summary.tong_nha_cung_cap },
      { label: "Chi nhánh", value: summary.tong_chi_nhanh },
      { label: "Đang mượn", value: summary.dang_muon },
      { label: "Quá hạn", value: summary.qua_han }
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
    summaryGrid.innerHTML = `<article class="summary-card">Không tải được tổng quan: ${escapeHtml(error.message)}</article>`;
  }
}

function renderReportOverviewCards(summary) {
  const cards = [
    { label: "Danh sách thành viên", value: summary.tong_thanh_vien ?? 0 },
    { label: "Số lượng sách", value: summary.tong_sach ?? 0 },
    { label: "Nhà cung cấp", value: summary.tong_nha_cung_cap ?? 0 },
    { label: "Chi nhánh", value: summary.tong_chi_nhanh ?? 0 },
    { label: "Loại truy vấn", value: reports.length }
  ];

  reportOverviewGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="summary-card">
          <p class="label">${card.label}</p>
          <p class="value">${card.value}</p>
        </article>
      `
    )
    .join("");
}

async function loadReportsOverview() {
  reportOverviewGrid.innerHTML = '<article class="summary-card loading-card">Đang tải tổng quan báo cáo...</article>';

  try {
    const summary = await fetchJson("/api/dashboard/summary");
    renderReportOverviewCards(summary);
  } catch (error) {
    reportOverviewGrid.innerHTML = `<article class="summary-card">Không tải được tổng quan: ${escapeHtml(error.message)}</article>`;
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
  showLoading(`Đang chạy: ${report.title}...`);

  let endpoint = report.endpoint;

  if (report.withDateFilter) {
    const month = Number(monthInput.value);
    const year = Number(yearInput.value);

    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
      showError("Giá trị tháng/năm không hợp lệ.");
      return;
    }

    endpoint += `?month=${month}&year=${year}`;
  }

  try {
    const data = await fetchJson(endpoint);

    if (report.id === "shifts") {
      resultMeta.textContent = `Tháng ${data.month}/${data.year}`;
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
    connectionStatus.textContent = "Đã kết nối SQL Server thành công.";
    connectionStatus.classList.add("ok");
  } catch (error) {
    connectionStatus.textContent = `Lỗi kết nối cơ sở dữ liệu: ${error.message}`;
    connectionStatus.classList.add("error");
  }
}

function renderMemberCrudTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    memberCrudTableShell.innerHTML = '<p class="empty-message">Không có thành viên phù hợp với bộ lọc.</p>';
    memberCrudMeta.textContent = "0 thành viên";
    return;
  }

  const bodyHtml = rows
    .map((member) => {
      const memberId = escapeHtml(member.ma_thanh_vien || "");
      return `
        <tr>
          <td>${memberId}</td>
          <td>${escapeHtml(member.ho_ten || "")}</td>
          <td>${escapeHtml(member.sdt || "")}</td>
          <td>${escapeHtml(member.dia_chi || "")}</td>
          <td>${escapeHtml(formatValue(member.ngay_dang_ky))}</td>
          <td>${escapeHtml(member.tinh_trang_the || "")}</td>
          <td>${escapeHtml(member.ghi_chu || "")}</td>
          <td>
            <div class="table-row-actions">
              <button type="button" class="row-action-btn edit" data-action="edit" data-id="${memberId}">Sửa</button>
              <button type="button" class="row-action-btn delete" data-action="delete" data-id="${memberId}">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  memberCrudTableShell.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã TV</th>
          <th>Họ tên</th>
          <th>Số điện thoại</th>
          <th>Địa chỉ</th>
          <th>Ngày đăng ký</th>
          <th>Tình trạng</th>
          <th>Ghi chú</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  memberCrudMeta.textContent = `${rows.length} thành viên`;
}

function fillMemberForm(member) {
  memberForm.reset();
  document.getElementById("memberIdInput").value = member.ma_thanh_vien || "";
  document.getElementById("memberNameInput").value = member.ho_ten || "";
  document.getElementById("memberPhoneInput").value = member.sdt || "";
  document.getElementById("memberAddressInput").value = member.dia_chi || "";
  document.getElementById("memberDateInput").value = member.ngay_dang_ky ? String(member.ngay_dang_ky).slice(0, 10) : "";
  document.getElementById("memberStatusInput").value = member.tinh_trang_the || "";
  document.getElementById("memberNoteInput").value = member.ghi_chu || "";
}

function getMemberPayloadFromForm() {
  const formData = new FormData(memberForm);
  const payload = {
    ma_thanh_vien: String(formData.get("ma_thanh_vien") || "").trim(),
    ho_ten: String(formData.get("ho_ten") || "").trim(),
    sdt: String(formData.get("sdt") || "").trim(),
    dia_chi: String(formData.get("dia_chi") || "").trim(),
    ngay_dang_ky: String(formData.get("ngay_dang_ky") || "").trim(),
    tinh_trang_the: String(formData.get("tinh_trang_the") || "").trim(),
    ghi_chu: String(formData.get("ghi_chu") || "").trim()
  };

  if (!payload.sdt) delete payload.sdt;
  if (!payload.dia_chi) delete payload.dia_chi;
  if (!payload.ngay_dang_ky) delete payload.ngay_dang_ky;
  if (!payload.tinh_trang_the) delete payload.tinh_trang_the;
  if (!payload.ghi_chu) delete payload.ghi_chu;

  return payload;
}

async function loadMemberCrudList() {
  memberCrudMeta.textContent = "Đang tải danh sách thành viên...";
  memberCrudTableShell.innerHTML = '<p class="loading-message">Đang tải danh sách thành viên...</p>';

  try {
    const query = buildQueryString({
      keyword: memberSearchInput.value,
      status: memberStatusFilter.value
    });

    const rows = await fetchJson(`/api/members${query}`);
    renderMemberCrudTable(rows);
  } catch (error) {
    memberCrudMeta.textContent = "Lỗi tải dữ liệu";
    memberCrudTableShell.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
  }
}

async function startEditMember(memberId) {
  try {
    const member = await fetchJson(`/api/members/${encodeURIComponent(memberId)}`);
    state.editingMemberId = member.ma_thanh_vien;
    fillMemberForm(member);
    setMemberFormMode("edit");
    setMessage(memberFormMessage, `Đang chỉnh sửa thành viên ${member.ma_thanh_vien}`, "loading");
    setActiveView("members");
    memberForm.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    setMessage(memberFormMessage, error.message, "error");
  }
}

async function removeMember(memberId) {
  const accepted = window.confirm(
    `Bạn có chắc muốn xóa thành viên ${memberId}?\n` +
      "Thao tác này sẽ xóa cả lịch sử mượn liên quan của thành viên."
  );
  if (!accepted) {
    return;
  }

  try {
    await sendJson(`/api/members/${encodeURIComponent(memberId)}?force=true`, "DELETE");
    setMessage(memberFormMessage, "Xóa thành viên thành công.", "ok");
    await Promise.all([loadSummary(), loadMemberCrudList(), loadReportsOverview()]);

    if (state.editingMemberId === memberId) {
      memberForm.reset();
      setMemberFormMode("create");
    }
  } catch (error) {
    setMessage(memberFormMessage, error.message, "error");
  }
}

function renderSupplierCrudTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    supplierCrudTableShell.innerHTML = '<p class="empty-message">Không có nhà cung cấp phù hợp với bộ lọc.</p>';
    supplierCrudMeta.textContent = "0 nhà cung cấp";
    return;
  }

  const bodyHtml = rows
    .map((supplier) => {
      const supplierId = escapeHtml(supplier.ma_ncc || "");
      return `
        <tr>
          <td>${supplierId}</td>
          <td>${escapeHtml(supplier.ten_ncc || "")}</td>
          <td>${escapeHtml(supplier.sdt || "")}</td>
          <td>${escapeHtml(supplier.email || "")}</td>
          <td>${escapeHtml(supplier.dia_chi || "")}</td>
          <td>
            <div class="table-row-actions">
              <button type="button" class="row-action-btn edit" data-action="edit" data-id="${supplierId}">Sửa</button>
              <button type="button" class="row-action-btn delete" data-action="delete" data-id="${supplierId}">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  supplierCrudTableShell.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã NCC</th>
          <th>Tên nhà cung cấp</th>
          <th>Số điện thoại</th>
          <th>Email</th>
          <th>Địa chỉ</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  supplierCrudMeta.textContent = `${rows.length} nhà cung cấp`;
}

function fillSupplierForm(supplier) {
  supplierForm.reset();
  supplierForm.querySelector('[name="ma_ncc"]').value = supplier.ma_ncc || "";
  supplierForm.querySelector('[name="ten_ncc"]').value = supplier.ten_ncc || "";
  supplierForm.querySelector('[name="sdt"]').value = supplier.sdt || "";
  supplierForm.querySelector('[name="email"]').value = supplier.email || "";
  supplierForm.querySelector('[name="dia_chi"]').value = supplier.dia_chi || "";
}

async function loadSupplierCrudList() {
  supplierCrudMeta.textContent = "Đang tải danh sách nhà cung cấp...";
  supplierCrudTableShell.innerHTML = '<p class="loading-message">Đang tải danh sách nhà cung cấp...</p>';

  try {
    const query = buildQueryString({ keyword: supplierSearchInput.value });
    const rows = await fetchJson(`/api/suppliers${query}`);
    renderSupplierCrudTable(rows);
  } catch (error) {
    supplierCrudMeta.textContent = "Lỗi tải dữ liệu";
    supplierCrudTableShell.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
  }
}

async function startEditSupplier(supplierId) {
  try {
    const supplier = await fetchJson(`/api/suppliers/${encodeURIComponent(supplierId)}`);
    state.editingSupplierId = supplier.ma_ncc;
    fillSupplierForm(supplier);
    setSupplierFormMode("edit");
    setMessage(supplierFormMessage, `Đang chỉnh sửa nhà cung cấp ${supplier.ma_ncc}`, "loading");
    setActiveView("suppliers");
    supplierForm.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    setMessage(supplierFormMessage, error.message, "error");
  }
}

async function removeSupplier(supplierId) {
  const accepted = window.confirm(
    `Bạn có chắc muốn xóa nhà cung cấp ${supplierId}?\n` +
      "Thao tác này sẽ xóa cả liên kết phân phối theo chi nhánh."
  );
  if (!accepted) {
    return;
  }

  try {
    await sendJson(`/api/suppliers/${encodeURIComponent(supplierId)}?force=true`, "DELETE");
    setMessage(supplierFormMessage, "Xóa nhà cung cấp thành công.", "ok");
    await Promise.all([loadSummary(), loadSupplierCrudList(), loadReportsOverview()]);

    if (state.editingSupplierId === supplierId) {
      supplierForm.reset();
      setSupplierFormMode("create");
    }
  } catch (error) {
    setMessage(supplierFormMessage, error.message, "error");
  }
}

function populateSelect(selectElement, items, valueKey, labelBuilder, defaultLabel) {
  const options = [`<option value="">${defaultLabel}</option>`];

  items.forEach((item) => {
    const value = escapeHtml(item[valueKey]);
    options.push(`<option value="${value}">${escapeHtml(labelBuilder(item))}</option>`);
  });

  selectElement.innerHTML = options.join("");
}

function renderBorrowMemberCard(member) {
  const status = member.tinh_trang_the || "Không rõ";
  const locked = Boolean(member.is_locked);

  borrowMemberCard.classList.remove("hidden", "error", "ok");
  borrowMemberCard.classList.add(locked ? "error" : "ok");
  borrowMemberCard.innerHTML = `
    <p><strong>Thành viên:</strong> ${escapeHtml(member.ma_thanh_vien)} - ${escapeHtml(member.ho_ten || "")}</p>
    <p><strong>Tình trạng thẻ:</strong> ${escapeHtml(status)}</p>
    <p><strong>Sách đang mượn:</strong> ${escapeHtml(member.so_sach_dang_muon ?? 0)}</p>
    ${locked ? '<p class="lookup-warn">Thẻ đang bị khóa. Không thể lập phiếu mượn.</p>' : '<p class="lookup-ok">Thẻ hợp lệ, có thể mượn sách.</p>'}
  `;
}

function renderBorrowCopyCard(copy) {
  const available = Number(copy.is_available) === 1;

  borrowCopyCard.classList.remove("hidden", "error", "ok");
  borrowCopyCard.classList.add(available ? "ok" : "error");
  borrowCopyCard.innerHTML = `
    <p><strong>Bản sao:</strong> ${escapeHtml(copy.ma_sach)} - ${escapeHtml(copy.ten_sach || "")} (Copy ${escapeHtml(copy.copy_no)})</p>
    <p><strong>Chi nhánh:</strong> ${escapeHtml(copy.ma_chi_nhanh || "N/A")}</p>
    <p><strong>Tình trạng mượn:</strong> ${escapeHtml(copy.tinh_trang_muon || "Chưa mượn")}</p>
    ${available ? '<p class="lookup-ok">Bản sao sẵn sàng để mượn.</p>' : '<p class="lookup-warn">Bản sao này đang được mượn hoặc chưa sẵn sàng.</p>'}
  `;
}

async function lookupBorrowMember() {
  const memberCode = String(borrowMemberCodeInput.value || "").trim();

  if (!memberCode) {
    setMessage(borrowFormMessage, "Vui lòng nhập mã thành viên trước khi kiểm tra.", "error");
    return;
  }

  setMessage(borrowFormMessage, "Đang kiểm tra mã thành viên...", "loading");

  try {
    const member = await fetchJson(`/api/lookups/members/${encodeURIComponent(memberCode)}`);
    state.borrowCurrentMember = member;
    renderBorrowMemberCard(member);

    if (member.is_locked) {
      setMessage(borrowFormMessage, "Thẻ thành viên đang bị khóa.", "error");
      return;
    }

    setMessage(borrowFormMessage, "Mã thành viên hợp lệ.", "ok");
  } catch (error) {
    state.borrowCurrentMember = null;
    borrowMemberCard.classList.add("hidden");
    setMessage(borrowFormMessage, error.message, "error");
  }
}

async function lookupBorrowCopy() {
  const maSach = String(borrowBookCodeInput.value || "").trim();
  const copyNo = Number(String(borrowCopyNoInput.value || "").trim());

  if (!maSach || !Number.isInteger(copyNo) || copyNo <= 0) {
    setMessage(borrowFormMessage, "Vui lòng nhập mã sách và copy no hợp lệ.", "error");
    return;
  }

  setMessage(borrowFormMessage, "Đang kiểm tra bản sao sách...", "loading");

  try {
    const query = buildQueryString({ ma_sach: maSach, copy_no: copyNo });
    const copy = await fetchJson(`/api/lookups/book-copy${query}`);
    state.borrowCurrentCopy = copy;
    renderBorrowCopyCard(copy);

    if (Number(copy.is_available) !== 1) {
      setMessage(borrowFormMessage, "Bản sao sách hiện không khả dụng để mượn.", "error");
      return;
    }

    setMessage(borrowFormMessage, "Bản sao sách hợp lệ.", "ok");
  } catch (error) {
    state.borrowCurrentCopy = null;
    borrowCopyCard.classList.add("hidden");
    setMessage(borrowFormMessage, error.message, "error");
  }
}

async function loadBorrowLookups() {
  setMessage(borrowFormMessage, "Đang đồng bộ thủ thư đăng nhập và dữ liệu quét...", "loading");

  state.borrowCurrentMember = null;
  state.borrowCurrentCopy = null;
  borrowMemberCard.classList.add("hidden");
  borrowCopyCard.classList.add("hidden");
  borrowDateInput.value = getTodayInputValue();

  if (!borrowDueDateInput.value) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    const year = dueDate.getFullYear();
    const month = String(dueDate.getMonth() + 1).padStart(2, "0");
    const day = String(dueDate.getDate()).padStart(2, "0");
    borrowDueDateInput.value = `${year}-${month}-${day}`;
  }

  try {
    const [librarians, currentLibrarian] = await Promise.all([
      fetchJson("/api/lookups/librarians"),
      fetchJson("/api/session/current-librarian")
    ]);

    populateSelect(
      borrowEditLibrarianSelect,
      librarians,
      "ma_thu_thu",
      (item) => `${item.ma_thu_thu} - ${item.ho_ten}`,
      "Chọn thủ thư"
    );

    state.currentLibrarian = currentLibrarian;
    borrowLibrarianInput.value = currentLibrarian.ma_thu_thu || "";
    borrowLibrarianDisplay.value = `${currentLibrarian.ma_thu_thu || ""} - ${currentLibrarian.ho_ten || ""}`;

    setMessage(borrowFormMessage, `Sẵn sàng quét mã. Thủ thư hiện tại: ${currentLibrarian.ma_thu_thu || "N/A"}.`, "ok");
  } catch (error) {
    setMessage(borrowFormMessage, error.message, "error");
  }
}

function renderBorrowCrudTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    borrowCrudMeta.textContent = "0 phiếu mượn";
    borrowCrudTableShell.innerHTML = '<p class="empty-message">Chưa có phiếu mượn nào.</p>';
    return;
  }

  const bodyHtml = rows
    .map((row) => {
      const maThanhVien = escapeHtml(row.ma_thanh_vien || "");
      const maSach = escapeHtml(row.ma_sach || "");
      const copyNo = escapeHtml(row.copy_no ?? "");
      const ngayMuon = toDateInputValue(row.ngay_muon);
      const ngayHenTra = toDateInputValue(row.ngay_hen_tra);
      const ngayTra = toDateInputValue(row.ngay_tra);
      const maThuThu = escapeHtml(row.ma_thu_thu || "");
      const trangThai = escapeHtml(row.trang_thai || "Đang mượn");
      const trangThaiHienThi = String(row.trang_thai_hien_thi || row.trang_thai || "Đang mượn");
      const ghiChu = escapeHtml(row.ghi_chu || "");
      const soNgayQuaHan = Number(row.so_ngay_qua_han || 0);
      const tienPhat = Number(row.tien_phat || 0);
      const canConfirmReturn = !ngayTra && String(row.trang_thai || "") !== "Đã trả";

      return `
        <tr>
          <td>${maThanhVien}</td>
          <td>${escapeHtml(row.ten_thanh_vien || "")}</td>
          <td>${maSach}</td>
          <td>${escapeHtml(row.ten_sach || "")}</td>
          <td>${copyNo}</td>
          <td>${escapeHtml(formatValue(row.ngay_muon))}</td>
          <td>${escapeHtml(formatValue(row.ngay_hen_tra))}</td>
          <td>${escapeHtml(formatValue(row.ngay_tra))}</td>
          <td>${getBorrowStatusChip(trangThaiHienThi)}</td>
          <td>${soNgayQuaHan > 0 ? escapeHtml(soNgayQuaHan) : "0"}</td>
          <td>${escapeHtml(formatCurrency(tienPhat))}</td>
          <td>${escapeHtml(row.ten_thu_thu || "")}</td>
          <td>
            <div class="table-row-actions">
              ${
                canConfirmReturn
                  ? `<button
                       type="button"
                       class="row-action-btn return borrow-return-btn"
                       data-ma-thanh-vien="${maThanhVien}"
                       data-ma-sach="${maSach}"
                       data-copy-no="${copyNo}"
                       data-ngay-muon="${escapeHtml(ngayMuon)}"
                     >Xác nhận trả</button>`
                  : ""
              }
              <button
                type="button"
                class="row-action-btn edit borrow-edit-btn"
                data-ma-thanh-vien="${maThanhVien}"
                data-ma-sach="${maSach}"
                data-copy-no="${copyNo}"
                data-ngay-muon="${escapeHtml(ngayMuon)}"
                data-ma-thu-thu="${maThuThu}"
                data-ngay-hen-tra="${escapeHtml(ngayHenTra)}"
                data-ngay-tra="${escapeHtml(ngayTra)}"
                data-trang-thai="${trangThai}"
                data-ghi-chu="${ghiChu}"
              >Sửa</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  borrowCrudTableShell.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã TV</th>
          <th>Thành viên</th>
          <th>Mã sách</th>
          <th>Tên sách</th>
          <th>Copy</th>
          <th>Ngày mượn</th>
          <th>Hẹn trả</th>
          <th>Ngày trả</th>
          <th>Trạng thái</th>
          <th>Ngày quá hạn</th>
          <th>Tiền phạt</th>
          <th>Thủ thư</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  borrowCrudMeta.textContent = `${rows.length} phiếu mượn gần nhất`;
}

async function loadBorrowCrudList() {
  borrowCrudMeta.textContent = "Đang tải danh sách phiếu mượn...";
  borrowCrudTableShell.innerHTML = '<p class="loading-message">Đang tải danh sách phiếu mượn...</p>';

  try {
    const query = buildQueryString({
      keyword: borrowSearchInput.value,
      status: borrowStatusFilter.value
    });

    const rows = await fetchJson(`/api/reports/borrow-list${query}`);
    renderBorrowCrudTable((rows || []).slice(0, 20));
  } catch (error) {
    borrowCrudMeta.textContent = "Lỗi tải dữ liệu";
    borrowCrudTableShell.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
  }
}

function startEditBorrowFromButton(button) {
  const maThanhVien = button.getAttribute("data-ma-thanh-vien") || "";
  const maSach = button.getAttribute("data-ma-sach") || "";
  const copyNo = button.getAttribute("data-copy-no") || "";
  const ngayMuon = button.getAttribute("data-ngay-muon") || "";
  const maThuThu = button.getAttribute("data-ma-thu-thu") || "";
  const ngayHenTra = button.getAttribute("data-ngay-hen-tra") || "";
  const ngayTra = button.getAttribute("data-ngay-tra") || "";
  const trangThai = button.getAttribute("data-trang-thai") || "Đang mượn";
  const ghiChu = button.getAttribute("data-ghi-chu") || "";

  state.editingBorrowKey = {
    ma_thanh_vien: maThanhVien,
    ma_sach: maSach,
    copy_no: Number(copyNo),
    ngay_muon: ngayMuon
  };

  borrowEditForm.querySelector('[name="ma_thanh_vien"]').value = maThanhVien;
  borrowEditForm.querySelector('[name="ma_sach"]').value = maSach;
  borrowEditForm.querySelector('[name="copy_no"]').value = copyNo;
  borrowEditForm.querySelector('[name="ngay_muon"]').value = ngayMuon;
  borrowEditForm.querySelector('[name="ma_thu_thu"]').value = maThuThu;
  borrowEditForm.querySelector('[name="ngay_hen_tra"]').value = ngayHenTra;
  borrowEditForm.querySelector('[name="ngay_tra"]').value = ngayTra;
  borrowEditForm.querySelector('[name="trang_thai"]').value = trangThai;
  borrowEditForm.querySelector('[name="ghi_chu"]').value = ghiChu;

  setBorrowEditMode("edit");
  setMessage(borrowEditMessage, `Đang sửa phiếu mượn ${maThanhVien} - ${maSach} copy ${copyNo}`, "loading");
  borrowEditPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function confirmReturnBorrowFromButton(button) {
  const maThanhVien = button.getAttribute("data-ma-thanh-vien") || "";
  const maSach = button.getAttribute("data-ma-sach") || "";
  const copyNo = Number(button.getAttribute("data-copy-no") || "");
  const ngayMuon = button.getAttribute("data-ngay-muon") || "";

  if (!maThanhVien || !maSach || !Number.isInteger(copyNo) || !ngayMuon) {
    setMessage(borrowFormMessage, "Không xác định được phiếu mượn cần trả.", "error");
    return;
  }

  const accepted = window.confirm(`Xác nhận trả sách ${maSach} - Copy ${copyNo} cho thành viên ${maThanhVien}?`);
  if (!accepted) {
    return;
  }

  setMessage(borrowFormMessage, "Đang xác nhận trả sách...", "loading");

  try {
    const response = await sendJson("/api/borrows/return", "POST", {
      ma_thanh_vien: maThanhVien,
      ma_sach: maSach,
      copy_no: copyNo,
      ngay_muon: ngayMuon,
      ma_thu_thu: state.currentLibrarian ? state.currentLibrarian.ma_thu_thu : undefined
    });

    if (response && response.data && Number(response.data.tien_phat || 0) > 0) {
      setMessage(
        borrowFormMessage,
        `Đã trả sách. Quá hạn ${response.data.so_ngay_qua_han} ngày, tiền phạt ${formatCurrency(response.data.tien_phat)}.`,
        "ok"
      );
    } else {
      setMessage(borrowFormMessage, "Đã xác nhận trả sách thành công.", "ok");
    }

    await Promise.all([loadSummary(), loadBorrowLookups(), loadBorrowCrudList(), loadBookCopyCrudList(), loadReportsOverview()]);
    runReport("borrow-list");
  } catch (error) {
    setMessage(borrowFormMessage, error.message, "error");
  }
}

async function updateBorrowRecord() {
  if (!state.editingBorrowKey) {
    setMessage(borrowEditMessage, "Chưa chọn phiếu mượn để cập nhật.", "error");
    return;
  }

  const payload = getPayloadFromForm(borrowEditForm);
  payload.copy_no = Number(payload.copy_no);

  if (payload.trang_thai === "Đã trả" && !payload.ngay_tra) {
    setMessage(borrowEditMessage, "Vui lòng nhập ngày trả khi trạng thái là Đã trả.", "error");
    return;
  }

  borrowEditSubmitBtn.disabled = true;
  setMessage(borrowEditMessage, "Đang cập nhật phiếu mượn...", "loading");

  try {
    await sendJson("/api/borrows/update", "PUT", payload);
    setMessage(borrowEditMessage, "Đã cập nhật phiếu mượn thành công.", "ok");
    await Promise.all([loadSummary(), loadBorrowLookups(), loadBorrowCrudList(), loadBookCopyCrudList(), loadReportsOverview()]);
    runReport("borrow-list");
    setBorrowEditMode("create");
  } catch (error) {
    setMessage(borrowEditMessage, error.message, "error");
  } finally {
    borrowEditSubmitBtn.disabled = false;
  }
}

function getPayloadFromForm(form) {
  const formData = new FormData(form);
  const payload = {};

  Array.from(formData.entries()).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (normalized) {
      payload[key] = normalized;
    }
  });

  return payload;
}

function getBookPayloadFromForm() {
  const payload = getPayloadFromForm(bookForm);

  payload.ma_sach = payload.ma_sach || bookIdInput.value.trim();

  if (payload.nam_xb) {
    payload.nam_xb = Number(payload.nam_xb);
  }

  if (payload.so_trang) {
    payload.so_trang = Number(payload.so_trang);
  }

  if (payload.gia_tri) {
    payload.gia_tri = Number(payload.gia_tri);
  }

  if (payload.so_ban_sao !== undefined) {
    payload.so_ban_sao = Number(payload.so_ban_sao);
  }

  return payload;
}

function getBookCopyBatchPayloadFromForm() {
  const formData = new FormData(bookCopyForm);
  const payload = {
    ma_sach: String(formData.get("ma_sach") || "").trim(),
    so_luong: Number(formData.get("so_luong") || 0),
    ma_chi_nhanh: String(formData.get("ma_chi_nhanh") || "").trim(),
    tinh_trang_muon: String(formData.get("tinh_trang_muon") || "").trim() || "Chưa mượn",
    tinh_trang_vat_ly: String(formData.get("tinh_trang_vat_ly") || "").trim() || "Tốt",
    ngay_nhap: String(formData.get("ngay_nhap") || "").trim(),
    ghi_chu: String(formData.get("ghi_chu") || "").trim()
  };

  if (!payload.ngay_nhap) delete payload.ngay_nhap;
  if (!payload.ghi_chu) delete payload.ghi_chu;

  return payload;
}

function getBookCopyUpdatePayloadFromForm() {
  const formData = new FormData(bookCopyForm);
  const payload = {
    ma_chi_nhanh: String(formData.get("ma_chi_nhanh") || "").trim(),
    tinh_trang_muon: String(formData.get("tinh_trang_muon") || "").trim(),
    tinh_trang_vat_ly: String(formData.get("tinh_trang_vat_ly") || "").trim(),
    ngay_nhap: String(formData.get("ngay_nhap") || "").trim(),
    ghi_chu: String(formData.get("ghi_chu") || "").trim()
  };

  if (!payload.ngay_nhap) {
    delete payload.ngay_nhap;
  }

  return payload;
}

function fillBookCopyForm(copy) {
  bookCopyForm.reset();
  bookCopyBookIdInput.value = copy.ma_sach || "";
  bookCopyNoInput.value = String(copy.copy_no ?? "");
  bookCopyQuantityInput.value = "1";
  bookCopyBranchInputForm.value = copy.ma_chi_nhanh || "";
  bookCopyImportDateInput.value = copy.ngay_nhap ? String(copy.ngay_nhap).slice(0, 10) : "";
  bookCopyNoteInput.value = copy.ghi_chu || "";
  ensureSelectValue(bookCopyBorrowStatusInput, copy.tinh_trang_muon || "Chưa mượn", "Chưa mượn");
  ensureSelectValue(bookCopyPhysicalStatusInput, copy.tinh_trang_vat_ly || "Tốt", "Tốt");
}

function renderBookCopyCrudTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    bookCopyCrudTableShell.innerHTML = '<p class="empty-message">Không có bản sao phù hợp với bộ lọc.</p>';
    bookCopyCrudMeta.textContent = "0 bản sao";
    return;
  }

  const bodyHtml = rows
    .map((copy) => {
      const maSach = escapeHtml(copy.ma_sach || "");
      const tenSach = escapeHtml(copy.ten_sach || "");
      const copyNo = escapeHtml(copy.copy_no ?? "");
      const maChiNhanh = escapeHtml(copy.ma_chi_nhanh || "");
      const tinhTrangMuon = escapeHtml(copy.tinh_trang_muon || "");
      const tinhTrangVatLy = escapeHtml(copy.tinh_trang_vat_ly || "");
      const ngayNhap = toDateInputValue(copy.ngay_nhap);
      const ghiChu = escapeHtml(copy.ghi_chu || "");

      return `
        <tr>
          <td>${maSach}</td>
          <td>${tenSach}</td>
          <td>${copyNo}</td>
          <td>${maChiNhanh}</td>
          <td>${tinhTrangMuon}</td>
          <td>${tinhTrangVatLy}</td>
          <td>${escapeHtml(formatValue(copy.ngay_nhap))}</td>
          <td>${ghiChu}</td>
          <td>
            <button
              type="button"
              class="row-action-btn edit book-copy-edit-btn"
              data-ma-sach="${maSach}"
              data-copy-no="${copyNo}"
              data-ma-chi-nhanh="${maChiNhanh}"
              data-tinh-trang-muon="${tinhTrangMuon}"
              data-tinh-trang-vat-ly="${tinhTrangVatLy}"
              data-ngay-nhap="${escapeHtml(ngayNhap)}"
              data-ghi-chu="${ghiChu}"
            >Sửa</button>
          </td>
        </tr>
      `;
    })
    .join("");

  bookCopyCrudTableShell.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã sách</th>
          <th>Tên sách</th>
          <th>Copy</th>
          <th>Chi nhánh</th>
          <th>Tình trạng mượn</th>
          <th>Tình trạng vật lý</th>
          <th>Ngày nhập</th>
          <th>Ghi chú</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  bookCopyCrudMeta.textContent = `${rows.length} bản sao`;
}

async function loadBookCopyCrudList() {
  bookCopyCrudMeta.textContent = "Đang tải danh sách bản sao...";
  bookCopyCrudTableShell.innerHTML = '<p class="loading-message">Đang tải danh sách bản sao...</p>';

  try {
    const query = buildQueryString({
      keyword: bookCopySearchInput.value,
      ma_chi_nhanh: bookCopyBranchFilter.value,
      tinh_trang_muon: bookCopyBorrowStatusFilter.value,
      tinh_trang_vat_ly: bookCopyPhysicalStatusFilter.value
    });

    const rows = await fetchJson(`/api/book-copies${query}`);
    renderBookCopyCrudTable(rows);
  } catch (error) {
    bookCopyCrudMeta.textContent = "Lỗi tải dữ liệu";
    bookCopyCrudTableShell.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
  }
}

function startEditBookCopyFromButton(button) {
  const maSach = button.getAttribute("data-ma-sach") || "";
  const copyNo = button.getAttribute("data-copy-no") || "";

  if (!maSach || !copyNo) {
    setMessage(bookCopyFormMessage, "Không thể xác định bản sao để chỉnh sửa.", "error");
    return;
  }

  state.editingBookCopyKey = {
    ma_sach: maSach,
    copy_no: Number(copyNo)
  };

  fillBookCopyForm({
    ma_sach: maSach,
    copy_no: copyNo,
    ma_chi_nhanh: button.getAttribute("data-ma-chi-nhanh") || "",
    tinh_trang_muon: button.getAttribute("data-tinh-trang-muon") || "Chưa mượn",
    tinh_trang_vat_ly: button.getAttribute("data-tinh-trang-vat-ly") || "Tốt",
    ngay_nhap: button.getAttribute("data-ngay-nhap") || "",
    ghi_chu: button.getAttribute("data-ghi-chu") || ""
  });

  setBookCopyFormMode("edit");
  setMessage(bookCopyFormMessage, `Đang chỉnh sửa bản sao ${maSach} - Copy ${copyNo}`, "loading");
  bookCopyForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function fillBookForm(book) {
  bookForm.reset();
  bookForm.querySelector('[name="ma_sach"]').value = book.ma_sach || "";
  bookForm.querySelector('[name="ten_sach"]').value = book.ten_sach || "";
  bookForm.querySelector('[name="tac_gia"]').value = book.tac_gia || "";
  bookForm.querySelector('[name="nha_xb"]').value = book.nha_xb || "";
  bookForm.querySelector('[name="nam_xb"]').value = book.nam_xb ?? "";
  bookForm.querySelector('[name="so_trang"]').value = book.so_trang ?? "";
  bookForm.querySelector('[name="gia_tri"]').value = book.gia_tri ?? "";
  bookForm.querySelector('[name="so_ban_sao"]').value = String(book.tong_ban_sao ?? 0);
  bookForm.querySelector('[name="ma_chi_nhanh"]').value = book.ma_chi_nhanh_mac_dinh || "";
}

function renderBookCrudTable(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    bookCrudTableShell.innerHTML = '<p class="empty-message">Không có sách phù hợp với bộ lọc.</p>';
    bookCrudMeta.textContent = "0 sách";
    return;
  }

  const bodyHtml = rows
    .map((book) => {
      const bookId = escapeHtml(book.ma_sach || "");
      return `
        <tr>
          <td>${bookId}</td>
          <td>${escapeHtml(book.ten_sach || "")}</td>
          <td>${escapeHtml(book.tac_gia || "")}</td>
          <td>${escapeHtml(book.nha_xb || "")}</td>
          <td>${escapeHtml(book.nam_xb ?? "")}</td>
          <td>${escapeHtml(book.so_trang ?? "")}</td>
          <td>${escapeHtml(book.gia_tri ?? "")}</td>
          <td>${escapeHtml(book.tong_ban_sao ?? 0)}</td>
          <td>
            <div class="table-row-actions">
              <button type="button" class="row-action-btn edit" data-action="edit" data-id="${bookId}">Sửa</button>
              <button type="button" class="row-action-btn delete" data-action="delete" data-id="${bookId}">Xóa</button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  bookCrudTableShell.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Mã sách</th>
          <th>Tên sách</th>
          <th>Tác giả</th>
          <th>Nhà xuất bản</th>
          <th>Năm XB</th>
          <th>Số trang</th>
          <th>Giá trị</th>
          <th>Bản sao</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${bodyHtml}
      </tbody>
    </table>
  `;

  bookCrudMeta.textContent = `${rows.length} sách`;
}

async function loadBookCrudList() {
  bookCrudMeta.textContent = "Đang tải danh sách sách...";
  bookCrudTableShell.innerHTML = '<p class="loading-message">Đang tải danh sách sách...</p>';

  try {
    const query = buildQueryString({
      keyword: bookSearchInput.value,
      year: bookYearFilter.value
    });

    const rows = await fetchJson(`/api/books${query}`);
    renderBookCrudTable(rows);
  } catch (error) {
    bookCrudMeta.textContent = "Lỗi tải dữ liệu";
    bookCrudTableShell.innerHTML = `<p class="error-message">${escapeHtml(error.message)}</p>`;
  }
}

async function startEditBook(bookId) {
  try {
    const book = await fetchJson(`/api/books/${encodeURIComponent(bookId)}`);
    state.editingBookId = book.ma_sach;
    fillBookForm(book);
    setBookFormMode("edit");
    setMessage(bookFormMessage, `Đang chỉnh sửa sách ${book.ma_sach}`, "loading");
    setActiveView("books");
    bookForm.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    setMessage(bookFormMessage, error.message, "error");
  }
}

async function removeBook(bookId) {
  const accepted = window.confirm(`Bạn có chắc muốn xóa sách ${bookId}?`);
  if (!accepted) {
    return;
  }

  try {
    await sendJson(`/api/books/${encodeURIComponent(bookId)}`, "DELETE");
    setMessage(bookFormMessage, "Xóa sách thành công.", "ok");
    await Promise.all([loadSummary(), loadBookCrudList(), loadBookCopyCrudList(), loadBorrowLookups(), loadReportsOverview()]);

    if (state.editingBookId === bookId) {
      bookForm.reset();
      setBookFormMode("create");
    }
  } catch (error) {
    setMessage(bookFormMessage, error.message, "error");
  }
}

function bindEvents() {
  sidebarNav.addEventListener("click", (event) => {
    const button = event.target.closest(".side-link");
    if (!button) {
      return;
    }

    setActiveView(button.dataset.view);
  });

  dateFilterForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runReport("shifts");
  });

  memberForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getMemberPayloadFromForm();

    if (!payload.ma_thanh_vien || !payload.ho_ten) {
      setMessage(memberFormMessage, "Vui lòng nhập mã thành viên và họ tên.", "error");
      return;
    }

    memberSubmitBtn.disabled = true;
    setMessage(memberFormMessage, "Đang lưu thành viên...", "loading");

    try {
      if (state.editingMemberId) {
        await sendJson(`/api/members/${encodeURIComponent(state.editingMemberId)}`, "PUT", payload);
        setMessage(memberFormMessage, "Đã cập nhật thành viên thành công.", "ok");
      } else {
        await sendJson("/api/members", "POST", payload);
        setMessage(memberFormMessage, "Đã thêm thành viên thành công.", "ok");
      }

      memberForm.reset();
      setMemberFormMode("create");
      await Promise.all([loadSummary(), loadMemberCrudList(), loadReportsOverview()]);
      runReport("borrow-list");
    } catch (error) {
      setMessage(memberFormMessage, error.message, "error");
    } finally {
      memberSubmitBtn.disabled = false;
    }
  });

  memberCancelEditBtn.addEventListener("click", () => {
    memberForm.reset();
    setMemberFormMode("create");
    setMessage(memberFormMessage, "Đã hủy chế độ chỉnh sửa.");
  });

  memberSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadMemberCrudList();
  });

  memberResetFilterBtn.addEventListener("click", () => {
    memberSearchForm.reset();
    loadMemberCrudList();
  });

  memberCrudTableShell.addEventListener("click", (event) => {
    const actionButton = event.target.closest(".row-action-btn");
    if (!actionButton) {
      return;
    }

    const memberId = actionButton.dataset.id;
    const action = actionButton.dataset.action;

    if (action === "edit") {
      startEditMember(memberId);
      return;
    }

    if (action === "delete") {
      removeMember(memberId);
    }
  });

  bookForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getBookPayloadFromForm();

    if (!payload.ma_sach || !payload.ten_sach) {
      setMessage(bookFormMessage, "Vui lòng nhập mã sách và tên sách.", "error");
      return;
    }

    if (Number.isInteger(payload.so_ban_sao) && payload.so_ban_sao > 0 && !payload.ma_chi_nhanh) {
      setMessage(bookFormMessage, "Vui lòng nhập mã chi nhánh khi số bản sao lớn hơn 0.", "error");
      return;
    }

    bookSubmitBtn.disabled = true;
    setMessage(bookFormMessage, state.editingBookId ? "Đang cập nhật sách..." : "Đang Sách...", "loading");

    try {
      if (state.editingBookId) {
        await sendJson(`/api/books/${encodeURIComponent(state.editingBookId)}`, "PUT", payload);
        setMessage(bookFormMessage, "Đã cập nhật sách thành công.", "ok");
      } else {
        await sendJson("/api/books", "POST", payload);
        setMessage(bookFormMessage, "Đã Sách thành công.", "ok");
      }

      bookForm.reset();
      setBookFormMode("create");
      await Promise.all([loadSummary(), loadBookCrudList(), loadBookCopyCrudList(), loadBorrowLookups(), loadReportsOverview()]);
    } catch (error) {
      setMessage(bookFormMessage, error.message, "error");
    } finally {
      bookSubmitBtn.disabled = false;
    }
  });

  bookCancelEditBtn.addEventListener("click", () => {
    bookForm.reset();
    setBookFormMode("create");
    setMessage(bookFormMessage, "Đã hủy chế độ chỉnh sửa.");
  });

  bookSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadBookCrudList();
  });

  bookResetFilterBtn.addEventListener("click", () => {
    bookSearchForm.reset();
    loadBookCrudList();
  });

  bookCrudTableShell.addEventListener("click", (event) => {
    const actionButton = event.target.closest(".row-action-btn");
    if (!actionButton) {
      return;
    }

    const bookId = actionButton.dataset.id;
    const action = actionButton.dataset.action;

    if (action === "edit") {
      startEditBook(bookId);
      return;
    }

    if (action === "delete") {
      removeBook(bookId);
    }
  });

  bookCopyForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (state.editingBookCopyKey) {
      const payload = getBookCopyUpdatePayloadFromForm();

      if (!payload.ma_chi_nhanh) {
        setMessage(bookCopyFormMessage, "Vui lòng nhập mã chi nhánh cho bản sao.", "error");
        return;
      }

      bookCopySubmitBtn.disabled = true;
      setMessage(bookCopyFormMessage, "Đang cập nhật bản sao...", "loading");

      try {
        await sendJson(
          `/api/book-copies/${encodeURIComponent(state.editingBookCopyKey.ma_sach)}/${encodeURIComponent(
            String(state.editingBookCopyKey.copy_no)
          )}`,
          "PUT",
          payload
        );
        setMessage(bookCopyFormMessage, "Đã cập nhật bản sao thành công.", "ok");
        setBookCopyFormMode("create");
        await Promise.all([loadBookCopyCrudList(), loadBorrowLookups(), loadReportsOverview()]);
      } catch (error) {
        setMessage(bookCopyFormMessage, error.message, "error");
      } finally {
        bookCopySubmitBtn.disabled = false;
      }

      return;
    }

    const payload = getBookCopyBatchPayloadFromForm();

    if (!payload.ma_sach || !payload.ma_chi_nhanh) {
      setMessage(bookCopyFormMessage, "Vui lòng nhập mã sách và mã chi nhánh.", "error");
      return;
    }

    if (!Number.isInteger(payload.so_luong) || payload.so_luong <= 0) {
      setMessage(bookCopyFormMessage, "Số lượng thêm phải là số nguyên dương.", "error");
      return;
    }

    bookCopySubmitBtn.disabled = true;
    setMessage(bookCopyFormMessage, "Đang thêm bản sao theo lô...", "loading");

    try {
      const response = await sendJson("/api/book-copies/batch", "POST", payload);
      const createdCount = Array.isArray(response.data) ? response.data.length : payload.so_luong;
      setMessage(bookCopyFormMessage, `Đã thêm ${createdCount} bản sao thành công.`, "ok");
      setBookCopyFormMode("create");
      await Promise.all([loadSummary(), loadBookCrudList(), loadBookCopyCrudList(), loadBorrowLookups(), loadReportsOverview()]);
    } catch (error) {
      setMessage(bookCopyFormMessage, error.message, "error");
    } finally {
      bookCopySubmitBtn.disabled = false;
    }
  });

  bookCopyCancelEditBtn.addEventListener("click", () => {
    setBookCopyFormMode("create");
    setMessage(bookCopyFormMessage, "Đã hủy chế độ chỉnh sửa.");
  });

  bookCopySearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadBookCopyCrudList();
  });

  bookCopyResetFilterBtn.addEventListener("click", () => {
    bookCopySearchForm.reset();
    loadBookCopyCrudList();
  });

  bookCopyCrudTableShell.addEventListener("click", (event) => {
    const editButton = event.target.closest(".book-copy-edit-btn");
    if (!editButton) {
      return;
    }

    startEditBookCopyFromButton(editButton);
  });

  supplierForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getPayloadFromForm(supplierForm);

    if (!payload.ma_ncc || !payload.ten_ncc) {
      setMessage(supplierFormMessage, "Vui lòng nhập mã và tên nhà cung cấp.", "error");
      return;
    }

    supplierSubmitBtn.disabled = true;
    setMessage(supplierFormMessage, state.editingSupplierId ? "Đang cập nhật nhà cung cấp..." : "Đang thêm nhà cung cấp...", "loading");

    try {
      if (state.editingSupplierId) {
        await sendJson(`/api/suppliers/${encodeURIComponent(state.editingSupplierId)}`, "PUT", payload);
        setMessage(supplierFormMessage, "Đã cập nhật nhà cung cấp thành công.", "ok");
      } else {
        await sendJson("/api/suppliers", "POST", payload);
        setMessage(supplierFormMessage, "Đã thêm nhà cung cấp thành công.", "ok");
      }

      supplierForm.reset();
      setSupplierFormMode("create");
      await Promise.all([loadSummary(), loadSupplierCrudList(), loadReportsOverview()]);
    } catch (error) {
      setMessage(supplierFormMessage, error.message, "error");
    } finally {
      supplierSubmitBtn.disabled = false;
    }
  });

  supplierCancelEditBtn.addEventListener("click", () => {
    supplierForm.reset();
    setSupplierFormMode("create");
    setMessage(supplierFormMessage, "Đã hủy chế độ chỉnh sửa.");
  });

  supplierSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadSupplierCrudList();
  });

  supplierResetFilterBtn.addEventListener("click", () => {
    supplierSearchForm.reset();
    loadSupplierCrudList();
  });

  supplierCrudTableShell.addEventListener("click", (event) => {
    const actionButton = event.target.closest(".row-action-btn");
    if (!actionButton) {
      return;
    }

    const supplierId = actionButton.dataset.id;
    const action = actionButton.dataset.action;

    if (action === "edit") {
      startEditSupplier(supplierId);
      return;
    }

    if (action === "delete") {
      removeSupplier(supplierId);
    }
  });

  borrowRefreshBtn.addEventListener("click", () => {
    loadBorrowLookups();
    loadBorrowCrudList();
  });

  borrowLookupMemberBtn.addEventListener("click", () => {
    lookupBorrowMember();
  });

  borrowLookupCopyBtn.addEventListener("click", () => {
    lookupBorrowCopy();
  });

  borrowMemberCodeInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    lookupBorrowMember();
  });

  const onCopyScannerEnter = (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    lookupBorrowCopy();
  };

  borrowBookCodeInput.addEventListener("keydown", onCopyScannerEnter);
  borrowCopyNoInput.addEventListener("keydown", onCopyScannerEnter);

  borrowMemberCodeInput.addEventListener("change", () => {
    state.borrowCurrentMember = null;
    borrowMemberCard.classList.add("hidden");
  });

  borrowBookCodeInput.addEventListener("change", () => {
    state.borrowCurrentCopy = null;
    borrowCopyCard.classList.add("hidden");
  });

  borrowCopyNoInput.addEventListener("change", () => {
    state.borrowCurrentCopy = null;
    borrowCopyCard.classList.add("hidden");
  });

  borrowSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    loadBorrowCrudList();
  });

  borrowResetFilterBtn.addEventListener("click", () => {
    borrowSearchForm.reset();
    loadBorrowCrudList();
  });

  borrowCrudTableShell.addEventListener("click", (event) => {
    const returnButton = event.target.closest(".borrow-return-btn");
    if (returnButton) {
      confirmReturnBorrowFromButton(returnButton);
      return;
    }

    const editButton = event.target.closest(".borrow-edit-btn");
    if (!editButton) {
      return;
    }

    startEditBorrowFromButton(editButton);
  });

  borrowEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await updateBorrowRecord();
  });

  borrowEditCancelBtn.addEventListener("click", () => {
    setBorrowEditMode("create");
  });

  borrowForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = getPayloadFromForm(borrowForm);

    if (!state.borrowCurrentMember) {
      setMessage(borrowFormMessage, "Vui lòng kiểm tra mã thành viên trước khi lưu phiếu.", "error");
      return;
    }

    if (state.borrowCurrentMember.is_locked) {
      setMessage(borrowFormMessage, "Thẻ thành viên đang bị khóa, không thể mượn sách.", "error");
      return;
    }

    if (!state.borrowCurrentCopy || Number(state.borrowCurrentCopy.is_available) !== 1) {
      setMessage(borrowFormMessage, "Vui lòng kiểm tra bản sao sách hợp lệ trước khi lưu phiếu.", "error");
      return;
    }

    payload.ma_thanh_vien = state.borrowCurrentMember.ma_thanh_vien;
    payload.ma_sach = state.borrowCurrentCopy.ma_sach;
    payload.copy_no = Number(state.borrowCurrentCopy.copy_no);
    payload.ma_thu_thu = borrowLibrarianInput.value;
    payload.ngay_muon = borrowDateInput.value || getTodayInputValue();
    payload.ngay_hen_tra = borrowDueDateInput.value;
    delete payload.ma_thu_thu_hien_thi;

    if (!payload.ma_thanh_vien || !payload.ma_sach || !payload.ngay_muon || !payload.ngay_hen_tra) {
      setMessage(borrowFormMessage, "Vui lòng nhập đầy đủ thông tin phiếu mượn.", "error");
      return;
    }

    borrowSubmitBtn.disabled = true;
    setMessage(borrowFormMessage, "Đang lập phiếu mượn...", "loading");

    try {
      await sendJson("/api/borrows", "POST", payload);
      setMessage(borrowFormMessage, "Đã lập phiếu mượn thành công.", "ok");
      borrowForm.reset();
      borrowDateInput.value = getTodayInputValue();
      state.borrowCurrentMember = null;
      state.borrowCurrentCopy = null;
      borrowMemberCard.classList.add("hidden");
      borrowCopyCard.classList.add("hidden");
      setBorrowEditMode("create");
      await Promise.all([loadSummary(), loadBorrowLookups(), loadBorrowCrudList(), loadBookCopyCrudList(), loadReportsOverview()]);
      runReport("borrow-list");
    } catch (error) {
      setMessage(borrowFormMessage, error.message, "error");
    } finally {
      borrowSubmitBtn.disabled = false;
    }
  });
}

async function init() {
  setMemberFormMode("create");
  setBookFormMode("create");
  setBookCopyFormMode("create");
  setSupplierFormMode("create");
  setBorrowEditMode("create");
  buildReportButtons();
  bindEvents();
  setActiveView("dashboard");

  await Promise.all([
    checkConnection(),
    loadSummary(),
    loadMemberCrudList(),
    loadBookCrudList(),
    loadBookCopyCrudList(),
    loadSupplierCrudList(),
    loadBorrowLookups(),
    loadBorrowCrudList(),
    loadReportsOverview()
  ]);

  runReport("borrow-list");
}

init();
