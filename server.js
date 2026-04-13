const express = require("express");
const cors = require("cors");
const path = require("path");
const util = require("util");
require("dotenv").config();
require("dotenv").config({
  path: path.join(__dirname, ".env.example"),
  override: false
});

const authMode = (process.env.DB_AUTH_MODE || "windows").toLowerCase();
const useWindowsAuth = authMode !== "sql";
const sql = useWindowsAuth ? require("mssql/msnodesqlv8") : require("mssql");

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const dbServer = process.env.DB_SERVER || "localhost";
const dbName = process.env.DB_NAME || "QuanLyThuVien";
const dbInstance = process.env.DB_INSTANCE || "";
const dbUser = process.env.DB_USER || "sa";
const dbPassword = process.env.DB_PASSWORD || "";
const dbOdbcDriver = process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server";

const dbConfig = {
  server: dbServer,
  database: dbName,
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_CERT !== "false",
    ...(dbInstance ? { instanceName: dbInstance } : {})
  }
};

if (useWindowsAuth) {
  dbConfig.driver = "msnodesqlv8";
  dbConfig.options.trustedConnection = true;
  dbConfig.connectionString = [
    `Driver={${dbOdbcDriver}}`,
    `Server=${dbInstance ? `${dbServer}\\${dbInstance}` : dbServer}`,
    `Database=${dbName}`,
    "Trusted_Connection=Yes",
    `Encrypt=${dbConfig.options.encrypt ? "Yes" : "No"}`,
    `TrustServerCertificate=${dbConfig.options.trustServerCertificate ? "Yes" : "No"}`
  ].join(";");
} else {
  dbConfig.user = dbUser;
  dbConfig.password = dbPassword;
  dbConfig.port = Number(process.env.DB_PORT || 1433);
}

if (!process.env.DB_SERVER) {
  console.warn("DB_SERVER is missing. Using fallback: localhost");
}

if (!process.env.DB_NAME) {
  console.warn("DB_NAME is missing. Using fallback: QuanLyThuVien");
}

if (!process.env.DB_AUTH_MODE) {
  console.warn("DB_AUTH_MODE is missing. Using fallback: windows");
}

if (useWindowsAuth && !process.env.DB_ODBC_DRIVER) {
  console.warn("DB_ODBC_DRIVER is missing. Using fallback: ODBC Driver 18 for SQL Server");
}

if (!useWindowsAuth && (!process.env.DB_USER || !process.env.DB_PASSWORD || process.env.DB_PASSWORD === "your_password_here")) {
  console.warn("DB credentials look incomplete. Update DB_USER and DB_PASSWORD in .env");
}

console.log(`DB auth mode: ${useWindowsAuth ? "windows" : "sql"}`);

function getErrorDetail(error) {
  if (!error) {
    return "Unknown error";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message && error.message !== "[object Object]") {
    return error.message;
  }

  if (error.originalError) {
    return getErrorDetail(error.originalError);
  }

  return util.inspect(error, { depth: 4, breakLength: 120 });
}

let poolPromise;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        console.log("Connected to SQL Server");
        return pool;
      })
      .catch((error) => {
        poolPromise = null;
        throw error;
      });
  }

  return poolPromise;
}

async function runQuery(queryText, params = []) {
  const pool = await getPool();
  const request = pool.request();

  params.forEach((param) => {
    request.input(param.name, param.type, param.value);
  });

  const result = await request.query(queryText);
  return result.recordset;
}

app.get("/api/health", async (req, res) => {
  try {
    await runQuery("SELECT 1 AS ok");
    res.json({ status: "ok", message: "Database connected" });
  } catch (error) {
    const detail = getErrorDetail(error);
    res.status(500).json({
      status: "error",
      message: "Cannot connect to database",
      detail
    });
  }
});

