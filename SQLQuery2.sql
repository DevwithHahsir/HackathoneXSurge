-- Drop the Users table if it exists
IF OBJECT_ID('Users', 'U') IS NOT NULL
    DROP TABLE Users;

-- Drop the RegisterUser procedure if it exists
IF OBJECT_ID('RegisterUser', 'P') IS NOT NULL
    DROP PROCEDURE RegisterUser;

-- Create the Users table
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY, -- Auto-incrementing column
    FullName NVARCHAR(100),
    Email NVARCHAR(100) UNIQUE NOT NULL,
    OTP NVARCHAR(10),
    OTPExpiry DATETIME
);
Go
-- Create the RegisterUser stored procedure
CREATE PROCEDURE RegisterUser
    @FullName NVARCHAR(100),
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @OTP NVARCHAR(10);
    DECLARE @OTPExpiry DATETIME;

    -- Generate a random 6-digit OTP
    SET @OTP = RIGHT('000000' + CAST((ABS(CHECKSUM(NEWID())) % 1000000) AS NVARCHAR(10)), 6);
    SET @OTPExpiry = DATEADD(MINUTE, 10, GETDATE()); -- OTP expires in 10 minutes

    -- Insert user data and OTP into the table
    INSERT INTO Users (FullName, Email, OTP, OTPExpiry)
    VALUES (@FullName, @Email, @OTP, @OTPExpiry);

    -- Optionally, return the OTP for debugging or logging
    SELECT @OTP AS GeneratedOTP;
END;
