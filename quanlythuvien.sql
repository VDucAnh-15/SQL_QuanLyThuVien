-- =============================================
-- 1. TẠO DATABASE
-- =============================================
IF DB_ID(N'QuanLyThuVien') IS NULL
BEGIN
    CREATE DATABASE QuanLyThuVien;
END
GO

USE QuanLyThuVien;
GO

-- =============================================
-- 2. XÓA BẢNG CŨ 
-- =============================================
IF OBJECT_ID('CungCap', 'U') IS NOT NULL DROP TABLE CungCap;
IF OBJECT_ID('NhaCungCap', 'U') IS NOT NULL DROP TABLE NhaCungCap;
IF OBJECT_ID('ChamCong', 'U') IS NOT NULL DROP TABLE ChamCong;
IF OBJECT_ID('CaLam', 'U') IS NOT NULL DROP TABLE CaLam;
IF OBJECT_ID('Muon', 'U') IS NOT NULL DROP TABLE Muon;
IF OBJECT_ID('ThuThu', 'U') IS NOT NULL DROP TABLE ThuThu;
IF OBJECT_ID('ThanhVien', 'U') IS NOT NULL DROP TABLE ThanhVien;
IF OBJECT_ID('BanSao', 'U') IS NOT NULL DROP TABLE BanSao;
IF OBJECT_ID('TapChi', 'U') IS NOT NULL DROP TABLE TapChi;
IF OBJECT_ID('TieuThuyet', 'U') IS NOT NULL DROP TABLE TieuThuyet;
IF OBJECT_ID('GiaoTrinh', 'U') IS NOT NULL DROP TABLE GiaoTrinh;
IF OBJECT_ID('Sach', 'U') IS NOT NULL DROP TABLE Sach;
IF OBJECT_ID('ChiNhanh', 'U') IS NOT NULL DROP TABLE ChiNhanh;
GO

-- =============================================
-- 3. TẠO BẢNG
-- =============================================

CREATE TABLE Sach (
    ma_sach NVARCHAR(20) PRIMARY KEY,
    ten_sach NVARCHAR(255) NOT NULL,
    tac_gia NVARCHAR(255),
    nha_xb NVARCHAR(255),
    nam_xb INT,
    so_trang INT,
    gia_tri DECIMAL(18,2)
);
GO

CREATE TABLE GiaoTrinh (
    ma_sach NVARCHAR(20) PRIMARY KEY,
    cap_hoc NVARCHAR(50),
    mon_hoc NVARCHAR(100),
    FOREIGN KEY (ma_sach) REFERENCES Sach(ma_sach)
);
GO

CREATE TABLE TieuThuyet (
    ma_sach NVARCHAR(20) PRIMARY KEY,
    the_loai NVARCHAR(100),
    FOREIGN KEY (ma_sach) REFERENCES Sach(ma_sach)
);
GO

CREATE TABLE TapChi (
    ma_sach NVARCHAR(20) PRIMARY KEY,
    so_phat_hanh INT,
    thang_phat_hanh INT,
    FOREIGN KEY (ma_sach) REFERENCES Sach(ma_sach)
);
GO

CREATE TABLE ChiNhanh (
    ma_chi_nhanh NVARCHAR(20) PRIMARY KEY,
    ten NVARCHAR(255) NOT NULL,
    dia_chi NVARCHAR(255),
    so_dien_thoai NVARCHAR(20)
);
GO

CREATE TABLE BanSao (
    ma_sach NVARCHAR(20),
    copy_no INT,
    ngay_nhap DATE,
    tinh_trang_muon NVARCHAR(100),
    tinh_trang_vat_ly NVARCHAR(100),
    ghi_chu NVARCHAR(255),
    ma_chi_nhanh NVARCHAR(20),

    PRIMARY KEY (ma_sach, copy_no),
    FOREIGN KEY (ma_sach) REFERENCES Sach(ma_sach),
    FOREIGN KEY (ma_chi_nhanh) REFERENCES ChiNhanh(ma_chi_nhanh)
);
GO

