const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const pdfkit = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

// Set up MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', 
  password: '12345@shubham', 
  database: 'mess_payment_system',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Middleware
app.use(express.json());
app.use(cors()); 
app.use('/receipts', express.static(path.join(__dirname, 'receipts'))); 

app.post('/api/payments', (req, res) => {
  const { userId, name, plates, totalAmount, transactionId } = req.body;

  // Input validation
  if (!userId || !name || !plates || !totalAmount || !transactionId) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  if (isNaN(plates) || plates <= 0) {
    return res.status(400).json({ success: false, message: 'Number of plates must be a positive number' });
  }

  if (isNaN(totalAmount) || totalAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Total amount must be a positive number' });
  }

  // Check if user exists
  const userCheckQuery = 'SELECT * FROM users WHERE user_id = ?';
  db.query(userCheckQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error checking user existence: ', err);
      return res.status(500).json({ success: false, message: 'Error checking user existence' });
    }

    if (result.length === 0) {
      // User doesn't exist, send an error
      return res.status(400).json({ success: false, message: 'User not found' });
    }


    const query = 'INSERT INTO payments (user_id, plates, total_amount, transaction_id ,name) VALUES (?, ?, ?, ?,?)';
    db.query(query, [userId, plates, totalAmount, transactionId, name], (err, result) => {
      if (err) {
        console.error('Error inserting payment: ', err);
        return res.status(500).json({ success: false, message: 'Error saving payment' });
      }

      const paymentId = result.insertId;

    
      const receiptPath = generateReceipt(name, plates, totalAmount, transactionId);

      // Insert receipt path into the receipts table
      const receiptQuery = 'INSERT INTO receipts (payment_id, receipt_path) VALUES (?, ?)';
      db.query(receiptQuery, [paymentId, receiptPath], (err, result) => {
        if (err) {
          console.error('Error saving receipt: ', err);
          return res.status(500).json({ success: false, message: 'Error saving receipt' });
        }

        res.status(200).json({
          success: true,
          message: 'Payment successful',
          receiptUrl: `/receipts/${path.basename(receiptPath)}`, 
        });
      });
    });
  });
});

// Function to generate receipt (PDF)
function generateReceipt(name, plates, totalAmount, transactionId) {
  const doc = new pdfkit();
  const receiptDir = path.join(__dirname, 'receipts');

  
  if (!fs.existsSync(receiptDir)) {
    fs.mkdirSync(receiptDir);
  }

  // Generate a unique receipt file name
  const receiptFileName = `receipt_${transactionId}.pdf`;
  const receiptPath = path.join(receiptDir, receiptFileName);

  doc.pipe(fs.createWriteStream(receiptPath));

  doc.fontSize(18).text(`Payment Receipt`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${name}`);
  doc.text(`Meal Type: Lunch`);
  doc.text(`Price Per Plate: ₹80`);
  doc.text(`Number of Plates: ${plates}`);
  doc.text(`Total Amount: ₹${totalAmount}`);
  doc.text(`Transaction ID: ${transactionId}`);

  doc.end();

  return receiptPath;
}

// API to fetch payment history
app.get('/api/payments/history', (req, res) => {
  const query = `
    SELECT payments.payment_id, payments.name, payments.transaction_id, payments.plates, payments.total_amount
    FROM payments
    JOIN users ON payments.user_id = users.user_id
    ORDER BY payments.payment_id DESC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching payment history:', err);
      return res.status(500).json({ success: false, message: 'Error fetching payment history' });
    }

    res.status(200).json({ success: true, data: results });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
