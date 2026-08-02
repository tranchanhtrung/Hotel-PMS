// Utility to generate Azure Cloud migration scripts (Azure SQL Server, Azure PostgreSQL, Cosmos DB JSON)

export interface HotelDatabasePayload {
  hotelInfo: any;
  businessDate: string;
  roomTypes: any[];
  ratePeriods: any[];
  serviceRates: any[];
  rooms: any[];
  housekeepers: any[];
  reservations: any[];
  folios: any[];
  auditLogs: any[];
  submittedReports: any[];
  userAccounts: any[];
}

export function generateAzureSqlScript(data: HotelDatabasePayload): string {
  let sql = `-- =========================================================================\n`;
  sql += `-- GRAND STAY HOTEL - AZURE SQL DATABASE MIGRATION SCRIPT\n`;
  sql += `-- Generated on: ${new Date().toISOString()}\n`;
  sql += `-- Target Platform: Azure SQL Database / Microsoft SQL Server\n`;
  sql += `-- =========================================================================\n\n`;

  sql += `-- 1. Hotel Information Table\n`;
  sql += `IF OBJECT_ID('dbo.HotelInfo', 'U') IS NOT NULL DROP TABLE dbo.HotelInfo;\n`;
  sql += `CREATE TABLE dbo.HotelInfo (\n`;
  sql += `    Id INT PRIMARY KEY IDENTITY(1,1),\n`;
  sql += `    Name NVARCHAR(255) NOT NULL,\n`;
  sql += `    Address NVARCHAR(500),\n`;
  sql += `    Phone VARCHAR(50),\n`;
  sql += `    Email VARCHAR(100),\n`;
  sql += `    StarRating INT,\n`;
  sql += `    CheckInTime VARCHAR(10),\n`;
  sql += `    CheckOutTime VARCHAR(10),\n`;
  sql += `    Currency VARCHAR(10),\n`;
  sql += `    TaxRate DECIMAL(5,2),\n`;
  sql += `    ServiceCharge DECIMAL(5,2),\n`;
  sql += `    TotalRooms INT,\n`;
  sql += `    BusinessDate VARCHAR(10)\n`;
  sql += `);\n\n`;

  const info = data.hotelInfo || {};
  sql += `INSERT INTO dbo.HotelInfo (Name, Address, Phone, Email, StarRating, CheckInTime, CheckOutTime, Currency, TaxRate, ServiceCharge, TotalRooms, BusinessDate)\n`;
  sql += `VALUES (N'${(info.name || '').replace(/'/g, "''")}', N'${(info.address || '').replace(/'/g, "''")}', '${info.phone || ''}', '${info.email || ''}', ${info.starRating || 4}, '${info.checkInTime || '14:00'}', '${info.checkOutTime || '12:00'}', '${info.currency || 'VND'}', ${info.taxRate || 10}, ${info.serviceCharge || 5}, ${info.totalRooms || 72}, '${data.businessDate}');\n\n`;

  sql += `-- 2. Room Categories Table\n`;
  sql += `IF OBJECT_ID('dbo.RoomTypes', 'U') IS NOT NULL DROP TABLE dbo.RoomTypes;\n`;
  sql += `CREATE TABLE dbo.RoomTypes (\n`;
  sql += `    Id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    Name NVARCHAR(100) NOT NULL,\n`;
  sql += `    BaseRate DECIMAL(18,2) NOT NULL,\n`;
  sql += `    MaxGuests INT NOT NULL,\n`;
  sql += `    TotalRooms INT NOT NULL,\n`;
  sql += `    Description NVARCHAR(1000)\n`;
  sql += `);\n\n`;

  (data.roomTypes || []).forEach(rt => {
    sql += `INSERT INTO dbo.RoomTypes (Id, Name, BaseRate, MaxGuests, TotalRooms, Description)\n`;
    sql += `VALUES ('${rt.id}', N'${rt.name.replace(/'/g, "''")}', ${rt.baseRate}, ${rt.maxGuests}, ${rt.total}, N'${(rt.description || '').replace(/'/g, "''")}');\n`;
  });
  sql += `\n`;

  sql += `-- 3. Physical Rooms Inventory Table\n`;
  sql += `IF OBJECT_ID('dbo.Rooms', 'U') IS NOT NULL DROP TABLE dbo.Rooms;\n`;
  sql += `CREATE TABLE dbo.Rooms (\n`;
  sql += `    Id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    RoomNumber VARCHAR(20) NOT NULL,\n`;
  sql += `    FloorLevel INT NOT NULL,\n`;
  sql += `    TypeId VARCHAR(50) FOREIGN KEY REFERENCES dbo.RoomTypes(Id),\n`;
  sql += `    TypeName NVARCHAR(100),\n`;
  sql += `    Rate DECIMAL(18,2),\n`;
  sql += `    Status VARCHAR(50),\n`;
  sql += `    Housekeeper NVARCHAR(100),\n`;
  sql += `    Notes NVARCHAR(500),\n`;
  sql += `    LastCleanedAt DATETIME2\n`;
  sql += `);\n\n`;

  (data.rooms || []).forEach(r => {
    sql += `INSERT INTO dbo.Rooms (Id, RoomNumber, FloorLevel, TypeId, TypeName, Rate, Status, Housekeeper, Notes, LastCleanedAt)\n`;
    sql += `VALUES ('${r.id}', '${r.number}', ${r.floor}, '${r.typeId}', N'${(r.typeName || '').replace(/'/g, "''")}', ${r.rate}, '${r.status}', N'${(r.housekeeper || '').replace(/'/g, "''")}', N'${(r.notes || '').replace(/'/g, "''")}', '${r.lastCleanedAt || new Date().toISOString()}');\n`;
  });
  sql += `\n`;

  sql += `-- 4. Reservations & Bookings Table\n`;
  sql += `IF OBJECT_ID('dbo.Reservations', 'U') IS NOT NULL DROP TABLE dbo.Reservations;\n`;
  sql += `CREATE TABLE dbo.Reservations (\n`;
  sql += `    Id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    ConfirmationCode VARCHAR(50) NOT NULL,\n`;
  sql += `    GuestName NVARCHAR(150) NOT NULL,\n`;
  sql += `    GuestPhone VARCHAR(50),\n`;
  sql += `    GuestEmail VARCHAR(100),\n`;
  sql += `    GuestIdNumber VARCHAR(50),\n`;
  sql += `    RoomId VARCHAR(50),\n`;
  sql += `    RoomNumber VARCHAR(20),\n`;
  sql += `    RoomTypeName NVARCHAR(100),\n`;
  sql += `    CheckInDate DATE NOT NULL,\n`;
  sql += `    CheckOutDate DATE NOT NULL,\n`;
  sql += `    Status VARCHAR(50) NOT NULL,\n`;
  sql += `    TotalAmount DECIMAL(18,2),\n`;
  sql += `    PaidAmount DECIMAL(18,2),\n`;
  sql += `    Channel VARCHAR(50),\n`;
  sql += `    Adults INT,\n`;
  sql += `    KeycardAssigned VARCHAR(50)\n`;
  sql += `);\n\n`;

  (data.reservations || []).forEach(res => {
    sql += `INSERT INTO dbo.Reservations (Id, ConfirmationCode, GuestName, GuestPhone, GuestEmail, GuestIdNumber, RoomId, RoomNumber, RoomTypeName, CheckInDate, CheckOutDate, Status, TotalAmount, PaidAmount, Channel, Adults, KeycardAssigned)\n`;
    sql += `VALUES ('${res.id}', '${res.confirmationCode}', N'${(res.guestName || '').replace(/'/g, "''")}', '${res.guestPhone || ''}', '${res.guestEmail || ''}', '${res.guestIdNumber || ''}', '${res.roomId || ''}', '${res.roomNumber || ''}', N'${(res.roomTypeName || '').replace(/'/g, "''")}', '${res.checkInDate}', '${res.checkOutDate}', '${res.status}', ${res.totalAmount || 0}, ${res.paidAmount || 0}, '${res.channel || 'Direct'}', ${res.adults || 1}, '${res.keycardAssigned || ''}');\n`;
  });
  sql += `\n`;

  sql += `-- 5. Housekeepers Staff Roster\n`;
  sql += `IF OBJECT_ID('dbo.Housekeepers', 'U') IS NOT NULL DROP TABLE dbo.Housekeepers;\n`;
  sql += `CREATE TABLE dbo.Housekeepers (\n`;
  sql += `    Id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    Name NVARCHAR(100) NOT NULL,\n`;
  sql += `    Phone VARCHAR(50),\n`;
  sql += `    Status VARCHAR(20)\n`;
  sql += `);\n\n`;

  (data.housekeepers || []).forEach(hk => {
    sql += `INSERT INTO dbo.Housekeepers (Id, Name, Phone, Status)\n`;
    sql += `VALUES ('${hk.id}', N'${hk.name.replace(/'/g, "''")}', '${hk.phone || ''}', '${hk.status || 'Active'}');\n`;
  });
  sql += `\n`;

  sql += `-- 6. Audit Activity Logs\n`;
  sql += `IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL DROP TABLE dbo.AuditLogs;\n`;
  sql += `CREATE TABLE dbo.AuditLogs (\n`;
  sql += `    Id VARCHAR(50) PRIMARY KEY,\n`;
  sql += `    LoggedAt DATETIME2 NOT NULL,\n`;
  sql += `    Staff NVARCHAR(100),\n`;
  sql += `    Action NVARCHAR(100),\n`;
  sql += `    Details NVARCHAR(1000)\n`;
  sql += `);\n\n`;

  (data.auditLogs || []).forEach(log => {
    sql += `INSERT INTO dbo.AuditLogs (Id, LoggedAt, Staff, Action, Details)\n`;
    sql += `VALUES ('${log.id}', '${log.timestamp}', N'${(log.staff || '').replace(/'/g, "''")}', N'${(log.action || '').replace(/'/g, "''")}', N'${(log.details || '').replace(/'/g, "''")}');\n`;
  });
  sql += `\n`;

  sql += `-- END OF AZURE SQL DDL SCRIPT\n`;
  return sql;
}
