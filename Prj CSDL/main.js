// Định nghĩa các thư mục sẽ sử dụng
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
var sql = require('mssql');
var consoleTable = require('console.table');
const fs = require('fs');
const { connect } = require('http2');
app.use( express.static('public'));
// Sử dụng body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Cấu hình đường dẫn cho các tệp HTML
const htmlDir = path.join(__dirname, 'views');
// Thiết lập Db
const configForLogIn = {
  server: 'MANHVU',
  database: 'CarRental',
  port: 1433,
  authentication: {
    type: 'default',
    options: {
      userName: 'sa',
      password: 'manhvu123'
    }
  },
  options: {
    encrypt: false,
    enableArithAbort: true
  }
};

// Kết nối với Db để lấy thông tin bảng Users
sql.connect(configForLogIn, function(err) {
  if (err) {
    console.log("Failed to connect to database: " + err);
  } else {
    console.log("Connected to database to get Users table info");
  }
});
app.post('/logout', function(req, res) {
  // Ngắt kết nối config
  sql.close(function(err) {
    if (err) {
      console.log("Failed to close database connection: " + err);
    } else {
      console.log("Closed database connection");
    }
  });

  // Kết nối lại với configForLogIn
  sql.connect(configForLogIn, function(err) {
    if (err) {
      console.log("Failed to connect to database: " + err);
    } else {
      console.log("Connected to database to get Users table info");
    }
  });

  // Chuyển hướng người dùng về trang đăng nhập
  res.redirect('/signin.html');
});

app.post('/login', function(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  // Tạo truy vấn SQL để kiểm tra thông tin đăng nhập
  const query = `SELECT * FROM Users WHERE username LIKE '%${username}%' AND password LIKE '%${password}%'`;

  // Thực hiện truy vấn SQL
  const request = new sql.Request();
  request.query(query, function(err, result) {
    if (err) {
      console.log("Error executing SQL query: " + err);
      res.json({ success: false, message: "Error executing SQL query" });
    } else {
      // Kiểm tra kết quả truy vấn
      if (result.recordset.length > 0) {
        // Đóng kết nối configForLogIn sau khi đăng nhập thành công
        sql.close(function(err) {
          if (err) {
            console.log("Failed to close database connection: " + err);
          } else {
            console.log("Closed database connection");
          }
        });

        // Thiết lập Db để thực hiện các chức năng khác
        const config = {
          server: 'MANHVU',
          database: 'CarRental',
          port: 1433,
          authentication: {
            type: 'default',
            options: {
              userName: username,
              password: password
            }
          },
          options: {
            encrypt: false,
            enableArithAbort: true
          }
        };

        // Kết nối với Db để thực hiện các chức năng khác
        sql.connect(config, function(err) {
          if (err) {
            console.log("Failed to connect to database: " + err);
          } else {
            console.log("Connected to database for other functions");
          }
        });

        res.json({ success: true, message: "Login successful" });
      } else {
        res.json({ success: false, message: "Invalid username or password" });
      }
    }
  });
});
// Reset lai cac ket noi khi dang xuat
module.exports = connect ;
// Định vị thư mục chứa các tệp tĩnh
app.use('/assets', express.static(path.join(__dirname, 'views', 'assets')));

// Định vị thư mục chứa các tệp HTML
app.set('views', path.join(__dirname, 'views'));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// Xử lý các yêu cầu truy cập các tệp HTML
app.use((req, res, next) => {
  const filePath = path.join(htmlDir, req.path);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (!err) {
      res.sendFile(filePath);
    } else {
      next();
    }
  });
});

