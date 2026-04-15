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

function normalizeTextValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = String(value).trim();
  return trimmed || null;
}

function normalizeDateValue(value) {
  const normalized = normalizeTextValue(value);
  return normalized || null;
}

function normalizeIntValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return NaN;
  }

  return parsed;
}

function normalizeDecimalValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return NaN;
  }

  return parsed;
}

const ALLOWED_COPY_BORROW_STATUSES = new Set(["Đang mượn", "Chưa mượn"]);
const BORROW_FINE_PER_DAY = Math.max(0, Number(process.env.BORROW_FINE_PER_DAY || 5000) || 0);
const DEFAULT_LOGGED_LIBRARIAN_ID = normalizeTextValue(process.env.CURRENT_LIBRARIAN_ID);

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeStatusToken(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isMemberCardLocked(status) {
  const normalized = normalizeStatusToken(status);
  return normalized === "khoa" || normalized === "locked" || normalized.includes("bi khoa");
}

async function resolveCurrentLibrarianId(preferredLibrarianId = null) {
  const rows = await runQuery(
    `
    SELECT TOP 1 ma_thu_thu
    FROM ThuThu
    WHERE (
      @preferred_id IS NULL
      OR ma_thu_thu = @preferred_id
    )
    ORDER BY
      CASE WHEN ma_thu_thu = @preferred_id THEN 0 ELSE 1 END,
      ma_thu_thu ASC;
    `,
    [{ name: "preferred_id", type: sql.NVarChar(20), value: preferredLibrarianId }]
  );

  return rows[0] ? rows[0].ma_thu_thu : null;
}

app.get("/api/health", async (req, res) => {
  try {
    await runQuery("SELECT 1 AS ok");
    res.json({ status: "ok", message: "Kết nối cơ sở dữ liệu thành công" });
  } catch (error) {
    const detail = getErrorDetail(error);
    res.status(500).json({
      status: "error",
      message: "Không thể kết nối cơ sở dữ liệu",
      detail
    });
  }
});

app.post("/api/members", async (req, res) => {
  const maThanhVien = normalizeTextValue(req.body.ma_thanh_vien);
  const hoTen = normalizeTextValue(req.body.ho_ten);
  const sdt = normalizeTextValue(req.body.sdt);
  const diaChi = normalizeTextValue(req.body.dia_chi);
  const ngayDangKy = normalizeDateValue(req.body.ngay_dang_ky);
  const tinhTrangThe = normalizeTextValue(req.body.tinh_trang_the) || "Hoạt động";
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!maThanhVien || !hoTen) {
    return res.status(400).json({
      message: "ma_thanh_vien và ho_ten là bắt buộc"
    });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("ma_thanh_vien", sql.NVarChar(20), maThanhVien)
      .input("ho_ten", sql.NVarChar(255), hoTen)
      .input("sdt", sql.NVarChar(20), sdt)
      .input("dia_chi", sql.NVarChar(255), diaChi)
      .input("ngay_dang_ky", sql.Date, ngayDangKy || null)
      .input("tinh_trang_the", sql.NVarChar(100), tinhTrangThe || null)
      .input("ghi_chu", sql.NVarChar(255), ghiChu)
      .query(`
        INSERT INTO ThanhVien (
          ma_thanh_vien,
          ho_ten,
          sdt,
          dia_chi,
          ngay_dang_ky,
          tinh_trang_the,
          ghi_chu
        )
        VALUES (
          @ma_thanh_vien,
          @ho_ten,
          @sdt,
          @dia_chi,
          COALESCE(@ngay_dang_ky, CAST(GETDATE() AS DATE)),
          COALESCE(@tinh_trang_the, N'Hoạt động'),
          @ghi_chu
        );
      `);

    res.status(201).json({
      message: "Thêm thành viên thành công",
      data: {
        ma_thanh_vien: maThanhVien,
        ho_ten: hoTen,
        sdt,
        dia_chi: diaChi,
        ngay_dang_ky: ngayDangKy,
        tinh_trang_the: tinhTrangThe || "Hoạt động",
        ghi_chu: ghiChu
      }
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "ma_thanh_vien đã tồn tại" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/members", async (req, res) => {
  const keyword = normalizeTextValue(req.query.keyword);
  const status = normalizeTextValue(req.query.status);

  try {
    const rows = await runQuery(
      `
      SELECT
          ma_thanh_vien,
          ho_ten,
          sdt,
          dia_chi,
          ngay_dang_ky,
          tinh_trang_the,
          ghi_chu
      FROM ThanhVien
      WHERE (
          @keyword IS NULL
          OR ma_thanh_vien LIKE N'%' + @keyword + N'%'
          OR ho_ten LIKE N'%' + @keyword + N'%'
          OR ISNULL(sdt, N'') LIKE N'%' + @keyword + N'%'
      )
      AND (
          @status IS NULL
          OR tinh_trang_the = @status
      )
      ORDER BY ngay_dang_ky DESC, ma_thanh_vien DESC;
      `,
      [
        { name: "keyword", type: sql.NVarChar(255), value: keyword },
        { name: "status", type: sql.NVarChar(100), value: status }
      ]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/members/:id", async (req, res) => {
  const memberId = normalizeTextValue(req.params.id);

  if (!memberId) {
    return res.status(400).json({ message: "Mã thành viên không hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          ma_thanh_vien,
          ho_ten,
          sdt,
          dia_chi,
          ngay_dang_ky,
          tinh_trang_the,
          ghi_chu
      FROM ThanhVien
      WHERE ma_thanh_vien = @ma_thanh_vien;
      `,
      [{ name: "ma_thanh_vien", type: sql.NVarChar(20), value: memberId }]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy thành viên" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.put("/api/members/:id", async (req, res) => {
  const memberId = normalizeTextValue(req.params.id);
  const newMemberId = normalizeTextValue(req.body.ma_thanh_vien);
  const hoTen = normalizeTextValue(req.body.ho_ten);
  const sdt = normalizeTextValue(req.body.sdt);
  const diaChi = normalizeTextValue(req.body.dia_chi);
  const ngayDangKy = normalizeDateValue(req.body.ngay_dang_ky);
  const tinhTrangThe = normalizeTextValue(req.body.tinh_trang_the);
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!memberId || !newMemberId || !hoTen) {
    return res.status(400).json({
      message: "Mã thành viên và họ tên là bắt buộc"
    });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ma_thanh_vien_cu", sql.NVarChar(20), memberId)
      .input("ma_thanh_vien_moi", sql.NVarChar(20), newMemberId)
      .input("ho_ten", sql.NVarChar(255), hoTen)
      .input("sdt", sql.NVarChar(20), sdt)
      .input("dia_chi", sql.NVarChar(255), diaChi)
      .input("ngay_dang_ky", sql.Date, ngayDangKy)
      .input("tinh_trang_the", sql.NVarChar(100), tinhTrangThe)
      .input("ghi_chu", sql.NVarChar(255), ghiChu)
      .query(`
        DECLARE @affected INT = 0;

        BEGIN TRY
          BEGIN TRANSACTION;

          IF NOT EXISTS (
            SELECT 1
            FROM ThanhVien
            WHERE ma_thanh_vien = @ma_thanh_vien_cu
          )
          BEGIN
            THROW 50001, N'MEMBER_NOT_FOUND', 1;
          END

          IF @ma_thanh_vien_cu <> @ma_thanh_vien_moi
          BEGIN
            IF EXISTS (
              SELECT 1
              FROM ThanhVien
              WHERE ma_thanh_vien = @ma_thanh_vien_moi
            )
            BEGIN
              THROW 50002, N'MEMBER_ID_EXISTS', 1;
            END

            INSERT INTO ThanhVien (
              ma_thanh_vien,
              ho_ten,
              sdt,
              dia_chi,
              ngay_dang_ky,
              tinh_trang_the,
              ghi_chu
            )
            SELECT
              @ma_thanh_vien_moi,
              @ho_ten,
              @sdt,
              @dia_chi,
              COALESCE(@ngay_dang_ky, tv.ngay_dang_ky, CAST(GETDATE() AS DATE)),
              COALESCE(@tinh_trang_the, N'Hoạt động'),
              @ghi_chu
            FROM ThanhVien tv
            WHERE tv.ma_thanh_vien = @ma_thanh_vien_cu;

            UPDATE Muon
            SET ma_thanh_vien = @ma_thanh_vien_moi
            WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien_cu));

            DELETE FROM ThanhVien
            WHERE ma_thanh_vien = @ma_thanh_vien_cu;

            SET @affected = 1;
          END
          ELSE
          BEGIN
            UPDATE ThanhVien
            SET
              ho_ten = @ho_ten,
              sdt = @sdt,
              dia_chi = @dia_chi,
              ngay_dang_ky = COALESCE(@ngay_dang_ky, ngay_dang_ky),
              tinh_trang_the = COALESCE(@tinh_trang_the, N'Hoạt động'),
              ghi_chu = @ghi_chu
            WHERE ma_thanh_vien = @ma_thanh_vien_cu;

            SET @affected = @@ROWCOUNT;
          END

          COMMIT TRANSACTION;

          SELECT @affected AS affected;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `);

    const affectedRows = result.recordset;

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy thành viên để cập nhật" });
    }

    const rows = await runQuery(
      `
      SELECT
          ma_thanh_vien,
          ho_ten,
          sdt,
          dia_chi,
          ngay_dang_ky,
          tinh_trang_the,
          ghi_chu
      FROM ThanhVien
      WHERE ma_thanh_vien = @ma_thanh_vien;
      `,
      [{ name: "ma_thanh_vien", type: sql.NVarChar(20), value: newMemberId }]
    );

    res.json({ message: "Cập nhật thành viên thành công", data: rows[0] });
  } catch (error) {
    if (error.number === 50001) {
      return res.status(404).json({ message: "Không tìm thấy thành viên để cập nhật" });
    }

    if (error.number === 50002 || error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Mã thành viên mới đã tồn tại" });
    }

    if (error.number === 547) {
      return res.status(409).json({
        message: "Không thể đổi mã thành viên vì còn dữ liệu liên quan"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.delete("/api/members/:id", async (req, res) => {
  const memberId = normalizeTextValue(req.params.id);
  const forceDelete = String(req.query.force || "").toLowerCase() === "true";

  if (!memberId) {
    return res.status(400).json({ message: "Mã thành viên không hợp lệ" });
  }

  try {
    if (forceDelete) {
      const result = await runQuery(
        `
        DECLARE @deleted_muon INT = 0;

        DELETE FROM Muon
        WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien));
        SET @deleted_muon = @@ROWCOUNT;

        DELETE FROM ThanhVien
        WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien));

        SELECT @@ROWCOUNT AS affected, @deleted_muon AS deleted_muon;
        `,
        [{ name: "ma_thanh_vien", type: sql.NVarChar(20), value: memberId }]
      );

      if (!result[0] || result[0].affected === 0) {
        return res.status(404).json({ message: "Không tìm thấy thành viên để xóa" });
      }

      return res.json({
        message: "Xóa thành viên thành công (đã xóa cả dữ liệu mượn liên quan)",
        deletedBorrowRows: result[0].deleted_muon || 0
      });
    }

    const affectedRows = await runQuery(
      `
      DELETE FROM ThanhVien
      WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien));

      SELECT @@ROWCOUNT AS affected;
      `,
      [{ name: "ma_thanh_vien", type: sql.NVarChar(20), value: memberId }]
    );

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy thành viên để xóa" });
    }

    res.json({ message: "Xóa thành viên thành công" });
  } catch (error) {
    if (error.number === 547) {
      return res.status(409).json({
        message: "Không thể xóa thành viên vì đang có dữ liệu mượn liên quan. Dùng chế độ xóa toàn bộ để xóa kèm lịch sử mượn."
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/books", async (req, res) => {
  const maSach = normalizeTextValue(req.body.ma_sach);
  const tenSach = normalizeTextValue(req.body.ten_sach);
  const tacGia = normalizeTextValue(req.body.tac_gia);
  const nhaXb = normalizeTextValue(req.body.nha_xb);
  const namXb = normalizeIntValue(req.body.nam_xb);
  const soTrang = normalizeIntValue(req.body.so_trang);
  const giaTri = normalizeDecimalValue(req.body.gia_tri);
  const soBanSao = normalizeIntValue(req.body.so_ban_sao) ?? 0;
  const maChiNhanh = normalizeTextValue(req.body.ma_chi_nhanh);

  if (!maSach || !tenSach) {
    return res.status(400).json({ message: "ma_sach và ten_sach là bắt buộc" });
  }

  if (Number.isNaN(namXb) || Number.isNaN(soTrang) || Number.isNaN(giaTri)) {
    return res.status(400).json({ message: "nam_xb, so_trang hoặc gia_tri không hợp lệ" });
  }

  if (Number.isNaN(soBanSao) || soBanSao < 0) {
    return res.status(400).json({ message: "so_ban_sao không hợp lệ" });
  }

  if (soBanSao > 0 && !maChiNhanh) {
    return res.status(400).json({ message: "ma_chi_nhanh là bắt buộc khi thêm bản sao" });
  }

  try {
    const pool = await getPool();
    await pool
      .request()
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("ten_sach", sql.NVarChar(255), tenSach)
      .input("tac_gia", sql.NVarChar(255), tacGia)
      .input("nha_xb", sql.NVarChar(255), nhaXb)
      .input("nam_xb", sql.Int, namXb)
      .input("so_trang", sql.Int, soTrang)
      .input("gia_tri", sql.Decimal(18, 2), giaTri)
      .input("so_ban_sao", sql.Int, soBanSao)
      .input("ma_chi_nhanh", sql.NVarChar(20), maChiNhanh)
      .query(`
        BEGIN TRY
          BEGIN TRANSACTION;

          INSERT INTO Sach (
            ma_sach,
            ten_sach,
            tac_gia,
            nha_xb,
            nam_xb,
            so_trang,
            gia_tri
          )
          VALUES (
            @ma_sach,
            @ten_sach,
            @tac_gia,
            @nha_xb,
            @nam_xb,
            @so_trang,
            @gia_tri
          );

          DECLARE @i INT = 1;
          WHILE @i <= @so_ban_sao
          BEGIN
            INSERT INTO BanSao (
              ma_sach,
              copy_no,
              ngay_nhap,
              tinh_trang_muon,
              tinh_trang_vat_ly,
              ghi_chu,
              ma_chi_nhanh
            )
            VALUES (
              @ma_sach,
              @i,
              CAST(GETDATE() AS DATE),
              N'Chưa mượn',
              N'Tốt',
              N'Thêm tự động khi tạo sách',
              @ma_chi_nhanh
            );

            SET @i = @i + 1;
          END

          COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `);

    res.status(201).json({
      message: `Sách thành công${soBanSao > 0 ? ` và tạo ${soBanSao} bản sao` : ""}`,
      data: {
        ma_sach: maSach,
        ten_sach: tenSach,
        tac_gia: tacGia,
        nha_xb: nhaXb,
        nam_xb: namXb,
        so_trang: soTrang,
        gia_tri: giaTri,
        so_ban_sao: soBanSao,
        ma_chi_nhanh: maChiNhanh
      }
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Mã sách đã tồn tại" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/books", async (req, res) => {
  const keyword = normalizeTextValue(req.query.keyword);
  const year = normalizeIntValue(req.query.year);

  if (Number.isNaN(year)) {
    return res.status(400).json({ message: "Năm xuất bản không hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          s.ma_sach,
          s.ten_sach,
          s.tac_gia,
          s.nha_xb,
          s.nam_xb,
          s.so_trang,
          s.gia_tri,
          COUNT(bs.copy_no) AS tong_ban_sao
      FROM Sach s
      LEFT JOIN BanSao bs ON bs.ma_sach = s.ma_sach
      WHERE (
          @keyword IS NULL
          OR s.ma_sach LIKE N'%' + @keyword + N'%'
          OR s.ten_sach LIKE N'%' + @keyword + N'%'
          OR ISNULL(s.tac_gia, N'') LIKE N'%' + @keyword + N'%'
      )
      AND (
          @year IS NULL
          OR s.nam_xb = @year
      )
      GROUP BY
          s.ma_sach,
          s.ten_sach,
          s.tac_gia,
          s.nha_xb,
          s.nam_xb,
          s.so_trang,
          s.gia_tri
      ORDER BY s.ten_sach ASC;
      `,
      [
        { name: "keyword", type: sql.NVarChar(255), value: keyword },
        { name: "year", type: sql.Int, value: year }
      ]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/books/:id", async (req, res) => {
  const bookId = normalizeTextValue(req.params.id);

  if (!bookId) {
    return res.status(400).json({ message: "Mã sách không hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          s.ma_sach,
          s.ten_sach,
          s.tac_gia,
          s.nha_xb,
          s.nam_xb,
          s.so_trang,
          s.gia_tri,
          (SELECT COUNT(*) FROM BanSao bs WHERE bs.ma_sach = s.ma_sach) AS tong_ban_sao,
          first_copy.ma_chi_nhanh AS ma_chi_nhanh_mac_dinh
      FROM Sach s
      OUTER APPLY (
          SELECT TOP 1 bs2.ma_chi_nhanh
          FROM BanSao bs2
          WHERE bs2.ma_sach = s.ma_sach
          ORDER BY bs2.copy_no ASC
      ) AS first_copy
      WHERE s.ma_sach = @ma_sach;
      `,
      [{ name: "ma_sach", type: sql.NVarChar(20), value: bookId }]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy sách" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.put("/api/books/:id", async (req, res) => {
  const bookId = normalizeTextValue(req.params.id);
  const newBookId = normalizeTextValue(req.body.ma_sach) || bookId;
  const tenSach = normalizeTextValue(req.body.ten_sach);
  const tacGia = normalizeTextValue(req.body.tac_gia);
  const nhaXb = normalizeTextValue(req.body.nha_xb);
  const namXb = normalizeIntValue(req.body.nam_xb);
  const soTrang = normalizeIntValue(req.body.so_trang);
  const giaTri = normalizeDecimalValue(req.body.gia_tri);
  const soBanSao = normalizeIntValue(req.body.so_ban_sao);
  const maChiNhanh = normalizeTextValue(req.body.ma_chi_nhanh);

  if (!bookId || !newBookId || !tenSach) {
    return res.status(400).json({ message: "Mã sách và tên sách là bắt buộc" });
  }

  if (Number.isNaN(namXb) || Number.isNaN(soTrang) || Number.isNaN(giaTri) || Number.isNaN(soBanSao)) {
    return res.status(400).json({ message: "nam_xb, so_trang hoặc gia_tri không hợp lệ" });
  }

  if (soBanSao !== null && soBanSao < 0) {
    return res.status(400).json({ message: "so_ban_sao không hợp lệ" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ma_sach_cu", sql.NVarChar(20), bookId)
      .input("ma_sach_moi", sql.NVarChar(20), newBookId)
      .input("ten_sach", sql.NVarChar(255), tenSach)
      .input("tac_gia", sql.NVarChar(255), tacGia)
      .input("nha_xb", sql.NVarChar(255), nhaXb)
      .input("nam_xb", sql.Int, namXb)
      .input("so_trang", sql.Int, soTrang)
      .input("gia_tri", sql.Decimal(18, 2), giaTri)
      .input("so_ban_sao", sql.Int, soBanSao)
      .input("ma_chi_nhanh", sql.NVarChar(20), maChiNhanh)
      .query(`
        DECLARE @affected INT = 0;
        DECLARE @current_copy_count INT = 0;
        DECLARE @max_copy_no INT = 0;

        BEGIN TRY
          BEGIN TRANSACTION;

          IF NOT EXISTS (
            SELECT 1
            FROM Sach
            WHERE ma_sach = @ma_sach_cu
          )
          BEGIN
            THROW 50021, N'BOOK_NOT_FOUND', 1;
          END

          IF @ma_sach_moi <> @ma_sach_cu
          BEGIN
            IF EXISTS (
              SELECT 1
              FROM Sach
              WHERE ma_sach = @ma_sach_moi
            )
            BEGIN
              THROW 50022, N'BOOK_ID_EXISTS', 1;
            END

            INSERT INTO Sach (
              ma_sach,
              ten_sach,
              tac_gia,
              nha_xb,
              nam_xb,
              so_trang,
              gia_tri
            )
            VALUES (
              @ma_sach_moi,
              @ten_sach,
              @tac_gia,
              @nha_xb,
              @nam_xb,
              @so_trang,
              @gia_tri
            );

            INSERT INTO GiaoTrinh (ma_sach, cap_hoc, mon_hoc)
            SELECT @ma_sach_moi, cap_hoc, mon_hoc
            FROM GiaoTrinh
            WHERE ma_sach = @ma_sach_cu;

            INSERT INTO TieuThuyet (ma_sach, the_loai)
            SELECT @ma_sach_moi, the_loai
            FROM TieuThuyet
            WHERE ma_sach = @ma_sach_cu;

            INSERT INTO TapChi (ma_sach, so_phat_hanh, thang_phat_hanh)
            SELECT @ma_sach_moi, so_phat_hanh, thang_phat_hanh
            FROM TapChi
            WHERE ma_sach = @ma_sach_cu;

            INSERT INTO BanSao (
              ma_sach,
              copy_no,
              ngay_nhap,
              tinh_trang_muon,
              tinh_trang_vat_ly,
              ghi_chu,
              ma_chi_nhanh
            )
            SELECT
              @ma_sach_moi,
              copy_no,
              ngay_nhap,
              tinh_trang_muon,
              tinh_trang_vat_ly,
              ghi_chu,
              ma_chi_nhanh
            FROM BanSao
            WHERE ma_sach = @ma_sach_cu;

            UPDATE Muon
            SET ma_sach = @ma_sach_moi
            WHERE LTRIM(RTRIM(ma_sach)) = LTRIM(RTRIM(@ma_sach_cu));

            DELETE FROM BanSao
            WHERE ma_sach = @ma_sach_cu;

            DELETE FROM GiaoTrinh
            WHERE ma_sach = @ma_sach_cu;

            DELETE FROM TieuThuyet
            WHERE ma_sach = @ma_sach_cu;

            DELETE FROM TapChi
            WHERE ma_sach = @ma_sach_cu;

            DELETE FROM Sach
            WHERE ma_sach = @ma_sach_cu;

            SET @affected = 1;
          END
          ELSE
          BEGIN
            UPDATE Sach
            SET
                ten_sach = @ten_sach,
                tac_gia = @tac_gia,
                nha_xb = @nha_xb,
                nam_xb = @nam_xb,
                so_trang = @so_trang,
                gia_tri = @gia_tri
            WHERE ma_sach = @ma_sach_cu;

            SET @affected = @@ROWCOUNT;
          END

          SELECT
            @current_copy_count = COUNT(*),
            @max_copy_no = ISNULL(MAX(copy_no), 0)
          FROM BanSao
          WHERE ma_sach = @ma_sach_moi;

          IF @so_ban_sao IS NOT NULL
          BEGIN
            IF @so_ban_sao > @current_copy_count
            BEGIN
              IF @ma_chi_nhanh IS NULL
              BEGIN
                THROW 50023, N'BRANCH_REQUIRED_FOR_COPY_INCREASE', 1;
              END

              DECLARE @i INT = @max_copy_no + 1;
              DECLARE @target INT = @max_copy_no + (@so_ban_sao - @current_copy_count);

              WHILE @i <= @target
              BEGIN
                INSERT INTO BanSao (
                  ma_sach,
                  copy_no,
                  ngay_nhap,
                  tinh_trang_muon,
                  tinh_trang_vat_ly,
                  ghi_chu,
                  ma_chi_nhanh
                )
                VALUES (
                  @ma_sach_moi,
                  @i,
                  CAST(GETDATE() AS DATE),
                  N'Chưa mượn',
                  N'Tốt',
                  N'Thêm tự động khi cập nhật sách',
                  @ma_chi_nhanh
                );

                SET @i = @i + 1;
              END
            END
            ELSE IF @so_ban_sao < @current_copy_count
            BEGIN
              IF EXISTS (
                SELECT 1
                FROM Muon
                WHERE ma_sach = @ma_sach_moi
                  AND copy_no > @so_ban_sao
              )
              BEGIN
                THROW 50024, N'CANNOT_REDUCE_COPIES_HAS_BORROW_HISTORY', 1;
              END

              DELETE FROM BanSao
              WHERE ma_sach = @ma_sach_moi
                AND copy_no > @so_ban_sao;
            END
          END

          IF @ma_chi_nhanh IS NOT NULL
          BEGIN
            UPDATE BanSao
            SET ma_chi_nhanh = @ma_chi_nhanh
            WHERE ma_sach = @ma_sach_moi;
          END

          COMMIT TRANSACTION;

          SELECT @affected AS affected;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `);

    const affectedRows = result.recordset;

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy sách để cập nhật" });
    }

    const rows = await runQuery(
      `
      SELECT
          s.ma_sach,
          s.ten_sach,
          s.tac_gia,
          s.nha_xb,
          s.nam_xb,
          s.so_trang,
          s.gia_tri,
          (SELECT COUNT(*) FROM BanSao bs WHERE bs.ma_sach = s.ma_sach) AS tong_ban_sao,
          first_copy.ma_chi_nhanh AS ma_chi_nhanh_mac_dinh
      FROM Sach s
      OUTER APPLY (
          SELECT TOP 1 bs2.ma_chi_nhanh
          FROM BanSao bs2
          WHERE bs2.ma_sach = s.ma_sach
          ORDER BY bs2.copy_no ASC
      ) AS first_copy
      WHERE s.ma_sach = @ma_sach;
      `,
      [{ name: "ma_sach", type: sql.NVarChar(20), value: newBookId }]
    );

    res.json({ message: "Cập nhật sách thành công", data: rows[0] });
  } catch (error) {
    if (error.number === 50021) {
      return res.status(404).json({ message: "Không tìm thấy sách để cập nhật" });
    }

    if (error.number === 50022 || error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Mã sách mới đã tồn tại" });
    }

    if (error.number === 50023) {
      return res.status(400).json({ message: "Cần nhập mã chi nhánh khi tăng số bản sao" });
    }

    if (error.number === 50024) {
      return res.status(409).json({
        message: "Không thể giảm số bản sao vì các bản sao cần xóa đã có lịch sử mượn"
      });
    }

    if (error.number === 547) {
      return res.status(400).json({
        message: "Mã chi nhánh không hợp lệ hoặc dữ liệu sách có ràng buộc liên quan"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  const bookId = normalizeTextValue(req.params.id);

  if (!bookId) {
    return res.status(400).json({ message: "Mã sách không hợp lệ" });
  }

  try {
    const affectedRows = await runQuery(
      `
      DELETE FROM Sach
      WHERE ma_sach = @ma_sach;

      SELECT @@ROWCOUNT AS affected;
      `,
      [{ name: "ma_sach", type: sql.NVarChar(20), value: bookId }]
    );

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy sách để xóa" });
    }

    res.json({ message: "Xóa sách thành công" });
  } catch (error) {
    if (error.number === 547) {
      return res.status(409).json({
        message: "Không thể xóa sách vì đang có dữ liệu liên quan (bản sao, mượn, phân loại)"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/book-copies", async (req, res) => {
  const maSach = normalizeTextValue(req.body.ma_sach);
  const maChiNhanh = normalizeTextValue(req.body.ma_chi_nhanh);
  const copyNoInput = normalizeIntValue(req.body.copy_no);
  const ngayNhap = normalizeDateValue(req.body.ngay_nhap);
  const tinhTrangMuon = normalizeTextValue(req.body.tinh_trang_muon) || "Chưa mượn";
  const tinhTrangVatLy = normalizeTextValue(req.body.tinh_trang_vat_ly) || "Tốt";
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!maSach || !maChiNhanh) {
    return res.status(400).json({ message: "ma_sach và ma_chi_nhanh là bắt buộc" });
  }

  if (Number.isNaN(copyNoInput)) {
    return res.status(400).json({ message: "copy_no không hợp lệ" });
  }

  if (!ALLOWED_COPY_BORROW_STATUSES.has(tinhTrangMuon)) {
    return res.status(400).json({
      message: "tinh_trang_muon chỉ chấp nhận: Đang mượn hoặc Chưa mượn"
    });
  }

  try {
    const pool = await getPool();

    let copyNo = copyNoInput;
    if (copyNo === null) {
      const maxCopyRows = await pool
        .request()
        .input("ma_sach", sql.NVarChar(20), maSach)
        .query(`
          SELECT ISNULL(MAX(copy_no), 0) + 1 AS next_copy_no
          FROM BanSao
          WHERE ma_sach = @ma_sach;
        `);

      copyNo = maxCopyRows.recordset[0].next_copy_no;
    }

    await pool
      .request()
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("copy_no", sql.Int, copyNo)
      .input("ngay_nhap", sql.Date, ngayNhap || null)
      .input("tinh_trang_muon", sql.NVarChar(100), tinhTrangMuon)
      .input("tinh_trang_vat_ly", sql.NVarChar(100), tinhTrangVatLy)
      .input("ghi_chu", sql.NVarChar(255), ghiChu)
      .input("ma_chi_nhanh", sql.NVarChar(20), maChiNhanh)
      .query(`
        INSERT INTO BanSao (
          ma_sach,
          copy_no,
          ngay_nhap,
          tinh_trang_muon,
          tinh_trang_vat_ly,
          ghi_chu,
          ma_chi_nhanh
        )
        VALUES (
          @ma_sach,
          @copy_no,
          COALESCE(@ngay_nhap, CAST(GETDATE() AS DATE)),
          @tinh_trang_muon,
          @tinh_trang_vat_ly,
          @ghi_chu,
          @ma_chi_nhanh
        );
      `);

    res.status(201).json({
      message: "Thêm bản sao sách thành công",
      data: {
        ma_sach: maSach,
        copy_no: copyNo,
        ma_chi_nhanh: maChiNhanh,
        tinh_trang_muon: tinhTrangMuon,
        tinh_trang_vat_ly: tinhTrangVatLy
      }
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({
        message: "Bản sao này đã tồn tại"
      });
    }

    if (error.number === 547) {
      return res.status(400).json({
        message: "Mã sách hoặc mã chi nhánh không hợp lệ"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/book-copies/batch", async (req, res) => {
  const maSach = normalizeTextValue(req.body.ma_sach);
  const soLuong = normalizeIntValue(req.body.so_luong);
  const maChiNhanh = normalizeTextValue(req.body.ma_chi_nhanh);
  const ngayNhap = normalizeDateValue(req.body.ngay_nhap);
  const tinhTrangMuon = normalizeTextValue(req.body.tinh_trang_muon) || "Chưa mượn";
  const tinhTrangVatLy = normalizeTextValue(req.body.tinh_trang_vat_ly) || "Tốt";
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!maSach || !maChiNhanh) {
    return res.status(400).json({ message: "ma_sach và ma_chi_nhanh là bắt buộc" });
  }

  if (Number.isNaN(soLuong) || soLuong === null || soLuong <= 0) {
    return res.status(400).json({ message: "so_luong phải là số nguyên dương" });
  }

  if (!ALLOWED_COPY_BORROW_STATUSES.has(tinhTrangMuon)) {
    return res.status(400).json({
      message: "tinh_trang_muon chỉ chấp nhận: Đang mượn hoặc Chưa mượn"
    });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("so_luong", sql.Int, soLuong)
      .input("ma_chi_nhanh", sql.NVarChar(20), maChiNhanh)
      .input("ngay_nhap", sql.Date, ngayNhap || null)
      .input("tinh_trang_muon", sql.NVarChar(100), tinhTrangMuon)
      .input("tinh_trang_vat_ly", sql.NVarChar(100), tinhTrangVatLy)
      .input("ghi_chu", sql.NVarChar(255), ghiChu)
      .query(`
        DECLARE @next_copy_no INT = 0;
        DECLARE @last_copy_no INT = 0;

        BEGIN TRY
          BEGIN TRANSACTION;

          IF NOT EXISTS (
            SELECT 1
            FROM Sach
            WHERE ma_sach = @ma_sach
          )
          BEGIN
            THROW 50031, N'BOOK_NOT_FOUND', 1;
          END

          SELECT @next_copy_no = ISNULL(MAX(copy_no), 0) + 1
          FROM BanSao
          WHERE ma_sach = @ma_sach;

          SET @last_copy_no = @next_copy_no + @so_luong - 1;

          DECLARE @i INT = @next_copy_no;
          WHILE @i <= @last_copy_no
          BEGIN
            INSERT INTO BanSao (
              ma_sach,
              copy_no,
              ngay_nhap,
              tinh_trang_muon,
              tinh_trang_vat_ly,
              ghi_chu,
              ma_chi_nhanh
            )
            VALUES (
              @ma_sach,
              @i,
              COALESCE(@ngay_nhap, CAST(GETDATE() AS DATE)),
              @tinh_trang_muon,
              @tinh_trang_vat_ly,
              @ghi_chu,
              @ma_chi_nhanh
            );

            SET @i = @i + 1;
          END

          SELECT
              bs.ma_sach,
              s.ten_sach,
              bs.copy_no,
              bs.ngay_nhap,
              bs.tinh_trang_muon,
              bs.tinh_trang_vat_ly,
              bs.ghi_chu,
              bs.ma_chi_nhanh
          FROM BanSao bs
          JOIN Sach s ON s.ma_sach = bs.ma_sach
          WHERE bs.ma_sach = @ma_sach
            AND bs.copy_no BETWEEN @next_copy_no AND @last_copy_no
          ORDER BY bs.copy_no ASC;

          COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `);

    res.status(201).json({
      message: `Đã thêm ${soLuong} bản sao cho sách ${maSach}`,
      data: result.recordset || []
    });
  } catch (error) {
    if (error.number === 50031) {
      return res.status(404).json({ message: "Không tìm thấy mã sách để thêm bản sao" });
    }

    if (error.number === 547) {
      return res.status(400).json({ message: "Mã sách hoặc mã chi nhánh không hợp lệ" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/book-copies", async (req, res) => {
  const keyword = normalizeTextValue(req.query.keyword);
  const maSach = normalizeTextValue(req.query.ma_sach);
  const maChiNhanh = normalizeTextValue(req.query.ma_chi_nhanh);
  const tinhTrangMuon = normalizeTextValue(req.query.tinh_trang_muon);
  const tinhTrangVatLy = normalizeTextValue(req.query.tinh_trang_vat_ly);

  if (tinhTrangMuon && !ALLOWED_COPY_BORROW_STATUSES.has(tinhTrangMuon)) {
    return res.status(400).json({
      message: "tinh_trang_muon chỉ chấp nhận: Đang mượn hoặc Chưa mượn"
    });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          bs.ma_sach,
          s.ten_sach,
          bs.copy_no,
          bs.ngay_nhap,
          bs.tinh_trang_muon,
          bs.tinh_trang_vat_ly,
          bs.ghi_chu,
          bs.ma_chi_nhanh
      FROM BanSao bs
      JOIN Sach s ON s.ma_sach = bs.ma_sach
      WHERE (
          @ma_sach IS NULL
          OR bs.ma_sach = @ma_sach
      )
      AND (
          @ma_chi_nhanh IS NULL
          OR bs.ma_chi_nhanh = @ma_chi_nhanh
      )
      AND (
          @tinh_trang_muon IS NULL
          OR bs.tinh_trang_muon = @tinh_trang_muon
      )
      AND (
          @tinh_trang_vat_ly IS NULL
          OR bs.tinh_trang_vat_ly LIKE N'%' + @tinh_trang_vat_ly + N'%'
      )
      AND (
          @keyword IS NULL
          OR bs.ma_sach LIKE N'%' + @keyword + N'%'
          OR s.ten_sach LIKE N'%' + @keyword + N'%'
          OR bs.ma_chi_nhanh LIKE N'%' + @keyword + N'%'
      )
      ORDER BY bs.ma_sach ASC, bs.copy_no ASC;
      `,
      [
        { name: "keyword", type: sql.NVarChar(255), value: keyword },
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "ma_chi_nhanh", type: sql.NVarChar(20), value: maChiNhanh },
        { name: "tinh_trang_muon", type: sql.NVarChar(100), value: tinhTrangMuon },
        { name: "tinh_trang_vat_ly", type: sql.NVarChar(100), value: tinhTrangVatLy }
      ]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.put("/api/book-copies/:bookId/:copyNo", async (req, res) => {
  const maSach = normalizeTextValue(req.params.bookId);
  const copyNo = normalizeIntValue(req.params.copyNo);
  const maChiNhanh = normalizeTextValue(req.body.ma_chi_nhanh);
  const ngayNhap = normalizeDateValue(req.body.ngay_nhap);
  const tinhTrangMuon = normalizeTextValue(req.body.tinh_trang_muon);
  const tinhTrangVatLy = normalizeTextValue(req.body.tinh_trang_vat_ly);
  const hasGhiChu = Object.prototype.hasOwnProperty.call(req.body, "ghi_chu");
  const ghiChu = hasGhiChu ? normalizeTextValue(req.body.ghi_chu) : undefined;

  if (!maSach || Number.isNaN(copyNo) || copyNo === null || copyNo <= 0) {
    return res.status(400).json({ message: "Khóa bản sao sách không hợp lệ" });
  }

  if (tinhTrangMuon && !ALLOWED_COPY_BORROW_STATUSES.has(tinhTrangMuon)) {
    return res.status(400).json({
      message: "tinh_trang_muon chỉ chấp nhận: Đang mượn hoặc Chưa mượn"
    });
  }

  if (!maChiNhanh && !ngayNhap && !tinhTrangMuon && !tinhTrangVatLy && !hasGhiChu) {
    return res.status(400).json({
      message: "Cần ít nhất một trường để cập nhật bản sao"
    });
  }

  try {
    const affectedRows = await runQuery(
      `
      UPDATE BanSao
      SET
          ma_chi_nhanh = COALESCE(@ma_chi_nhanh, ma_chi_nhanh),
          ngay_nhap = COALESCE(@ngay_nhap, ngay_nhap),
          tinh_trang_muon = COALESCE(@tinh_trang_muon, tinh_trang_muon),
          tinh_trang_vat_ly = COALESCE(@tinh_trang_vat_ly, tinh_trang_vat_ly),
          ghi_chu = CASE WHEN @has_ghi_chu = 1 THEN @ghi_chu ELSE ghi_chu END
      WHERE ma_sach = @ma_sach
        AND copy_no = @copy_no;

      SELECT @@ROWCOUNT AS affected;
      `,
      [
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "copy_no", type: sql.Int, value: copyNo },
        { name: "ma_chi_nhanh", type: sql.NVarChar(20), value: maChiNhanh },
        { name: "ngay_nhap", type: sql.Date, value: ngayNhap },
        { name: "tinh_trang_muon", type: sql.NVarChar(100), value: tinhTrangMuon },
        { name: "tinh_trang_vat_ly", type: sql.NVarChar(100), value: tinhTrangVatLy },
        { name: "has_ghi_chu", type: sql.Bit, value: hasGhiChu ? 1 : 0 },
        { name: "ghi_chu", type: sql.NVarChar(255), value: hasGhiChu ? ghiChu : null }
      ]
    );

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy bản sao cần cập nhật" });
    }

    const rows = await runQuery(
      `
      SELECT
          bs.ma_sach,
          s.ten_sach,
          bs.copy_no,
          bs.ngay_nhap,
          bs.tinh_trang_muon,
          bs.tinh_trang_vat_ly,
          bs.ghi_chu,
          bs.ma_chi_nhanh
      FROM BanSao bs
      JOIN Sach s ON s.ma_sach = bs.ma_sach
      WHERE bs.ma_sach = @ma_sach
        AND bs.copy_no = @copy_no;
      `,
      [
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "copy_no", type: sql.Int, value: copyNo }
      ]
    );

    res.json({
      message: "Cập nhật bản sao sách thành công",
      data: rows[0]
    });
  } catch (error) {
    if (error.number === 547) {
      return res.status(400).json({
        message: "Mã chi nhánh không hợp lệ"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/suppliers", async (req, res) => {
  const maNcc = normalizeTextValue(req.body.ma_ncc);
  const tenNcc = normalizeTextValue(req.body.ten_ncc);
  const sdt = normalizeTextValue(req.body.sdt);
  const email = normalizeTextValue(req.body.email);
  const diaChi = normalizeTextValue(req.body.dia_chi);

  if (!maNcc || !tenNcc) {
    return res.status(400).json({ message: "ma_ncc và ten_ncc là bắt buộc" });
  }

  try {
    await runQuery(
      `
      INSERT INTO NhaCungCap (
        ma_ncc,
        ten_ncc,
        sdt,
        email,
        dia_chi
      )
      VALUES (
        @ma_ncc,
        @ten_ncc,
        @sdt,
        @email,
        @dia_chi
      );
      `,
      [
        { name: "ma_ncc", type: sql.NVarChar(20), value: maNcc },
        { name: "ten_ncc", type: sql.NVarChar(255), value: tenNcc },
        { name: "sdt", type: sql.NVarChar(20), value: sdt },
        { name: "email", type: sql.NVarChar(100), value: email },
        { name: "dia_chi", type: sql.NVarChar(255), value: diaChi }
      ]
    );

    res.status(201).json({
      message: "Thêm nhà cung cấp thành công",
      data: {
        ma_ncc: maNcc,
        ten_ncc: tenNcc,
        sdt,
        email,
        dia_chi: diaChi
      }
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Mã nhà cung cấp đã tồn tại" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/suppliers", async (req, res) => {
  const keyword = normalizeTextValue(req.query.keyword);

  try {
    const rows = await runQuery(
      `
      SELECT
          ma_ncc,
          ten_ncc,
          sdt,
          email,
          dia_chi
      FROM NhaCungCap
      WHERE (
          @keyword IS NULL
          OR ma_ncc LIKE N'%' + @keyword + N'%'
          OR ten_ncc LIKE N'%' + @keyword + N'%'
          OR ISNULL(sdt, N'') LIKE N'%' + @keyword + N'%'
          OR ISNULL(email, N'') LIKE N'%' + @keyword + N'%'
      )
      ORDER BY ten_ncc ASC, ma_ncc ASC;
      `,
      [{ name: "keyword", type: sql.NVarChar(255), value: keyword }]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/suppliers/:id", async (req, res) => {
  const supplierId = normalizeTextValue(req.params.id);

  if (!supplierId) {
    return res.status(400).json({ message: "Mã nhà cung cấp không hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          ma_ncc,
          ten_ncc,
          sdt,
          email,
          dia_chi
      FROM NhaCungCap
      WHERE ma_ncc = @ma_ncc;
      `,
      [{ name: "ma_ncc", type: sql.NVarChar(20), value: supplierId }]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  const supplierId = normalizeTextValue(req.params.id);
  const newSupplierId = normalizeTextValue(req.body.ma_ncc);
  const tenNcc = normalizeTextValue(req.body.ten_ncc);
  const sdt = normalizeTextValue(req.body.sdt);
  const email = normalizeTextValue(req.body.email);
  const diaChi = normalizeTextValue(req.body.dia_chi);

  if (!supplierId || !newSupplierId || !tenNcc) {
    return res.status(400).json({ message: "Mã và tên nhà cung cấp là bắt buộc" });
  }

  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input("ma_ncc_cu", sql.NVarChar(20), supplierId)
      .input("ma_ncc_moi", sql.NVarChar(20), newSupplierId)
      .input("ten_ncc", sql.NVarChar(255), tenNcc)
      .input("sdt", sql.NVarChar(20), sdt)
      .input("email", sql.NVarChar(100), email)
      .input("dia_chi", sql.NVarChar(255), diaChi)
      .query(`
        DECLARE @affected INT = 0;

        BEGIN TRY
          BEGIN TRANSACTION;

          IF NOT EXISTS (
            SELECT 1
            FROM NhaCungCap
            WHERE ma_ncc = @ma_ncc_cu
          )
          BEGIN
            THROW 50011, N'SUPPLIER_NOT_FOUND', 1;
          END

          IF @ma_ncc_cu <> @ma_ncc_moi
          BEGIN
            IF EXISTS (
              SELECT 1
              FROM NhaCungCap
              WHERE ma_ncc = @ma_ncc_moi
            )
            BEGIN
              THROW 50012, N'SUPPLIER_ID_EXISTS', 1;
            END

            INSERT INTO NhaCungCap (
              ma_ncc,
              ten_ncc,
              sdt,
              email,
              dia_chi
            )
            VALUES (
              @ma_ncc_moi,
              @ten_ncc,
              @sdt,
              @email,
              @dia_chi
            );

            UPDATE CungCap
            SET ma_ncc = @ma_ncc_moi
            WHERE LTRIM(RTRIM(ma_ncc)) = LTRIM(RTRIM(@ma_ncc_cu));

            DELETE FROM NhaCungCap
            WHERE ma_ncc = @ma_ncc_cu;

            SET @affected = 1;
          END
          ELSE
          BEGIN
            UPDATE NhaCungCap
            SET
                ten_ncc = @ten_ncc,
                sdt = @sdt,
                email = @email,
                dia_chi = @dia_chi
            WHERE ma_ncc = @ma_ncc_cu;

            SET @affected = @@ROWCOUNT;
          END

          COMMIT TRANSACTION;

          SELECT @affected AS affected;
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
          THROW;
        END CATCH
      `);

    const affectedRows = result.recordset;
    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để cập nhật" });
    }

    const rows = await runQuery(
      `
      SELECT
          ma_ncc,
          ten_ncc,
          sdt,
          email,
          dia_chi
      FROM NhaCungCap
      WHERE ma_ncc = @ma_ncc;
      `,
      [{ name: "ma_ncc", type: sql.NVarChar(20), value: newSupplierId }]
    );

    res.json({ message: "Cập nhật nhà cung cấp thành công", data: rows[0] });
  } catch (error) {
    if (error.number === 50011) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để cập nhật" });
    }

    if (error.number === 50012 || error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Mã nhà cung cấp mới đã tồn tại" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  const supplierId = normalizeTextValue(req.params.id);
  const forceDelete = String(req.query.force || "").toLowerCase() === "true";

  if (!supplierId) {
    return res.status(400).json({ message: "Mã nhà cung cấp không hợp lệ" });
  }

  try {
    if (forceDelete) {
      const result = await runQuery(
        `
        DECLARE @deleted_cung_cap INT = 0;

        DELETE FROM CungCap
        WHERE LTRIM(RTRIM(ma_ncc)) = LTRIM(RTRIM(@ma_ncc));
        SET @deleted_cung_cap = @@ROWCOUNT;

        DELETE FROM NhaCungCap
        WHERE LTRIM(RTRIM(ma_ncc)) = LTRIM(RTRIM(@ma_ncc));

        SELECT @@ROWCOUNT AS affected, @deleted_cung_cap AS deleted_cung_cap;
        `,
        [{ name: "ma_ncc", type: sql.NVarChar(20), value: supplierId }]
      );

      if (!result[0] || result[0].affected === 0) {
        return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để xóa" });
      }

      return res.json({
        message: "Xóa nhà cung cấp thành công (đã xóa liên kết cung cấp)",
        deletedSupplyRows: result[0].deleted_cung_cap || 0
      });
    }

    const affectedRows = await runQuery(
      `
      DELETE FROM NhaCungCap
      WHERE LTRIM(RTRIM(ma_ncc)) = LTRIM(RTRIM(@ma_ncc));

      SELECT @@ROWCOUNT AS affected;
      `,
      [{ name: "ma_ncc", type: sql.NVarChar(20), value: supplierId }]
    );

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy nhà cung cấp để xóa" });
    }

    res.json({ message: "Xóa nhà cung cấp thành công" });
  } catch (error) {
    if (error.number === 547) {
      return res.status(409).json({
        message: "Không thể xóa vì nhà cung cấp đang liên kết chi nhánh. Dùng chế độ xóa toàn bộ để xóa cả liên kết."
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/lookups/members", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT ma_thanh_vien, ho_ten, tinh_trang_the
      FROM ThanhVien
      ORDER BY ho_ten ASC;
    `);

    res.json(
      rows.map((member) => ({
        ...member,
        is_locked: isMemberCardLocked(member.tinh_trang_the)
      }))
    );
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/lookups/members/:id", async (req, res) => {
  const memberId = normalizeTextValue(req.params.id);

  if (!memberId) {
    return res.status(400).json({ message: "Mã thành viên không hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT
          tv.ma_thanh_vien,
          tv.ho_ten,
          tv.sdt,
          tv.dia_chi,
          tv.ngay_dang_ky,
          tv.tinh_trang_the,
          tv.ghi_chu,
          (
            SELECT COUNT(*)
            FROM Muon m
            WHERE m.ma_thanh_vien = tv.ma_thanh_vien
              AND m.ngay_tra IS NULL
              AND m.trang_thai = N'Đang mượn'
          ) AS so_sach_dang_muon
      FROM ThanhVien tv
      WHERE tv.ma_thanh_vien = @ma_thanh_vien;
      `,
      [{ name: "ma_thanh_vien", type: sql.NVarChar(20), value: memberId }]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy thành viên" });
    }

    const member = rows[0];
    res.json({
      ...member,
      is_locked: isMemberCardLocked(member.tinh_trang_the)
    });
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/session/current-librarian", async (req, res) => {
  const preferredLibrarianId = normalizeTextValue(req.query.ma_thu_thu) || DEFAULT_LOGGED_LIBRARIAN_ID;

  try {
    const rows = await runQuery(
      `
      SELECT TOP 1
          ma_thu_thu,
          ho_ten,
          sdt,
          email,
          ma_chi_nhanh
      FROM ThuThu
      WHERE (
          @preferred_id IS NULL
          OR ma_thu_thu = @preferred_id
      )
      ORDER BY
          CASE WHEN ma_thu_thu = @preferred_id THEN 0 ELSE 1 END,
          ma_thu_thu ASC;
      `,
      [{ name: "preferred_id", type: sql.NVarChar(20), value: preferredLibrarianId }]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy thủ thư đang đăng nhập" });
    }

    res.json({
      ...rows[0],
      source: preferredLibrarianId ? "configured_or_query" : "first_available"
    });
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/lookups/librarians", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT ma_thu_thu, ho_ten
      FROM ThuThu
      ORDER BY ho_ten ASC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/lookups/book-copies", async (req, res) => {
  const availableOnly = req.query.availableOnly !== "false";

  try {
    const rows = await runQuery(
      `
      SELECT
          bs.ma_sach,
          bs.copy_no,
          s.ten_sach,
          bs.ma_chi_nhanh,
          bs.tinh_trang_muon,
          bs.tinh_trang_vat_ly,
          CASE
            WHEN active_loan.ma_sach IS NULL AND ISNULL(bs.tinh_trang_muon, N'Chưa mượn') <> N'Đang mượn' THEN 1
            ELSE 0
          END AS is_available
      FROM BanSao bs
      JOIN Sach s ON s.ma_sach = bs.ma_sach
      LEFT JOIN Muon active_loan
        ON active_loan.ma_sach = bs.ma_sach
       AND active_loan.copy_no = bs.copy_no
       AND active_loan.ngay_tra IS NULL
        WHERE (
          @available_only = 0
          OR (
            active_loan.ma_sach IS NULL
            AND ISNULL(bs.tinh_trang_muon, N'Chưa mượn') <> N'Đang mượn'
          )
        )
      ORDER BY s.ten_sach ASC, bs.copy_no ASC;
      `,
      [{ name: "available_only", type: sql.Bit, value: availableOnly ? 1 : 0 }]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/lookups/book-copy", async (req, res) => {
  const maSach = normalizeTextValue(req.query.ma_sach);
  const copyNo = normalizeIntValue(req.query.copy_no);

  if (!maSach || Number.isNaN(copyNo) || copyNo === null) {
    return res.status(400).json({ message: "Cần truyền ma_sach và copy_no hợp lệ" });
  }

  try {
    const rows = await runQuery(
      `
      SELECT TOP 1
          bs.ma_sach,
          bs.copy_no,
          s.ten_sach,
          bs.ma_chi_nhanh,
          bs.tinh_trang_muon,
          bs.tinh_trang_vat_ly,
          active_loan.ma_thanh_vien AS dang_duoc_muon_boi,
          active_loan.ngay_hen_tra AS han_tra_hien_tai,
          CASE
            WHEN active_loan.ma_sach IS NULL AND ISNULL(bs.tinh_trang_muon, N'Chưa mượn') <> N'Đang mượn' THEN 1
            ELSE 0
          END AS is_available
      FROM BanSao bs
      JOIN Sach s ON s.ma_sach = bs.ma_sach
      LEFT JOIN Muon active_loan
        ON active_loan.ma_sach = bs.ma_sach
       AND active_loan.copy_no = bs.copy_no
       AND active_loan.ngay_tra IS NULL
      WHERE bs.ma_sach = @ma_sach
        AND bs.copy_no = @copy_no;
      `,
      [
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "copy_no", type: sql.Int, value: copyNo }
      ]
    );

    if (!rows[0]) {
      return res.status(404).json({ message: "Không tìm thấy bản sao sách" });
    }

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/borrows", async (req, res) => {
  const maThanhVien = normalizeTextValue(req.body.ma_thanh_vien);
  const requestedLibrarianId = normalizeTextValue(req.body.ma_thu_thu) || DEFAULT_LOGGED_LIBRARIAN_ID;
  const maSach = normalizeTextValue(req.body.ma_sach);
  const copyNo = normalizeIntValue(req.body.copy_no);
  const ngayMuon = normalizeDateValue(req.body.ngay_muon) || getTodayDateString();
  const ngayHenTra = normalizeDateValue(req.body.ngay_hen_tra);
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!maThanhVien || !maSach || !ngayHenTra || Number.isNaN(copyNo) || copyNo === null) {
    return res.status(400).json({
      message: "Thiếu dữ liệu bắt buộc cho phiếu mượn"
    });
  }

  try {
    const pool = await getPool();
    const maThuThu = await resolveCurrentLibrarianId(requestedLibrarianId);

    if (!maThuThu) {
      return res.status(404).json({ message: "Không tìm thấy thủ thư đăng nhập để lập phiếu" });
    }

    const memberRows = await pool
      .request()
      .input("ma_thanh_vien", sql.NVarChar(20), maThanhVien)
      .query(`
        SELECT TOP 1 ma_thanh_vien, ho_ten, tinh_trang_the
        FROM ThanhVien
        WHERE ma_thanh_vien = @ma_thanh_vien;
      `);

    if (!memberRows.recordset[0]) {
      return res.status(404).json({ message: "Không tìm thấy thành viên" });
    }

    if (isMemberCardLocked(memberRows.recordset[0].tinh_trang_the)) {
      return res.status(409).json({
        message: "Thẻ thành viên đang bị khóa, không thể mượn sách"
      });
    }

    const copyRows = await pool
      .request()
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("copy_no", sql.Int, copyNo)
      .query(`
        SELECT TOP 1 ma_sach, copy_no, tinh_trang_muon
        FROM BanSao
        WHERE ma_sach = @ma_sach AND copy_no = @copy_no;
      `);

    if (!copyRows.recordset[0]) {
      return res.status(404).json({ message: "Không tìm thấy bản sao sách cần mượn" });
    }

    const activeBorrowRows = await pool
      .request()
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("copy_no", sql.Int, copyNo)
      .query(`
        SELECT TOP 1 ma_sach
        FROM Muon
        WHERE ma_sach = @ma_sach
          AND copy_no = @copy_no
          AND ngay_tra IS NULL;
      `);

    if (activeBorrowRows.recordset[0] || normalizeStatusToken(copyRows.recordset[0].tinh_trang_muon) === "dang muon") {
      return res.status(409).json({ message: "Bản sao này hiện đang được mượn" });
    }

    await pool
      .request()
      .input("ma_thanh_vien", sql.NVarChar(20), maThanhVien)
      .input("ma_thu_thu", sql.NVarChar(20), maThuThu)
      .input("ma_sach", sql.NVarChar(20), maSach)
      .input("copy_no", sql.Int, copyNo)
      .input("ngay_muon", sql.Date, ngayMuon)
      .input("ngay_hen_tra", sql.Date, ngayHenTra)
      .input("ghi_chu", sql.NVarChar(255), ghiChu)
      .query(`
        INSERT INTO Muon (
          ma_thanh_vien,
          ma_thu_thu,
          ma_sach,
          copy_no,
          ngay_muon,
          ngay_hen_tra,
          ngay_tra,
          trang_thai,
          ghi_chu
        )
        VALUES (
          @ma_thanh_vien,
          @ma_thu_thu,
          @ma_sach,
          @copy_no,
          @ngay_muon,
          @ngay_hen_tra,
          NULL,
          N'Đang mượn',
          @ghi_chu
        );

        UPDATE BanSao
        SET tinh_trang_muon = N'Đang mượn'
        WHERE ma_sach = @ma_sach
          AND copy_no = @copy_no;
      `);

    res.status(201).json({
      message: "Lập phiếu mượn thành công",
      data: {
        ma_thanh_vien: maThanhVien,
        ma_thu_thu: maThuThu,
        ma_sach: maSach,
        copy_no: copyNo,
        ngay_muon: ngayMuon,
        ngay_hen_tra: ngayHenTra,
        trang_thai: "Đang mượn"
      }
    });
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: "Phiếu mượn này đã tồn tại" });
    }

    if (error.number === 547) {
      return res.status(400).json({
        message: "Mã thành viên, thủ thư hoặc sách không hợp lệ"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.post("/api/borrows/return", async (req, res) => {
  const maThanhVien = normalizeTextValue(req.body.ma_thanh_vien);
  const maSach = normalizeTextValue(req.body.ma_sach);
  const copyNo = normalizeIntValue(req.body.copy_no);
  const ngayMuon = normalizeDateValue(req.body.ngay_muon);
  const ngayMuonKey = normalizeTextValue(req.body.ngay_muon_key);
  const maThuThu = normalizeTextValue(req.body.ma_thu_thu) || DEFAULT_LOGGED_LIBRARIAN_ID;
  const returnDate = getTodayDateString();

  if (!maThanhVien || !maSach || Number.isNaN(copyNo) || copyNo === null || (!ngayMuon && !ngayMuonKey)) {
    return res.status(400).json({ message: "Thiếu khóa phiếu mượn để xác nhận trả sách" });
  }

  try {
    const finalLibrarianId = await resolveCurrentLibrarianId(maThuThu);

    const rows = await runQuery(
      `
      DECLARE @due_date DATE;
      DECLARE @already_returned BIT = 0;

      SELECT
        @due_date = ngay_hen_tra,
        @already_returned = CASE WHEN ngay_tra IS NOT NULL OR trang_thai = N'Đã trả' THEN 1 ELSE 0 END
      FROM Muon
      WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien))
        AND LTRIM(RTRIM(ma_sach)) = LTRIM(RTRIM(@ma_sach))
        AND copy_no = @copy_no
        AND (
          (@ngay_muon_key IS NOT NULL AND CONVERT(NVARCHAR(10), ngay_muon, 23) = @ngay_muon_key)
          OR (@ngay_muon_key IS NULL AND CONVERT(DATE, ngay_muon) = @ngay_muon)
        );

      IF @due_date IS NULL
      BEGIN
        THROW 50041, N'BORROW_NOT_FOUND', 1;
      END

      IF @already_returned = 1
      BEGIN
        THROW 50042, N'BORROW_ALREADY_RETURNED', 1;
      END

      UPDATE Muon
      SET
          ngay_tra = @ngay_tra,
          trang_thai = N'Đã trả',
          ma_thu_thu = COALESCE(@ma_thu_thu, ma_thu_thu)
      WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien))
        AND LTRIM(RTRIM(ma_sach)) = LTRIM(RTRIM(@ma_sach))
        AND copy_no = @copy_no
        AND (
          (@ngay_muon_key IS NOT NULL AND CONVERT(NVARCHAR(10), ngay_muon, 23) = @ngay_muon_key)
          OR (@ngay_muon_key IS NULL AND CONVERT(DATE, ngay_muon) = @ngay_muon)
        );

      UPDATE BanSao
      SET tinh_trang_muon = CASE
        WHEN EXISTS (
          SELECT 1
          FROM Muon m2
          WHERE m2.ma_sach = @ma_sach
            AND m2.copy_no = @copy_no
            AND m2.ngay_tra IS NULL
        ) THEN N'Đang mượn'
        ELSE N'Chưa mượn'
      END
      WHERE ma_sach = @ma_sach
        AND copy_no = @copy_no;

      SELECT
          @ma_thanh_vien AS ma_thanh_vien,
          @ma_sach AS ma_sach,
          @copy_no AS copy_no,
          @ngay_muon AS ngay_muon,
          @ngay_tra AS ngay_tra,
          CASE
            WHEN DATEDIFF(DAY, @due_date, @ngay_tra) > 0 THEN DATEDIFF(DAY, @due_date, @ngay_tra)
            ELSE 0
          END AS so_ngay_qua_han,
          CASE
            WHEN DATEDIFF(DAY, @due_date, @ngay_tra) > 0 THEN DATEDIFF(DAY, @due_date, @ngay_tra) * @fine_per_day
            ELSE 0
          END AS tien_phat;
      `,
      [
        { name: "ma_thanh_vien", type: sql.NVarChar(20), value: maThanhVien },
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "copy_no", type: sql.Int, value: copyNo },
        { name: "ngay_muon", type: sql.Date, value: ngayMuon },
        { name: "ngay_muon_key", type: sql.NVarChar(10), value: ngayMuonKey },
        { name: "ngay_tra", type: sql.Date, value: returnDate },
        { name: "ma_thu_thu", type: sql.NVarChar(20), value: finalLibrarianId },
        { name: "fine_per_day", type: sql.Int, value: BORROW_FINE_PER_DAY }
      ]
    );

    const result = rows[0];
    res.json({
      message:
        result && result.tien_phat > 0
          ? `Xác nhận trả sách thành công. Phát sinh tiền phạt ${Number(result.tien_phat).toLocaleString("vi-VN")} VND.`
          : "Xác nhận trả sách thành công.",
      data: result || null
    });
  } catch (error) {
    if (error.number === 50041) {
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn để xác nhận trả" });
    }

    if (error.number === 50042) {
      return res.status(409).json({ message: "Phiếu mượn đã được trả trước đó" });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.put("/api/borrows/update", async (req, res) => {
  const maThanhVien = normalizeTextValue(req.body.ma_thanh_vien);
  const maSach = normalizeTextValue(req.body.ma_sach);
  const copyNo = normalizeIntValue(req.body.copy_no);
  const ngayMuon = normalizeDateValue(req.body.ngay_muon);
  const ngayMuonKey = normalizeTextValue(req.body.ngay_muon_key);
  const maThuThu = normalizeTextValue(req.body.ma_thu_thu);
  const ngayHenTra = normalizeDateValue(req.body.ngay_hen_tra);
  const ngayTra = normalizeDateValue(req.body.ngay_tra);
  const trangThaiInput = normalizeTextValue(req.body.trang_thai);
  const ghiChu = normalizeTextValue(req.body.ghi_chu);

  if (!maThanhVien || !maSach || (!ngayMuon && !ngayMuonKey) || Number.isNaN(copyNo) || copyNo === null) {
    return res.status(400).json({ message: "Thiếu khóa phiếu mượn cần cập nhật" });
  }

  if (trangThaiInput === "Đã trả" && !ngayTra) {
    return res.status(400).json({
      message: "Khi trạng thái là 'Đã trả' thì cần nhập ngày trả"
    });
  }

  let trangThai = trangThaiInput || (ngayTra ? "Đã trả" : "Đang mượn");
  let resolvedNgayTra = ngayTra;

  if (trangThai === "Quá hạn") {
    trangThai = "Đang mượn";
  }

  if (trangThai !== "Đang mượn" && trangThai !== "Đã trả") {
    return res.status(400).json({
      message: "trang_thai không hợp lệ. Chỉ chấp nhận Đang mượn hoặc Đã trả"
    });
  }

  if (trangThai === "Đang mượn") {
    resolvedNgayTra = null;
  }

  if (trangThai === "Đã trả" && !resolvedNgayTra) {
    return res.status(400).json({
      message: "Khi trạng thái là 'Đã trả' thì cần nhập ngày trả"
    });
  }

  try {
    const affectedRows = await runQuery(
      `
      DECLARE @affected INT = 0;

      UPDATE Muon
      SET
          ma_thu_thu = COALESCE(@ma_thu_thu, ma_thu_thu),
          ngay_hen_tra = COALESCE(@ngay_hen_tra, ngay_hen_tra),
          ngay_tra = @ngay_tra,
          trang_thai = @trang_thai,
          ghi_chu = COALESCE(@ghi_chu, ghi_chu)
      WHERE LTRIM(RTRIM(ma_thanh_vien)) = LTRIM(RTRIM(@ma_thanh_vien))
        AND LTRIM(RTRIM(ma_sach)) = LTRIM(RTRIM(@ma_sach))
        AND copy_no = @copy_no
        AND (
          (@ngay_muon_key IS NOT NULL AND CONVERT(NVARCHAR(10), ngay_muon, 23) = @ngay_muon_key)
          OR (@ngay_muon_key IS NULL AND CONVERT(DATE, ngay_muon) = @ngay_muon)
        );

      SET @affected = @@ROWCOUNT;

      IF @affected > 0
      BEGIN
        UPDATE BanSao
        SET tinh_trang_muon = CASE
          WHEN EXISTS (
            SELECT 1
            FROM Muon m2
            WHERE m2.ma_sach = @ma_sach
              AND m2.copy_no = @copy_no
              AND m2.ngay_tra IS NULL
          ) THEN N'Đang mượn'
          ELSE N'Chưa mượn'
        END
        WHERE ma_sach = @ma_sach
          AND copy_no = @copy_no;
      END

      SELECT @affected AS affected;
      `,
      [
        { name: "ma_thanh_vien", type: sql.NVarChar(20), value: maThanhVien },
        { name: "ma_sach", type: sql.NVarChar(20), value: maSach },
        { name: "copy_no", type: sql.Int, value: copyNo },
        { name: "ngay_muon", type: sql.Date, value: ngayMuon },
        { name: "ngay_muon_key", type: sql.NVarChar(10), value: ngayMuonKey },
        { name: "ma_thu_thu", type: sql.NVarChar(20), value: maThuThu },
        { name: "ngay_hen_tra", type: sql.Date, value: ngayHenTra },
        { name: "ngay_tra", type: sql.Date, value: resolvedNgayTra },
        { name: "trang_thai", type: sql.NVarChar(50), value: trangThai },
        { name: "ghi_chu", type: sql.NVarChar(255), value: ghiChu }
      ]
    );

    if (!affectedRows[0] || affectedRows[0].affected === 0) {
      return res.status(404).json({ message: "Không tìm thấy phiếu mượn để cập nhật" });
    }

    res.json({ message: "Cập nhật phiếu mượn thành công" });
  } catch (error) {
    if (error.number === 547) {
      return res.status(400).json({
        message: "Dữ liệu thủ thư hoặc thông tin mượn không hợp lệ"
      });
    }

    res.status(500).json({ message: getErrorDetail(error) });
  }
});

app.get("/api/dashboard/summary", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
        (SELECT COUNT(*) FROM Sach) AS tong_sach,
        (SELECT COUNT(*) FROM BanSao) AS tong_ban_sao,
        (SELECT COUNT(*) FROM ThanhVien) AS tong_thanh_vien,
        (SELECT COUNT(*) FROM NhaCungCap) AS tong_nha_cung_cap,
        (SELECT COUNT(*) FROM ChiNhanh) AS tong_chi_nhanh,
        (SELECT COUNT(*) FROM Muon WHERE ngay_tra IS NULL AND ngay_hen_tra >= CAST(GETDATE() AS DATE)) AS dang_muon,
        (SELECT COUNT(*) FROM Muon WHERE ngay_tra IS NULL AND ngay_hen_tra < CAST(GETDATE() AS DATE)) AS qua_han
    `);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/members", async (req, res) => {
  try {
    const rows = await runQuery(`
      SELECT
          ma_thanh_vien,
          ho_ten,
          sdt,
          dia_chi,
          ngay_dang_ky,
          tinh_trang_the,
          ghi_chu
      FROM ThanhVien
      ORDER BY ngay_dang_ky DESC, ma_thanh_vien DESC;
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/borrow-list", async (req, res) => {
  const keyword = normalizeTextValue(req.query.keyword);
  const status = normalizeTextValue(req.query.status);

  try {
    const rows = await runQuery(
      `
      SELECT
          m.ma_thanh_vien,
          m.ma_thu_thu,
          m.ma_sach,
          s.ten_sach,
          m.copy_no,
          m.ngay_muon,
          CONVERT(NVARCHAR(10), m.ngay_muon, 23) AS ngay_muon_key,
          m.ngay_hen_tra,
          m.ngay_tra,
          CASE
            WHEN m.ngay_tra IS NULL AND m.ngay_hen_tra < CAST(GETDATE() AS DATE) THEN N'Quá hạn'
            WHEN m.ngay_tra IS NULL THEN N'Đang mượn'
            ELSE N'Đã trả'
          END AS trang_thai,
          CASE
            WHEN DATEDIFF(DAY, m.ngay_hen_tra, COALESCE(m.ngay_tra, CAST(GETDATE() AS DATE))) > 0
              THEN DATEDIFF(DAY, m.ngay_hen_tra, COALESCE(m.ngay_tra, CAST(GETDATE() AS DATE)))
            ELSE 0
          END AS so_ngay_qua_han,
          CASE
            WHEN DATEDIFF(DAY, m.ngay_hen_tra, COALESCE(m.ngay_tra, CAST(GETDATE() AS DATE))) > 0
              THEN DATEDIFF(DAY, m.ngay_hen_tra, COALESCE(m.ngay_tra, CAST(GETDATE() AS DATE))) * @fine_per_day
            ELSE 0
          END AS tien_phat,
          m.ghi_chu,
          tv.ho_ten AS ten_thanh_vien,
          tt.ho_ten AS ten_thu_thu
      FROM Muon m
      JOIN Sach s ON m.ma_sach = s.ma_sach
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      JOIN ThuThu tt ON m.ma_thu_thu = tt.ma_thu_thu
      WHERE (
          @status IS NULL
          OR (
            @status = N'Quá hạn'
            AND m.ngay_tra IS NULL
            AND m.ngay_hen_tra < CAST(GETDATE() AS DATE)
          )
          OR (
            @status = N'Đang mượn'
            AND m.ngay_tra IS NULL
            AND m.ngay_hen_tra >= CAST(GETDATE() AS DATE)
          )
          OR (
            @status = N'Đã trả'
            AND m.ngay_tra IS NOT NULL
          )
      )
      AND (
          @keyword IS NULL
          OR tv.ho_ten LIKE N'%' + @keyword + N'%'
          OR s.ten_sach LIKE N'%' + @keyword + N'%'
          OR m.ma_thanh_vien LIKE N'%' + @keyword + N'%'
          OR m.ma_sach LIKE N'%' + @keyword + N'%'
          OR CAST(m.copy_no AS NVARCHAR(20)) LIKE N'%' + @keyword + N'%'
      )
      ORDER BY m.ngay_muon DESC;
      `,
      [
        { name: "status", type: sql.NVarChar(50), value: status },
        { name: "keyword", type: sql.NVarChar(255), value: keyword },
        { name: "fine_per_day", type: sql.Int, value: BORROW_FINE_PER_DAY }
      ]
    );

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
          m.ma_thanh_vien,
          m.copy_no,
          m.ngay_muon,
          m.ngay_hen_tra,
          DATEDIFF(DAY, m.ngay_hen_tra, CAST(GETDATE() AS DATE)) AS so_ngay_qua_han,
          DATEDIFF(DAY, m.ngay_hen_tra, CAST(GETDATE() AS DATE)) * @fine_per_day AS tien_phat_tam_tinh,
          N'Quá hạn' AS trang_thai_hien_thi
      FROM Muon m
      JOIN Sach s ON m.ma_sach = s.ma_sach
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      WHERE m.ngay_tra IS NULL
        AND m.ngay_hen_tra < CAST(GETDATE() AS DATE)
      ORDER BY so_ngay_qua_han DESC;
    `, [{ name: "fine_per_day", type: sql.Int, value: BORROW_FINE_PER_DAY }]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/reports/shifts", async (req, res) => {
  const month = Number(req.query.month || new Date().getMonth() + 1);
  const year = Number(req.query.year || new Date().getFullYear());

  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
    return res.status(400).json({ message: "month/year không hợp lệ" });
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
          s.ten_sach,
          m.copy_no,
          m.ngay_muon,
          m.ngay_hen_tra,
          CASE
            WHEN m.ngay_hen_tra < CAST(GETDATE() AS DATE)
              THEN DATEDIFF(DAY, m.ngay_hen_tra, CAST(GETDATE() AS DATE))
            ELSE 0
          END AS so_ngay_qua_han,
          CASE
            WHEN m.ngay_hen_tra < CAST(GETDATE() AS DATE)
              THEN DATEDIFF(DAY, m.ngay_hen_tra, CAST(GETDATE() AS DATE)) * @fine_per_day
            ELSE 0
          END AS tien_phat_tam_tinh,
          CASE
            WHEN m.ngay_hen_tra < CAST(GETDATE() AS DATE) THEN N'Quá hạn'
            ELSE N'Đang mượn'
          END AS trang_thai_hien_thi
      FROM Muon m
      JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
      JOIN Sach s ON m.ma_sach = s.ma_sach
      WHERE m.ngay_tra IS NULL
      ORDER BY
        CASE WHEN m.ngay_hen_tra < CAST(GETDATE() AS DATE) THEN 0 ELSE 1 END,
        m.ngay_hen_tra ASC,
        tv.ho_ten ASC;
    `, [{ name: "fine_per_day", type: sql.Int, value: BORROW_FINE_PER_DAY }]);

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

function startServer(startPort, retries = 10) {
  const server = app.listen(startPort, () => {
    console.log(`Server running at http://localhost:${startPort}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE" && retries > 0) {
      const nextPort = startPort + 1;
      console.warn(`Port ${startPort} is in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, retries - 1);
      return;
    }

    console.error("Cannot start server:", getErrorDetail(error));
    process.exit(1);
  });
}

startServer(port);