CREATE TABLE ThanhVien (
    ma_thanh_vien NVARCHAR(20) PRIMARY KEY,
    ho_ten NVARCHAR(255) NOT NULL,
    sdt NVARCHAR(20),
    dia_chi NVARCHAR(255),
    ngay_dang_ky DATE,
    tinh_trang_the NVARCHAR(100),
    ghi_chu NVARCHAR(255)
);
GO

CREATE TABLE ThuThu (
    ma_thu_thu NVARCHAR(20) PRIMARY KEY,
    ho_ten NVARCHAR(255) NOT NULL,
    sdt NVARCHAR(20),
    email NVARCHAR(100),
    ma_chi_nhanh NVARCHAR(20),
    FOREIGN KEY (ma_chi_nhanh) REFERENCES ChiNhanh(ma_chi_nhanh)
);
GO

CREATE TABLE Muon (
    ma_thanh_vien NVARCHAR(20),
    ma_thu_thu NVARCHAR(20),
    ma_sach NVARCHAR(20),
    copy_no INT,
    ngay_muon DATE,
    ngay_hen_tra DATE,
    ngay_tra DATE,
    trang_thai NVARCHAR(50),
    ghi_chu NVARCHAR(255),

    PRIMARY KEY (ma_thanh_vien, ma_sach, copy_no, ngay_muon),
    FOREIGN KEY (ma_thanh_vien) REFERENCES ThanhVien(ma_thanh_vien),
    FOREIGN KEY (ma_thu_thu) REFERENCES ThuThu(ma_thu_thu),
    FOREIGN KEY (ma_sach, copy_no) REFERENCES BanSao(ma_sach, copy_no)
);
GO

CREATE TABLE CaLam (
    ma_ca_lam NVARCHAR(20) PRIMARY KEY,
    thoi_gian_bat_dau TIME,
    thoi_gian_ket_thuc TIME
);
GO

CREATE TABLE ChamCong (
    ma_ca_lam NVARCHAR(20),
    ma_thu_thu NVARCHAR(20),
    ngay_lam_viec DATE,

    PRIMARY KEY (ma_ca_lam, ma_thu_thu, ngay_lam_viec),
    FOREIGN KEY (ma_ca_lam) REFERENCES CaLam(ma_ca_lam),
    FOREIGN KEY (ma_thu_thu) REFERENCES ThuThu(ma_thu_thu)
);
GO

CREATE TABLE NhaCungCap (
    ma_ncc NVARCHAR(20) PRIMARY KEY,
    ten_ncc NVARCHAR(255),
    sdt NVARCHAR(20),
    email NVARCHAR(100),
    dia_chi NVARCHAR(255)
);
GO

CREATE TABLE CungCap (
    ma_ncc NVARCHAR(20),
    ma_chi_nhanh NVARCHAR(20),

    PRIMARY KEY (ma_ncc, ma_chi_nhanh),
    FOREIGN KEY (ma_ncc) REFERENCES NhaCungCap(ma_ncc),
    FOREIGN KEY (ma_chi_nhanh) REFERENCES ChiNhanh(ma_chi_nhanh)
);
GO

-- =============================================
-- 4. INSERT DỮ LIỆU
-- =============================================

-- CHI NHÁNH
INSERT INTO ChiNhanh (ma_chi_nhanh, ten, dia_chi, so_dien_thoai)
VALUES
(N'DT01', N'Chi nhánh 1', N'Địa chỉ 1', N'0900000001'),
(N'DT02', N'Chi nhánh 2', N'Địa chỉ 2', N'0900000002'),
(N'DT03', N'Chi nhánh 3', N'Địa chỉ 3', N'0900000003'),
(N'DT04', N'Chi nhánh 4', N'Địa chỉ 4', N'0900000004'),
(N'DT05', N'Chi nhánh 5', N'Địa chỉ 5', N'0900000005'),
(N'DT06', N'Chi nhánh 6', N'Địa chỉ 6', N'0900000006'),
(N'DT07', N'Chi nhánh 7', N'Địa chỉ 7', N'0900000007'),
(N'DT08', N'Chi nhánh 8', N'Địa chỉ 8', N'0900000008'),
(N'DT09', N'Chi nhánh 9', N'Địa chỉ 9', N'0900000009'),
(N'DT10', N'Chi nhánh 10', N'Địa chỉ 10', N'0900000010');
GO

