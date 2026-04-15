-- Clear Database Locks for XAMPP MySQL
-- Run this in phpMyAdmin SQL tab or MySQL command line

-- 1. Show current locks
SELECT 
    r.trx_id waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query waiting_query,
    b.trx_id blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;

-- 2. Show all active transactions
SELECT * FROM information_schema.INNODB_TRX;

-- 3. Generate KILL commands for all transactions
-- Copy the output and run each KILL command
SELECT CONCAT('KILL ', trx_mysql_thread_id, ';') AS kill_command
FROM information_schema.INNODB_TRX;

-- 4. Unlock all tables
UNLOCK TABLES;

-- 5. Verify locks are cleared
SHOW OPEN TABLES WHERE In_use > 0;