// Hiển thị thông tin các  loại xe 
// ... Định nghĩa các route khác
// 1. Chức năng hiển thị thông tin về xe 
app.get('/data', (req, res) => {
  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe
  const query = 'SELECT * FROM Xe';
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

//1. -------- Hiển thị  thông tin danh sách các nhân viên
app.get('/listE', (req, res) => {
  const query = 'SELECT * FROM NhanVien';
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 2. -------- Tìm kiếm nhân viên theo tên
app.get('/searchEmployee', (req, res) => {
  const NameEInput = req.query.NameEInput;

  const query = `SELECT * FROM NhanVien WHERE HoTen LIKE N'%${NameEInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// 3. -------- Them cong nhan
app.post('/addE', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const HoTen = req.body.HoTen;
  const SoDienThoai = req.body.SoDienThoai;
  const Email = req.body.Email;
  const DiaChi = req.body.DiaChi;
  const SoCCCD_CMND = req.body.SoCCCD_CMND;
  const ChucVu = req.body.ChucVu;
  const TienLuong = req.body.TienLuong;
  // Thực hiện truy vấn SQL để thêm thông tin xe vào cơ sở dữ liệu
  const query = `INSERT INTO NhanVien (HoTen, SoDienThoai, Email, DiaChi, SoCCCD_CMND, ChucVu, TienLuong) VALUES (N'${HoTen}','${SoDienThoai}', '${Email}', N'${DiaChi}', '${SoCCCD_CMND}', N'${ChucVu}', '${TienLuong}')`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Thêm nhân viên thành công' });
    })
    .catch(error => {
      console.log('Error adding employee:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm nhân viên' });
    });
});
// 4. -------- Xóa thông tin nhân viên
//tim nhan vien de xoa
app.get('/searchEtoremove', (req, res) => {
  const IdEInput = req.query.IdEInput;

  const query = `SELECT * FROM NhanVien WHERE MaNhanVien LIKE '%${IdEInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Xoa thong tin nhan vien
app.post('/removeE', (req, res) => {
  const IdEInput = req.body.IdEInput;

  const query = `EXEC sp_DeleteEmployee @MaNhanVien='${IdEInput}'`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Xóa nhân viên thành công' });
    })
    .catch(error => {
      console.log('Error removing employee:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa nhân viên' });
    });
});

// 5. -------- Sửa thông tin nhân viên
//Tim xe de sua
app.get('/searchEtoupdate', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdEInput = req.query.IdEInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM NhanVien WHERE MaNhanVien LIKE '%${IdEInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Sua thong tin xe
app.post('/updateE', (req, res) => {
// Lấy thông tin xe từ yêu cầu POST
const IdEInput = req.body.IdEInput;
const HoTen = req.body.HoTen;
const SoDienThoai = req.body.SoDienThoai;
const Email = req.body.Email;
const DiaChi = req.body.DiaChi;
const SoCCCD_CMND = req.body.SoCCCD_CMND;
const ChucVu = req.body.ChucVu;
const TienLuong = req.body.TienLuong;

// Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
const query = `UPDATE NhanVien SET HoTen=N'${HoTen}', SoDienThoai='${SoDienThoai}', Email='${Email}',DiaChi=N'${DiaChi}',SoCCCD_CMND='${SoCCCD_CMND}',ChucVu=N'${ChucVu}',TienLuong='${TienLuong}' WHERE MaNhanVien='${IdEInput}'`;
sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Sửa thông tin nhân viên thành công' });
    })
    .catch(error => {
      console.log('Error updating employee:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa nhân viên' });
    });
});

// 6. -------- Hiển thị  thông tin danh sách khách hàng 
app.get('/listC', (req, res) => {
  const query = 'SELECT * FROM KhachHang';
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 7. Thêm thông tin khách hàng 
app.post('/addC', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const Ho = req.body.Ho;
  const Ten = req.body.Ten;
  const SoDienThoai = req.body.SoDienThoai;
  const Email = req.body.Email;
  const DiaChi = req.body.DiaChi;
  const SoCCCD_CMND = req.body.SoCCCD_CMND;
  // Thực hiện truy vấn SQL để thêm thông tin xe vào cơ sở dữ liệu
  const query = `INSERT INTO KhachHang (Ho, Ten, SoDienThoai, Email, DiaChi, SoCCCD_CMND) VALUES (N'${Ho}', N'${Ten}', '${SoDienThoai}', '${Email}', N'${DiaChi}', '${SoCCCD_CMND}')`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Thêm khách hàng thành công' });
    })
    .catch(error => {
      console.log('Error adding employee:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm khách hàng' });
    });
});