-- NHÀ CUNG CẤP
INSERT INTO NhaCungCap (ma_ncc, ten_ncc, sdt, email, dia_chi)
VALUES
(N'NCC01', N'Nhà cung cấp 1', N'0911111111', N'ncc1@mail.com', N'Địa chỉ NCC1'),
(N'NCC02', N'Nhà cung cấp 2', N'0911111112', N'ncc2@mail.com', N'Địa chỉ NCC2'),
(N'NCC03', N'Nhà cung cấp 3', N'0911111113', N'ncc3@mail.com', N'Địa chỉ NCC3'),
(N'NCC04', N'Nhà cung cấp 4', N'0911111114', N'ncc4@mail.com', N'Địa chỉ NCC4'),
(N'NCC05', N'Nhà cung cấp 5', N'0911111115', N'ncc5@mail.com', N'Địa chỉ NCC5'),
(N'NCC06', N'Nhà cung cấp 6', N'0911111116', N'ncc6@mail.com', N'Địa chỉ NCC6'),
(N'NCC07', N'Nhà cung cấp 7', N'0911111117', N'ncc7@mail.com', N'Địa chỉ NCC7'),
(N'NCC08', N'Nhà cung cấp 8', N'0911111118', N'ncc8@mail.com', N'Địa chỉ NCC8'),
(N'NCC09', N'Nhà cung cấp 9', N'0911111119', N'ncc9@mail.com', N'Địa chỉ NCC9'),
(N'NCC10', N'Nhà cung cấp 10', N'0911111120', N'ncc10@mail.com', N'Địa chỉ NCC10');
GO

-- CA LÀM
INSERT INTO CaLam (ma_ca_lam, thoi_gian_bat_dau, thoi_gian_ket_thuc)
VALUES
(N'CA01', '07:00', '11:00'),
(N'CA02', '11:00', '15:00'),
(N'CA03', '15:00', '19:00'),
(N'CA04', '19:00', '23:00'),
(N'CA05', '08:00', '12:00'),
(N'CA06', '12:00', '16:00'),
(N'CA07', '16:00', '20:00'),
(N'CA08', '07:30', '11:30'),
(N'CA09', '13:00', '17:00'),
(N'CA10', '17:00', '21:00');
GO

-- SÁCH
INSERT INTO Sach (ma_sach, ten_sach, tac_gia, nha_xb, nam_xb, so_trang, gia_tri)
VALUES
(N'S001', N'Giải tích 1', N'Nguyễn Văn A', N'NXB Giáo Dục', 2020, 250, 85000),
(N'S002', N'Vật lý đại cương', N'Trần Thị B', N'NXB Giáo Dục', 2019, 300, 90000),
(N'S003', N'Lập trình C cơ bản', N'Lê Văn C', N'NXB Khoa Học', 2021, 280, 95000),
(N'S004', N'Toán rời rạc', N'Phạm Văn D', N'NXB Đại Học', 2022, 320, 100000),
(N'S005', N'Kinh tế vi mô', N'Hoàng Văn E', N'NXB Đại Học', 2018, 270, 88000),
(N'S006', N'Dế Mèn phiêu lưu ký', N'Tô Hoài', N'NXB Kim Đồng', 2017, 150, 50000),
(N'S007', N'Tắt đèn', N'Ngô Tất Tố', N'NXB Văn Học', 2016, 210, 65000),
(N'S008', N'Lão Hạc', N'Nam Cao', N'NXB Văn Học', 2015, 180, 55000),
(N'S009', N'Tạp chí Khoa học số 1', N'Nhiều tác giả', N'NXB Khoa Học', 2023, 120, 40000),
(N'S010', N'Tạp chí Công nghệ số 2', N'Nhiều tác giả', N'NXB Công Nghệ', 2023, 100, 42000);
GO

