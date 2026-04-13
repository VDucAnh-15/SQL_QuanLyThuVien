# QuanLyThuVien Web UI

Web app nay duoc tao tu file SQL `quanlythuvien.sql`, cung cap giao dien de chay nhanh cac chuc nang truy van thu vien.

## Chuc nang da co

- Dashboard tong quan (tong sach, ban sao, thanh vien, chi nhanh, dang muon, qua han)
- Danh sach muon sach
- Sach dang qua han
- Thong ke ca lam theo thang/nam
- So luong sach theo loai
- So lan muon theo thanh vien
- Thanh vien qua han chua tra
- Tong sach moi chi nhanh
- So chi nhanh duoc cung cap boi tung nha cung cap
- Thanh vien muon nhieu nhat
- Danh sach ban sao sach can bao tri

## Yeu cau

- Node.js 18+
- SQL Server da tao database `QuanLyThuVien` theo script `quanlythuvien.sql`

## Cai dat

1. Cai dependency:

```bash
npm install
```

2. Tao file `.env` tu `.env.example` va cap nhat thong tin ket noi.

### Cach 1: Windows Authentication (khuyen nghi voi may cua ban)

```env
PORT=3000
DB_AUTH_MODE=windows
DB_SERVER=localhost
DB_INSTANCE=
DB_NAME=QuanLyThuVien
DB_ODBC_DRIVER=ODBC Driver 18 for SQL Server
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

### Cach 2: SQL Login (sa)

```env
PORT=3000
DB_AUTH_MODE=sql
DB_SERVER=localhost
DB_INSTANCE=
DB_PORT=1433
DB_NAME=QuanLyThuVien
DB_USER=sa
DB_PASSWORD=your_password_here
DB_ENCRYPT=false
DB_TRUST_CERT=true
```

3. Chay server:

```bash
npm start
```

4. Mo trinh duyet: `http://localhost:3000`

## Cau truc thu muc

- `server.js`: Express API + SQL queries
- `public/index.html`: giao dien dashboard
- `public/styles.css`: giao dien va responsive
- `public/app.js`: logic goi API + render bang ket qua