// -------- 8. Sửa thông tin khách hàng
//Tim xe de sua
app.get('/searchCtoupdate', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdCInput = req.query.IdCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM KhachHang WHERE MaKhachHang LIKE '%${IdCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Sua thong tin xe
app.post('/updateC', (req, res) => {
// Lấy thông tin xe từ yêu cầu POST
const IdCInput = req.body.IdCInput;
const Ho = req.body.Ho;
const Ten = req.body.Ten;
const SoDienThoai = req.body.SoDienThoai;
const Email = req.body.Email;
const DiaChi = req.body.DiaChi;
const SoCCCD_CMND = req.body.SoCCCD_CMND;
const ThanhVien = req.body.ThanhVien;

// Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
const query = `UPDATE KhachHang SET Ho=N'${Ho}', Ten=N'${Ten}', SoDienThoai='${SoDienThoai}', Email='${Email}',DiaChi=N'${DiaChi}',SoCCCD_CMND='${SoCCCD_CMND}',ThanhVien=N'${ThanhVien}' WHERE MaKhachHang LIKE '${IdCInput}'`;
sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Sửa thông tin nhân viên thành công' });
    })
    .catch(error => {
      console.log('Error updating employee:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa nhân viên' });
    });
});


// -------- 9. Xóa thông tin khách hàng 
//tim nhan vien de xoa
app.get('/searchCtoremove', (req, res) => {
  const IdCInput = req.query.IdCInput;

  const query = `SELECT * FROM KhachHang WHERE MaKhachHang LIKE '%${IdCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Xoa thong tin nhan vien
app.post('/removeC', (req, res) => {
  const IdCInput = req.body.IdCInput;
  
  const query = `EXEC sp_DeleteCustomer @MaKhachHang='${IdCInput}'`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Xóa khách hàng thành công' });
    })
    .catch(error => {
      console.log('Error removing customer:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa khách hàng' });
    });
});

// -------- 10. Tìm khách hàng theo email
app.get('/searchCustomerparEmail', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const EmailCInput = req.query.EmailCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM KhachHang WHERE Email LIKE '%${EmailCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 11. Tìm khách hàng theo tên
app.get('/searchCustomerparName', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const NameCInput = req.query.NameCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM KhachHang WHERE Ten LIKE N'%${NameCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 12. Tìm khách hàng theo số điẹn thoại
app.get('/searchCustomerparPhone', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const PhoneCInput = req.query.PhoneCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM KhachHang WHERE SoDienThoai LIKE '%${PhoneCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 13. Hiển thị lịch sử thuê xe của khách hàng 
app.get('/searchCustomerparID', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdCInput = req.query.IdCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM KhachHang WHERE MaKhachHang LIKE '%${IdCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

app.get('/RentalHistory', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdCInput = req.query.IdCInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT QL.MaThue, QL.MaKhachHang, KhachHang.Ho, KhachHang.Ten, QL.MaXe, Xe.BienSo, QL.DiaDiemNhanXe, QL.DiaDiemTraXe, QL.NgayBatDau, QL.NgayKetThuc
                FROM QuanLyThueXe AS QL 
                JOIN KhachHang ON QL.MaKhachHang = KhachHang.MaKhachHang
                JOIN Xe ON QL.MaXe = Xe.MaXe 
                WHERE QL.MaKhachHang LIKE '%${IdCInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 14. Xem báo cáo theo tháng 
app.get('/ReportparMonth', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const MonthInput = req.query.MonthInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT 
                FORMAT(QLHD.NgayThanhToan, 'MM/yyyy') AS ThangNam,
                COUNT(QLTX.MaThue) AS SoLuotThue,
                SUM(QLHD.TienThanhToan) - 
                (SELECT SUM(NV.TienLuong) FROM NhanVien NV) - 
                ISNULL((SELECT SUM(BDX.TienBaoDuong) FROM BaoDuongXe BDX WHERE FORMAT(BDX.NgayBaoDuongTruocDo, 'MM/yyyy') = FORMAT(QLHD.NgayThanhToan, 'MM/yyyy')),0) AS DoanhThu
                FROM QuanLyThueXe QLTX
                JOIN QuanLyHoaDon QLHD ON QLTX.MaThue = QLHD.MaThue
                GROUP BY FORMAT(QLHD.NgayThanhToan, 'MM/yyyy') 
                HAVING FORMAT(QLHD.NgayThanhToan, 'MM/yyyy') LIKE '%${MonthInput}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// -------- 15. Xem danh sách xe phổ biến theo tháng 
app.get('/listPopularCar', (req, res) => {
  const MonthInput = req.query.MonthInput;
  const query = `SELECT 
                FORMAT(QLTX.NgayBatDau, 'MM/yyyy') AS ThangNam, X.MaXe, X.HangXe, X.LoaiXe, X.BienSo,
                COUNT(QLTX.MaThue) AS SoLuotThue
                FROM QuanLyThueXe QLTX
                JOIN Xe X ON QLTX.MaXe = X.MaXe
                GROUP BY FORMAT(QLTX.NgayBatDau, 'MM/yyyy'),X.MaXe,X.HangXe,X.LoaiXe,X.BienSo
                HAVING FORMAT(QLTX.NgayBatDau, 'MM/yyyy') LIKE '%${MonthInput}%'
                ORDER BY SoLuotThue DESC`;
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Truy van cac xe can tim theo bien so
app.get('/timxe', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const licensePlate = req.query.licensePlate;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT * FROM Xe WHERE BienSo LIKE '%${licensePlate}%'`;

  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

//--- Đã xong 3 phần ---//
// Sử lý user

//------------- 1. Danh sách USER
// Danh sach nhân viên
app.get('/listUE', (req, res) => {
  const query = `SELECT U.MaNhanVien, Nv.HoTen, U.Username, U.Password, Nv.ChucVu
                FROM Users U
                JOIN NhanVien Nv ON Nv.MaNhanVien=U.MaNhanVien
                WHERE Nv.ChucVu = N'Nhân viên'`;
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Danh sach quản lý
app.get('/listUC', (req, res) => {
  const query = `SELECT U.MaNhanVien, Nv.HoTen, U.Username, U.Password, Nv.ChucVu
                FROM Users U
                JOIN NhanVien Nv ON Nv.MaNhanVien=U.MaNhanVien
                WHERE Nv.ChucVu != N'Nhân viên'`;
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});


//------------- 2. Thêm USER
app.post('/addU', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const MaNhanVien = req.body.MaNhanVien;
  const Username = req.body.Username;
  const Password = req.body.Password;
  // Thực hiện truy vấn SQL để thêm thông tin xe vào cơ sở dữ liệu
  const query = `INSERT INTO Users (MaNhanVien, Username, Password) VALUES ('${MaNhanVien}', '${Username}', '${Password}')`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Thêm tài khoản thành công' });
    })
    .catch(error => {
      console.log('Error adding user:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm tài khoản' });
    });
});