-- GIÁO TRÌNH
INSERT INTO GiaoTrinh (ma_sach, cap_hoc, mon_hoc)
VALUES
(N'S001', N'Đại học', N'Giải tích'),
(N'S002', N'Đại học', N'Vật lý đại cương'),
(N'S003', N'Đại học', N'Lập trình C'),
(N'S004', N'Đại học', N'Toán rời rạc'),
(N'S005', N'Đại học', N'Kinh tế vi mô');
GO

-- TIỂU THUYẾT
INSERT INTO TieuThuyet (ma_sach, the_loai)
VALUES
(N'S006', N'Phiêu lưu'),
(N'S007', N'Hiện thực'),
(N'S008', N'Hiện thực');
GO

-- TẠP CHÍ
INSERT INTO TapChi (ma_sach, so_phat_hanh, thang_phat_hanh)
VALUES
(N'S009', 1, 1),
(N'S010', 2, 2);
GO

-- NHÀ CUNG CẤP
INSERT INTO CungCap (ma_ncc, ma_chi_nhanh)
VALUES
(N'NCC01', N'DT01'),
(N'NCC01', N'DT03'),
(N'NCC01', N'DT05'),

(N'NCC02', N'DT02'),
(N'NCC02', N'DT04'),

(N'NCC03', N'DT01'),
(N'NCC03', N'DT06'),
(N'NCC03', N'DT07'),

(N'NCC04', N'DT08'),

(N'NCC05', N'DT02'),
(N'NCC05', N'DT09'),

(N'NCC06', N'DT03'),
(N'NCC06', N'DT10'),

(N'NCC07', N'DT04'),
(N'NCC07', N'DT05'),
(N'NCC07', N'DT06'),

(N'NCC08', N'DT07'),

(N'NCC09', N'DT08'),
(N'NCC09', N'DT09'),

(N'NCC10', N'DT10'),
(N'NCC10', N'DT01');
GO

-- BẢN SAO
INSERT INTO BanSao (ma_sach, copy_no, ngay_nhap, tinh_trang_muon, tinh_trang_vat_ly, ghi_chu, ma_chi_nhanh)
VALUES
(N'S001', 1, '2023-01-01', N'Đang mượn', N'Tốt', NULL, N'DT01'),
(N'S001', 2, '2023-01-05', N'Chưa mượn', N'Tốt', NULL, N'DT02'),
(N'S001', 3, '2023-01-08', N'Chưa mượn', N'Trung bình', NULL, N'DT03'),

(N'S002', 1, '2023-01-02', N'Đang mượn', N'Tốt', NULL, N'DT02'),
(N'S002', 2, '2023-01-06', N'Đang mượn', N'Tốt', NULL, N'DT04'),

(N'S003', 1, '2023-01-03', N'Chưa mượn', N'Trung bình', NULL, N'DT03'),
(N'S003', 2, '2023-01-07', N'Chưa mượn', N'Tốt', NULL, N'DT05'),

(N'S004', 1, '2023-01-04', N'Đang mượn', N'Tốt', NULL, N'DT04'),
(N'S004', 2, '2023-01-09', N'Chưa mượn', N'Tốt', NULL, N'DT06'),

(N'S005', 1, '2023-01-05', N'Đang mượn', N'Xấu', NULL, N'DT05'),
(N'S005', 2, '2023-01-10', N'Chưa mượn', N'Hỏng gáy', NULL, N'DT07'),

(N'S006', 1, '2023-01-06', N'Chưa mượn', N'Tốt', NULL, N'DT06'),
(N'S006', 2, '2023-01-11', N'Đang mượn', N'Tốt', NULL, N'DT08'),

(N'S007', 1, '2023-01-07', N'Đang mượn', N'Tốt', NULL, N'DT07'),
(N'S007', 2, '2023-01-12', N'Chưa mượn', N'Trung bình', NULL, N'DT09'),