app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        (SELECT COUNT(*) FROM Sach) AS tong_sach,
        (SELECT COUNT(*) FROM BanSao) AS tong_ban_sao,
        (SELECT COUNT(*) FROM ThanhVien) AS tong_thanh_vien,
        (SELECT COUNT(*) FROM ChiNhanh) AS tong_chi_nhanh,
        (SELECT COUNT(*) FROM Muon WHERE trang_thai = N'Đang mượn') AS dang_muon,
        (SELECT COUNT(*) FROM Muon WHERE ngay_hen_tra < GETDATE() AND ngay_tra IS NULL) AS qua_han
    `);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/borrow-list", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          m.ma_sach,
          s.ten_sach,
          m.copy_no,
          m.ngay_muon,
          m.ngay_hen_tra,
          m.ngay_tra,
          m.trang_thai,
          tv.ho_ten AS ten_thanh_vien,
          tt.ho_ten AS ten_thu_thu
      FROM Muon m
      JOIN Sach s ON m.ma_sach = s.ma_sach
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      JOIN ThuThu tt ON m.ma_thu_thu = tt.ma_thu_thu
      ORDER BY m.ngay_muon DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/overdue-books", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          m.ma_sach,
          s.ten_sach,
          tv.ho_ten AS thanh_vien,
          m.ngay_hen_tra,
          DATEDIFF(DAY, m.ngay_hen_tra, GETDATE()) AS so_ngay_qua_han
      FROM Muon m
      JOIN Sach s ON m.ma_sach = s.ma_sach
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      WHERE m.trang_thai = N'Đang mượn'
        AND m.ngay_hen_tra < GETDATE()
      ORDER BY so_ngay_qua_han DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/shifts", async (req, res) => {
  const month = Number(req.query.month || new Date().getMonth() + 1);
  const year = Number(req.query.year || new Date().getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
    return res.status(400).json({ message: "month/year khong hop le" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          tt.ma_thu_thu,
          tt.ho_ten,
          COUNT(cc.ma_ca_lam) AS so_ca_lam
      FROM ChamCong cc
      JOIN ThuThu tt ON cc.ma_thu_thu = tt.ma_thu_thu
      WHERE MONTH(cc.ngay_lam_viec) = @month
        AND YEAR(cc.ngay_lam_viec) = @year
      GROUP BY tt.ma_thu_thu, tt.ho_ten
      ORDER BY so_ca_lam DESC;
      `,
      [
        { name: "month", type: sql.Int, value: month },
        { name: "year", type: sql.Int, value: year }
      ]
    );

    res.json({ month, year, data: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/book-category-count", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          gt.mon_hoc AS loai_sach,
          COUNT(s.ma_sach) AS so_luong,
          N'Giáo trình' AS nhom
      FROM Sach s
      JOIN GiaoTrinh gt ON s.ma_sach = gt.ma_sach
      GROUP BY gt.mon_hoc

      UNION

      SELECT
          tt.the_loai AS loai_sach,
          COUNT(s2.ma_sach) AS so_luong,
          N'Tiểu thuyết' AS nhom
      FROM Sach s2
      JOIN TieuThuyet tt ON s2.ma_sach = tt.ma_sach
      GROUP BY tt.the_loai
      ORDER BY so_luong DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/member-borrow-count", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          tv.ma_thanh_vien,
          tv.ho_ten,
          COUNT(*) AS so_lan_muon
      FROM Muon m
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      GROUP BY tv.ma_thanh_vien, tv.ho_ten
      ORDER BY so_lan_muon DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/overdue-members", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          tv.ma_thanh_vien,
          tv.ho_ten,
          m.ma_sach,
          m.ngay_muon,
          m.ngay_hen_tra,
          DATEDIFF(DAY, m.ngay_hen_tra, GETDATE()) AS so_ngay_qua_han
      FROM Muon m
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      WHERE m.ngay_hen_tra < GETDATE()
        AND m.ngay_tra IS NULL
      ORDER BY so_ngay_qua_han DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/branch-book-count", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          cn.ma_chi_nhanh,
          cn.ten,
          COUNT(bs.ma_sach) AS tong_sach
      FROM ChiNhanh cn
      LEFT JOIN BanSao bs ON cn.ma_chi_nhanh = bs.ma_chi_nhanh
      GROUP BY cn.ma_chi_nhanh, cn.ten
      ORDER BY tong_sach DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/supplier-branch-count", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          ncc.ma_ncc,
          ncc.ten_ncc,
          COUNT(*) AS so_chi_nhanh
      FROM CungCap cc
      JOIN NhaCungCap ncc ON cc.ma_ncc = ncc.ma_ncc
      GROUP BY ncc.ma_ncc, ncc.ten_ncc
      ORDER BY so_chi_nhanh DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/top-borrower", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT TOP 1
          tv.ma_thanh_vien,
          tv.ho_ten,
          COUNT(*) AS so_sach_muon
      FROM Muon m
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      GROUP BY tv.ma_thanh_vien, tv.ho_ten
      ORDER BY so_sach_muon DESC;
    `);

    res.json(rows[0] || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/damaged-copies", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          bs.ma_sach,
          bs.copy_no,
          bs.tinh_trang_vat_ly,
          bs.ma_chi_nhanh
      FROM BanSao bs
      WHERE bs.tinh_trang_vat_ly LIKE N'%Trung bình%'
         OR bs.tinh_trang_vat_ly LIKE N'%hỏng%'
      ORDER BY bs.ma_sach, bs.copy_no;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