//------------- 3. Sửa USER
app.post('/updateU', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const IdEInput = req.body.IdEInput;
  const Password = req.body.Password;
  
  // Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
  const query = `UPDATE Users SET Password='${Password}' WHERE MaNhanVien='${IdEInput}'`;
  sql.query(query)
      .then(() => {
        // Trả về kết quả thành công dưới dạng JSON
        res.json({ success: true, message: 'Sửa thông tin tài khoản thành công' });
      })
      .catch(error => {
        console.log('Error updating user:', error);
        // Trả về kết quả lỗi dưới dạng JSON
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa tài khoản' });
      });
  });

//------------- 4. Xóa USER
app.post('/removeU', (req, res) => {
  const IdEInput = req.body.IdEInput;

  const query = `DELETE FROM Users WHERE MaNhanVien='${IdEInput}'`;
  sql.query(query)
    .then(() => {
      // Trả về kết quả thành công dưới dạng JSON
      res.json({ success: true, message: 'Xóa tài khoản thành công' });
    })
    .catch(error => {
      console.log('Error removing user:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa user' });
    });
});

//------------- 5. Tìm kiếm USER
app.get('/searchUser', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdEInput = req.query.IdEInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT U.MaNhanVien, Nv.HoTen, U.Username, U.Password, Nv.ChucVu
                FROM Users U
                JOIN NhanVien Nv ON Nv.MaNhanVien=U.MaNhanVien 
                WHERE U.MaNhanVien LIKE '%${IdEInput}%'`;
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

//------------- 5. Tìm kiếm Hóa Đơn
app.get('/searchBillbyIdTxInput', (req, res) => {
  // Lấy biển số xe từ yêu cầu của người dùng
  const IdTxInput = req.query.IdTxInput;

  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
  const query = `SELECT hd.MaHoaDon, hd.MaThue,kh.MaKhachHang, hd.TienThanhToan,hd.PhuongThucThanhToan, hd.NgayThanhToan
                FROM QuanLyHoaDon hd 
                JOIN QuanLyThueXe tx ON hd.MaThue=tx.MaThue
                JOIN KhachHang kh ON kh.MaKhachHang=tx.MaKhachHang
                WHERE hd.MaThue LIKE '%${IdTxInput}%'`;
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
//------------- 3. Sửa Hóa Đơn
app.post('/updateBill', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const IdTxInput = req.body.IdTxInput;
  const PTTTInput = req.body.PTTTInput;
  const DateInput = req.body.DateInput;
  
  // Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
  const query = `UPDATE QuanLyHoaDon SET PhuongThucThanhToan= N'${PTTTInput}', NgayThanhToan='${DateInput}' 
                 WHERE MaThue='${IdTxInput}'`;
  sql.query(query)
      .then(() => {
        // Trả về kết quả thành công dưới dạng JSON
        res.json({ success: true, message: 'Sửa thông tin hóa đơn thành công' });
      })
      .catch(error => {
        console.log('Error updating user:', error);
        // Trả về kết quả lỗi dưới dạng JSON
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa hóa đơn' });
      });
  });


//---------------------------Code của Nghĩa--------------------------

// Truy van cac xe can phai bao duong
app.get('/baoduong', (req, res) => {
  // Thực hiện truy vấn SQL để lấy thông tin về các loại xe
  const query = ' SELECT Xe.* FROM Xe JOIN BaoDuongXe ON Xe.MaXe = BaoDuongXe.MaXe WHERE BaoDuongXe.NgayBaoDuongTiepTheo < GETDATE();';
  sql.query(query)
    .then((result) => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});

// Them thong tin xe
app.post('/themxe', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const hangXe = req.body.hangXe;
  const loaiXe = req.body.loaiXe;
  const namSanXuat = req.body.namSanXuat;
  const bienSo = req.body.bienSo;
  const nguyenLieu = req.body.nguyenLieu;
  const soKmDaDi = req.body.soKmDaDi;
  const soChoNgoi = req.body.soChoNgoi;
  const viTriHienTai = req.body.viTriHienTai;
  // Thực hiện truy vấn SQL để thêm thông tin xe vào cơ sở dữ liệu
  const query = `INSERT INTO Xe (TinhTrang ,HangXe, LoaiXe, NamSanXuat, BienSo, NguyenLieu, SoKmDaDi, SoChoNgoi, ViTriHienTai) VALUES (N'Chưa thuê',N'${hangXe}', N'${loaiXe}', N'${namSanXuat}', N'${bienSo}', N'${nguyenLieu}', N'${soKmDaDi}', N'${soChoNgoi}', N'${viTriHienTai}')`;
  sql.query(query)
    .then(() => {
      // Trả về mã trạng thái 200 để chỉ rằng thêm xe thành công
      res.json({ success: true, message: 'Thêm thành công' });
    })
    .catch(error => {
      console.log('Error adding car:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm xe' });
    });
});
// xoa xe khoi bang
  //tim xe de xoa
  app.get('/timxedexoa', (req, res) => {
    // Lấy biển số xe từ yêu cầu của người dùng
    const carCode = req.query.carCode;
  
    // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
    const query = `SELECT * FROM Xe WHERE MaXe LIKE '%${carCode}%'`;
  
    sql.query(query)
      .then((result) => {
        // Gửi kết quả về cho máy khách
        res.json(result.recordset);
      })
      .catch((error) => {
        console.log('Error executing SQL query:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  // Xoa thong tin xe
  app.post('/xoaxe', (req, res) => {
    const carCode = req.body.carCode;
  
    // Thực hiện truy vấn SQL để xóa thông tin xe từ cơ sở dữ liệu dựa trên mã xe
    const query = `EXEC sp_DeleteCar @MaXe='${carCode}'`;
    sql.query(query)
    .then(() => {
      // Trả về mã trạng thái 200 để chỉ rằng thêm xe thành công
      res.json({ success: true, message: 'Xóa thành công' });
    })
    .catch(error => {
      console.log('Error deleting car:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa xe' });
    });
  });
//Thay doi thong tin cua xe
  //Tim xe de sua
  app.get('/timxedesua', (req, res) => {
    // Lấy biển số xe từ yêu cầu của người dùng
    const carCode = req.query.carCode;
  
    // Thực hiện truy vấn SQL để lấy thông tin về các loại xe dựa trên biển số
    const query = `SELECT * FROM Xe WHERE MaXe LIKE '%${carCode}%'`;
  
    sql.query(query)
      .then((result) => {
        // Gửi kết quả về cho máy khách
        res.json(result.recordset);
      })
      .catch((error) => {
        console.log('Error executing SQL query:', error);
        res.status(500).send('Internal Server Error');
      });
  });
  //Sua thong tin xe
  // Sua thong tin xe
app.post('/suaxe', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const carCode = req.body.carCode;
  const bienSo = req.body.bienSo;
  const tinhTrang = req.body.tinhTrang;
  const viTriHienTai = req.body.viTriHienTai;
  
  // Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
  const query = `UPDATE Xe SET BienSo=N'${bienSo}', TinhTrang=N'${tinhTrang}', ViTriHienTai=N'${viTriHienTai}' WHERE MaXe=N'${carCode}'`;
  sql.query(query)
    .then(() => {
      // Trả về mã trạng thái 200 để chỉ rằng sửa xe thành công
      res.json({ success: true, message: 'sửa thành công' });
    })
    .catch(error => {
      console.log('Error adding car:', error);
      // Trả về kết quả lỗi dưới dạng JSON
      res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa xe' });
    });
});
// Quan ly thue xe
// Tim kiem hoa don
app.get('/timhoadon', (req, res) => {
  const MaHoaDon = req.query.BillID;

  const query = `SELECT hd.MaHoaDon, hd.MaThue,kh.MaKhachHang, hd.TienThanhToan,hd.PhuongThucThanhToan, hd.NgayThanhToan
                FROM QuanLyHoaDon hd 
                JOIN QuanLyThueXe tx ON hd.MaThue=tx.MaThue
                JOIN KhachHang kh ON kh.MaKhachHang=tx.MaKhachHang
                WHERE hd.MaHoaDon LIKE '%${MaHoaDon}%'`;

  sql.query(query)
    .then((result) => {
      res.json(result.recordset);
    })
    .catch((error) => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
//Tim thong tin thue xe
app.get('/timthongtinthuexe', (req, res) => {
  // Lấy tên khách hàng từ yêu cầu của người dùng
  const customerName = req.query.customerName;

  // Thực hiện truy vấn SQL để tìm thông tin thuê xe dựa trên tên khách hàng
  const query = `SELECT CONCAT(KhachHang.Ho, ' ', KhachHang.Ten) AS HoTen,
                        KhachHang.SoDienThoai,
                        KhachHang.Email,
                        KhachHang.MaKhachHang,
                        QuanLyThueXe.MaXe,
                        QuanLyThueXe.MaThue,
                        QuanLyThueXe.DiaDiemNhanXe,
                        QuanLyThueXe.DiaDiemTraXe,
                        QuanLyThueXe.NgayBatDau,
                        QuanLyThueXe.NgayKetThuc
                FROM KhachHang
                INNER JOIN QuanLyThueXe ON KhachHang.MaKhachHang = QuanLyThueXe.MaKhachHang
                WHERE CONCAT(KhachHang.Ho, ' ', KhachHang.Ten) LIKE N'%${customerName}%'`;

  sql.query(query)
    .then(result => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch(error => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Them thong tin thue xe
app.post('/themthongtindatxe', (req, res) => {
  // Lấy thông tin đặt xe từ yêu cầu POST
  const maKH = req.body.maKH;
  const maXe = req.body.maXe;
  const diemNhanXe = req.body.diemNhanXe;
  const diemTraXe = req.body.diemTraXe;
  const ngayBatDau = convertDateFormat(req.body.ngayBatDau);
  const ngayKetThuc = convertDateFormat(req.body.ngayKetThuc);
  function convertDateFormat(inputDate) {
    // Tách ngày, tháng và năm từ input
    const parts = inputDate.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    // Tạo định dạng mới "yyyy-mm-dd"
    const convertedDate = `${year}-${month}-${day}`;

    return convertedDate;
    }
  // Thực hiện truy vấn SQL để thêm thông tin đặt xe vào cơ sở dữ liệu
  const query = `INSERT INTO QuanLyThueXe (MaKhachHang, MaXe, DiaDiemNhanXe, DiaDiemTraXe, NgayBatDau, NgayKetThuc) 
                 VALUES (N'${maKH}', N'${maXe}', N'${diemNhanXe}', N'${diemTraXe}', '${ngayBatDau}', '${ngayKetThuc}')`;
  sql.query(query)
  .then(() => {
    // Trả về mã trạng thái 200 để chỉ rằng thêm xe thành công
    res.json({ success: true, message: 'Thêm thông tin thuê thành công' });
  })
  .catch(error => {
    console.log('Error adding rental:', error);
    // Trả về kết quả lỗi dưới dạng JSON
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm thông tin thuê xe' });
  });
});
//Tim thong tin thue xe de xoa
app.get('/timmathue', (req, res) => {
  // Lấy tên khách hàng từ yêu cầu của người dùng
  const rentalCode = req.query.rentalCode;

  // Thực hiện truy vấn SQL để tìm thông tin thuê xe dựa trên tên khách hàng
  const query = `SELECT CONCAT(KhachHang.Ho, ' ', KhachHang.Ten) AS HoTen,
                        KhachHang.SoDienThoai,
                        KhachHang.Email,
                        KhachHang.MaKhachHang,
                        QuanLyThueXe.MaXe,
                        QuanLyThueXe.DiaDiemNhanXe,
                        QuanLyThueXe.DiaDiemTraXe,
                        QuanLyThueXe.NgayBatDau,
                        QuanLyThueXe.NgayKetThuc
                FROM KhachHang
                INNER JOIN QuanLyThueXe ON KhachHang.MaKhachHang = QuanLyThueXe.MaKhachHang
                WHERE MaThue LIKE N'%${rentalCode}%'`;

  sql.query(query)
    .then(result => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch(error => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
// Xoa thong tin xe
app.post('/xoathongtinthuexe', (req, res) => {
  const rentalCode = req.body.rentalCode;

  // Thực hiện truy vấn SQL để xóa thông tin xe từ cơ sở dữ liệu dựa trên mã xe
  const query = `EXEC sp_DeleteRentCar @MaThue='${rentalCode}'`;
  sql.query(query)
  .then(() => {
    // Trả về mã trạng thái 200 để chỉ rằng thêm xe thành công
    res.json({ success: true, message: 'Xóa thông tin thuê thành công' });
  })
  .catch(error => {
    console.log('Error deleting rental:', error);
    // Trả về kết quả lỗi dưới dạng JSON
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa thông tin thuê xe' });
  });
});
//Tim thong tin thue xe de sua
app.get('/timmathue', (req, res) => {
  // Lấy tên khách hàng từ yêu cầu của người dùng
  const rentalCode = req.query.rentalCode;

  // Thực hiện truy vấn SQL để tìm thông tin thuê xe dựa trên tên khách hàng
  const query = `SELECT CONCAT(KhachHang.Ho, ' ', KhachHang.Ten) AS HoTen,
                        KhachHang.SoDienThoai,
                        KhachHang.Email,
                        KhachHang.MaKhachHang,
                        QuanLyThueXe.MaXe,
                        QuanLyThueXe.DiaDiemNhanXe,
                        QuanLyThueXe.DiaDiemTraXe,
                        QuanLyThueXe.NgayBatDau,
                        QuanLyThueXe.NgayKetThuc
                FROM KhachHang
                INNER JOIN QuanLyThueXe ON KhachHang.MaKhachHang = QuanLyThueXe.MaKhachHang
                WHERE MaThue LIKE N'%${rentalCode}%'`;

  sql.query(query)
    .then(result => {
      // Gửi kết quả về cho máy khách
      res.json(result.recordset);
    })
    .catch(error => {
      console.log('Error executing SQL query:', error);
      res.status(500).send('Internal Server Error');
    });
});
//Sua thong tin thue xe
app.post('/suathongtinthuexe', (req, res) => {
  // Lấy thông tin xe từ yêu cầu POST
  const rentalCode = req.body.rentalCode;
  const maKH = req.body.maKH;
  const maXe = req.body.maXe;
  const diemNhanXe = req.body.diemNhanXe;
  const diemTraXe = req.body.diemTraXe;
  const ngayBatDau = convertDateFormat(req.body.ngayBatDau);
  const ngayKetThuc = convertDateFormat(req.body.ngayKetThuc);
  function convertDateFormat(inputDate) {
    // Tách ngày, tháng và năm từ input
    const parts = inputDate.split('/');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    // Tạo định dạng mới "yyyy-mm-dd"
    const convertedDate = `${year}-${month}-${day}`;

    return convertedDate;
    }
  // Thực hiện truy vấn SQL để sửa thông tin xe trong cơ sở dữ liệu
  const query = `UPDATE QuanLyThueXe SET MaKhachHang=N'${maKH}', MaXe=N'${maXe}', DiaDiemNhanXe=N'${diemNhanXe}',DiaDiemTraXe=N'${diemTraXe}',NgayBatDau=N'${ngayBatDau}',NgayKetThuc=N'${ngayKetThuc}' 
  WHERE MaThue=N'${rentalCode}'`;
  sql.query(query)
  .then(() => {
    // Trả về mã trạng thái 200 để chỉ rằng thêm xe thành công
    res.json({ success: true, message: 'Sửa thông tin thuê thành công' });
  })
  .catch(error => {
    console.log('Error updating rental:', error);
    // Trả về kết quả lỗi dưới dạng JSON
    res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi sửa thông tin thuê xe' });
  });
});

// Khởi động máy chủ
app.listen(4000, () => {
  console.log('Server is running on port 4000');
});