(N'S008', 1, '2023-01-08', N'Đang mượn', N'Tốt', NULL, N'DT08'),
(N'S008', 2, '2023-01-13', N'Chưa mượn', N'Tốt', NULL, N'DT10'),

(N'S009', 1, '2023-01-09', N'Chưa mượn', N'Tốt', NULL, N'DT09'),
(N'S009', 2, '2023-01-14', N'Đang mượn', N'Tốt', NULL, N'DT01'),

(N'S010', 1, '2023-01-10', N'Đang mượn', N'Tốt', NULL, N'DT10'),
(N'S010', 2, '2023-01-15', N'Chưa mượn', N'Tốt', NULL, N'DT02');
GO

-- THÀNH VIÊN
INSERT INTO ThanhVien (ma_thanh_vien, ho_ten, sdt, dia_chi, ngay_dang_ky, tinh_trang_the, ghi_chu)
VALUES
(N'TV01', N'Nguyễn Văn A', N'0901111111', N'Hà Nội', '2023-01-01', N'Hoạt động', NULL),
(N'TV02', N'Trần Thị B', N'0902222222', N'Hồ Chí Minh', '2023-01-02', N'Hoạt động', NULL),
(N'TV03', N'Lê Văn C', N'0903333333', N'Đà Nẵng', '2023-01-03', N'Khóa', NULL),
(N'TV04', N'Phạm Thị D', N'0904444444', N'Huế', '2023-01-04', N'Hoạt động', NULL),
(N'TV05', N'Hoàng Văn E', N'0905555555', N'Hà Nội', '2023-01-05', N'Hoạt động', NULL),
(N'TV06', N'Nguyễn Văn F', N'0906666666', N'Hồ Chí Minh', '2023-01-06', N'Khóa', NULL),
(N'TV07', N'Trần Văn G', N'0907777777', N'Đà Nẵng', '2023-01-07', N'Hoạt động', NULL),
(N'TV08', N'Lê Thị H', N'0908888888', N'Huế', '2023-01-08', N'Hoạt động', NULL),
(N'TV09', N'Phạm Văn I', N'0909999999', N'Hà Nội', '2023-01-09', N'Hoạt động', NULL),
(N'TV10', N'Hoàng Thị J', N'0910000000', N'Hồ Chí Minh', '2023-01-10', N'Khóa', NULL);
GO

-- THỦ THƯ
INSERT INTO ThuThu (ma_thu_thu, ho_ten, sdt, email, ma_chi_nhanh)
VALUES
(N'TT01', N'Thủ thư 1', N'0901111111', N'tt1@mail.com', N'DT01'),
(N'TT02', N'Thủ thư 2', N'0902222222', N'tt2@mail.com', N'DT02'),
(N'TT03', N'Thủ thư 3', N'0903333333', N'tt3@mail.com', N'DT03'),
(N'TT04', N'Thủ thư 4', N'0904444444', N'tt4@mail.com', N'DT04'),
(N'TT05', N'Thủ thư 5', N'0905555555', N'tt5@mail.com', N'DT05'),
(N'TT06', N'Thủ thư 6', N'0906666666', N'tt6@mail.com', N'DT06'),
(N'TT07', N'Thủ thư 7', N'0907777777', N'tt7@mail.com', N'DT07'),
(N'TT08', N'Thủ thư 8', N'0908888888', N'tt8@mail.com', N'DT08'),
(N'TT09', N'Thủ thư 9', N'0909999999', N'tt9@mail.com', N'DT09'),
(N'TT10', N'Thủ thư 10', N'0910000000', N'tt10@mail.com', N'DT10');
GO

-- MƯỢN
INSERT INTO Muon (ma_thanh_vien, ma_thu_thu, ma_sach, copy_no, ngay_muon, ngay_hen_tra, ngay_tra, trang_thai, ghi_chu)
VALUES
(N'TV01', N'TT01', N'S001', 1, '2023-02-01', '2023-02-10', NULL, N'Đang mượn', NULL),
(N'TV01', N'TT03', N'S009', 2, '2023-03-01', '2023-03-10', '2023-03-08', N'Đã trả', NULL),
(N'TV01', N'TT02', N'S003', 1, '2023-04-01', '2023-04-10', '2023-04-09', N'Đã trả', NULL),

