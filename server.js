const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
const upload = multer({ dest: 'uploads/' });

const DB_FILE = './database.json';
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], loans: [], withdrawals: [], approvedList: [], notifications: [] }));
const readDB = () => JSON.parse(fs.readFileSync(DB_FILE));
const writeDB = (data) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

// Register
app.post('/api/register', upload.single('profile'), (req, res) => {
  const { name, phone, password, email } = req.body;
  const db = readDB();
  if (db.users.find(u => u.phone === phone)) return res.status(400).json({ error: 'Phone already registered' });
  
  const user = { id: 'U' + Date.now(), name, phone, password, email: email || '', profilePic: req.file ? req.file.path : null, balance: 0 };
  db.users.push(user);
  writeDB(db);
  res.json({ success: true, user });
});

// Login
app.post('/api/login', (req, res) => {
  const { phone, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.phone === phone && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ success: true, user });
});

// Update Profile
app.post('/api/update-profile', upload.single('profile'), (req, res) => {
  const { userId, name, email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;
  if (req.file) user.profilePic = req.file.path;

  writeDB(db);
  res.json({ success: true, user });
});

// Get User Data with Notifications
app.get('/api/user/:phone', (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.phone === req.params.phone);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  const loans = db.loans.filter(l => l.userId === user.id);
  const withdrawals = db.withdrawals ? db.withdrawals.filter(w => w.userId === user.id) : [];
  const notifications = db.notifications ? db.notifications.filter(n => n.userId === user.id) : [];
  
  res.json({ user, loans, withdrawals, notifications });
});

// Apply Loan
const cpUpload = upload.fields([{ name: 'nidFront', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]);
app.post('/api/apply', cpUpload, (req, res) => {
  const { userId, amount, duration, paymentMethod, nidNumber, loanPurpose, fullName, nomineeName, nomineePhone } = req.body;
  const files = req.files;
  const db = readDB();
  
  const fee = amount * 0.10; 
  const loan = {
    id: 'L' + Date.now(),
    userId, amount, fee, duration, paymentMethod, nidNumber, loanPurpose, fullName, nomineeName, nomineePhone,
    nidFrontPhoto: files['nidFront'] ? files['nidFront'][0].path : null,
    selfiePhoto: files['selfie'] ? files['selfie'][0].path : null,
    status: 'PENDING',
    date: new Date().toISOString()
  };
  
  db.loans.push(loan);
  writeDB(db);
  io.emit('new_loan', loan); 
  res.json({ success: true, loanId: loan.id });
});

// Withdraw Request
app.post('/api/withdraw', (req, res) => {
  const { userId, amount, method, account } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.id === userId);
  
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.balance < amount) return res.status(400).json({ error: 'অপর্যাপ্ত ব্যালেন্স' });
  if (!db.withdrawals) db.withdrawals = [];

  const withdrawal = {
    id: 'W' + Date.now(),
    userId, amount, method, account,
    status: 'PENDING',
    date: new Date().toISOString()
  };

  db.withdrawals.push(withdrawal);
  writeDB(db);
  io.emit('new_withdrawal', withdrawal);
  res.json({ success: true, withdrawal });
});

// Admin Approve Loan
app.post('/api/admin/approve', (req, res) => {
  const { loanId } = req.body;
  const db = readDB();
  const loan = db.loans.find(l => l.id === loanId);
  if (!loan || loan.status === 'APPROVED') return res.status(400).json({ error: 'Invalid' });

  loan.status = 'APPROVED';
  const user = db.users.find(u => u.id === loan.userId);
  if (user) user.balance += Number(loan.amount);
  
  db.approvedList = db.approvedList || [];
  db.approvedList.push({ name: user.name, phone: user.phone, amount: loan.amount, date: new Date().toISOString() });
  
  // Add Notification
  db.notifications = db.notifications || [];
  db.notifications.push({
    userId: loan.userId,
    title: 'লোন অ্যাপ্রুভড!',
    message: `আপনার ৳${loan.amount} লোনটি সফলভাবে অ্যাপ্রুভ হয়েছে।`,
    date: new Date().toISOString()
  });
  
  writeDB(db);
  io.emit('loan_approved', loan);
  res.json({ success: true });
});

// Admin Approve Withdrawal
app.post('/api/admin/approve-withdrawal', (req, res) => {
  const { withdrawId } = req.body;
  const db = readDB();
  const w = db.withdrawals.find(w => w.id === withdrawId);
  if (!w || w.status === 'APPROVED') return res.status(400).json({ error: 'Invalid' });

  w.status = 'APPROVED';
  const user = db.users.find(u => u.id === w.userId);
  if (user) user.balance -= Number(w.amount);
  
  // Add Notification
  db.notifications = db.notifications || [];
  db.notifications.push({
    userId: w.userId,
    title: 'উইথড্র অ্যাপ্রুভড!',
    message: `আপনার ৳${w.amount} উইথড্র রিকোয়েস্ট সফল হয়েছে।`,
    date: new Date().toISOString()
  });
  
  writeDB(db);
  io.emit('withdraw_approved', w);
  res.json({ success: true });
});

// Admin APIs
app.get('/api/admin/loans', (req, res) => res.json(readDB().loans));
app.get('/api/admin/withdrawals', (req, res) => res.json(readDB().withdrawals || []));
app.get('/api/approved-list', (req, res) => res.json(readDB().approvedList || []));

server.listen(3000, () => console.log('🚀 App running on http://localhost:3000'));