(N'TV02', N'TT02', N'S002', 1, '2023-02-02', '2023-02-12', NULL, N'Đang mượn', NULL),
(N'TV02', N'TT04', N'S004', 2, '2023-03-05', '2023-03-15', '2023-03-14', N'Đã trả', NULL),

(N'TV03', N'TT03', N'S003', 2, '2023-01-20', '2023-01-30', '2023-01-29', N'Đã trả', NULL),

(N'TV04', N'TT04', N'S004', 1, '2023-02-04', '2023-02-14', NULL, N'Đang mượn', NULL),
(N'TV04', N'TT06', N'S006', 1, '2023-03-12', '2023-03-22', '2023-03-20', N'Đã trả', NULL),

(N'TV05', N'TT05', N'S005', 1, '2023-02-05', '2023-02-15', NULL, N'Đang mượn', NULL),

(N'TV06', N'TT08', N'S006', 2, '2023-02-06', '2023-02-16', NULL, N'Đang mượn', NULL),
(N'TV06', N'TT01', N'S001', 2, '2023-03-02', '2023-03-12', '2023-03-10', N'Đã trả', NULL),

(N'TV07', N'TT07', N'S007', 1, '2023-02-07', '2023-02-17', NULL, N'Đang mượn', NULL),
(N'TV07', N'TT09', N'S007', 2, '2023-03-10', '2023-03-20', '2023-03-18', N'Đã trả', NULL),

(N'TV08', N'TT08', N'S008', 1, '2023-02-08', '2023-02-18', NULL, N'Đang mượn', NULL),

(N'TV09', N'TT09', N'S009', 1, '2023-01-22', '2023-02-01', '2023-01-31', N'Đã trả', NULL),

(N'TV10', N'TT10', N'S010', 1, '2023-02-10', '2023-02-20', NULL, N'Đang mượn', NULL),
(N'TV10', N'TT02', N'S010', 2, '2023-03-15', '2023-03-25', '2023-03-24', N'Đã trả', NULL);
GO

-- CHẤM CÔNG
INSERT INTO ChamCong (ma_ca_lam, ma_thu_thu, ngay_lam_viec)
VALUES
(N'CA01', N'TT01', '2023-03-01'),
(N'CA03', N'TT01', '2023-03-05'),
(N'CA05', N'TT01', '2023-03-10'),

(N'CA02', N'TT02', '2023-03-02'),
(N'CA06', N'TT02', '2023-03-06'),

(N'CA03', N'TT03', '2023-03-03'),
(N'CA07', N'TT03', '2023-03-09'),
(N'CA08', N'TT03', '2023-03-15'),
(N'CA10', N'TT03', '2023-03-20'),

(N'CA04', N'TT04', '2023-03-04'),

(N'CA05', N'TT05', '2023-03-05'),
(N'CA09', N'TT05', '2023-03-12'),

(N'CA06', N'TT06', '2023-03-06'),
(N'CA10', N'TT06', '2023-03-18'),

(N'CA07', N'TT07', '2023-03-07'),
(N'CA01', N'TT07', '2023-03-14'),
(N'CA04', N'TT07', '2023-03-21'),

(N'CA08', N'TT08', '2023-03-08'),

(N'CA09', N'TT09', '2023-03-09'),
(N'CA02', N'TT09', '2023-03-16'),

(N'CA10', N'TT10', '2023-03-10'),
(N'CA03', N'TT10', '2023-03-17'),
(N'CA05', N'TT10', '2023-03-24');
GO

-- =============================================
-- 5. CÁC CÂU TRUY VẤN
-- =============================================

-- 1. Danh sách mượn sách
SELECT 
    m.ma_sach,
    s.ten_sach,
    m.copy_no,
    m.ngay_muon,
    m.ngay_hen_tra,
    m.ngay_tra,
    tv.ho_ten AS ten_thanh_vien,
    tt.ho_ten AS ten_thu_thu
FROM Muon m
JOIN Sach s ON m.ma_sach = s.ma_sach
JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
JOIN ThuThu tt ON m.ma_thu_thu = tt.ma_thu_thu;
GO

-- 2. Sách đang mượn và quá hạn
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
  AND m.ngay_hen_tra < GETDATE();
GO

-- 3. Đếm số ca làm trong tháng 3/2023
SELECT 
    tt.ma_thu_thu,
    tt.ho_ten,
    COUNT(cc.ma_ca_lam) AS so_ca_lam
FROM ChamCong cc
JOIN ThuThu tt ON cc.ma_thu_thu = tt.ma_thu_thu
WHERE MONTH(cc.ngay_lam_viec) = 3 
  AND YEAR(cc.ngay_lam_viec) = 2023
GROUP BY tt.ma_thu_thu, tt.ho_ten;
GO

-- 4. Đếm số lượng sách theo môn học hoặc thể loại
SELECT 
    gt.mon_hoc AS loai_sach,
    COUNT(s.ma_sach) AS so_luong
FROM Sach s
JOIN GiaoTrinh gt ON s.ma_sach = gt.ma_sach
GROUP BY gt.mon_hoc

UNION

SELECT 
    tt.the_loai AS loai_sach,
    COUNT(s2.ma_sach) AS so_luong
FROM Sach s2
JOIN TieuThuyet tt ON s2.ma_sach = tt.ma_sach
GROUP BY tt.the_loai;
GO

-- 5. Số lần mượn của từng thành viên
SELECT 
    tv.ma_thanh_vien,
    tv.ho_ten,
    COUNT(*) AS so_lan_muon
FROM Muon m
JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
GROUP BY tv.ma_thanh_vien, tv.ho_ten
ORDER BY so_lan_muon DESC;
GO

-- 6. Thành viên quá hạn chưa trả
SELECT 
    tv.ma_thanh_vien,
    tv.ho_ten,
    m.ma_sach,
    m.ngay_muon,
    m.ngay_hen_tra
FROM Muon m
JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
WHERE m.ngay_hen_tra < GETDATE()
  AND m.ngay_tra IS NULL;
GO

-- 7. Tổng số sách ở mỗi chi nhánh
SELECT 
    cn.ma_chi_nhanh,
    cn.ten,
    COUNT(bs.ma_sach) AS tong_sach
FROM ChiNhanh cn
LEFT JOIN BanSao bs ON cn.ma_chi_nhanh = bs.ma_chi_nhanh
GROUP BY cn.ma_chi_nhanh, cn.ten
ORDER BY tong_sach DESC;
GO

-- 8. Mỗi nhà cung cấp cung cấp cho bao nhiêu chi nhánh
SELECT 
    ncc.ma_ncc,
    ncc.ten_ncc,
    COUNT(*) AS so_chi_nhanh
FROM CungCap cc
JOIN NhaCungCap ncc ON cc.ma_ncc = ncc.ma_ncc
GROUP BY ncc.ma_ncc, ncc.ten_ncc
ORDER BY so_chi_nhanh DESC;
GO

-- 9. Thành viên mượn nhiều sách nhất
SELECT TOP 1
    tv.ma_thanh_vien,
    tv.ho_ten,
    COUNT(*) AS so_sach_muon
FROM Muon m
JOIN ThanhVien tv ON m.ma_thanh_vien = tv.ma_thanh_vien
GROUP BY tv.ma_thanh_vien, tv.ho_ten
ORDER BY so_sach_muon DESC;
GO

-- 10. Bản sao sách bị xấu hoặc hỏng
SELECT 
    bs.ma_sach,
    bs.copy_no,
    bs.tinh_trang_vat_ly
FROM BanSao bs
WHERE bs.tinh_trang_vat_ly LIKE N'%Trung bình%'
   OR bs.tinh_trang_vat_ly LIKE N'%hỏng%';
GO