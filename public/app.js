let currentUser = null;
let currentStep = 1;
let loanData = {};
let nomineeData = {};
const socket = io();

// --- Custom Alert Modal ---
function showAlert(title, message, type = 'success') {
  const modal = document.getElementById('customAlert');
  const icon = document.getElementById('alertIcon');
  const titleEl = document.getElementById('alertTitle');
  const msgEl = document.getElementById('alertMessage');
  
  titleEl.innerText = title;
  msgEl.innerText = message;
  
  if(type === 'success') {
    icon.innerHTML = '<i class="fa-solid fa-circle-check success"></i>';
    icon.className = 'alert-icon success';
  } else {
    icon.innerHTML = '<i class="fa-solid fa-circle-xmark error"></i>';
    icon.className = 'alert-icon error';
  }
  modal.classList.remove('hidden');
}

function closeAlert() { document.getElementById('customAlert').classList.add('hidden'); }

// --- Toast Notification ---
function showToast(name, amount) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid fa-check-circle"></i></div>
    <div class="toast-text"><strong>${name}</strong> সদ্য <b>৳${amount}</b> ঋণ পেয়েছেন।</div>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 4000);
}

function startToastNotifications() {
  const firstNames = ['রহিম', 'সুমন', 'জাহিদ', 'তানভীর', 'সাকিব', 'মিম', 'ফাহিম', 'নাসির', 'রাশেদ', 'আরিফ', 'তুহিন', 'সাব্বির', 'মাহমুদ', 'ফরিদ', 'হাসান', 'রনি', 'শাকিল', 'ইমরান', 'আশিক', 'সজীব', 'আলম', 'মুন্না', 'সাইফুল', 'রুবেল', 'শামীম', 'কবির', 'নাজমুল', 'সিরাজ', 'হৃদয়', 'রিপন'];
  const lastNames = ['উদ্দিন', 'আহমেদ', 'হাসান', 'ইসলাম', 'খান', 'আক্তার', 'হোসেন', 'মিয়া', 'আলম', 'শেখ'];
  const amounts = [2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000];

  setInterval(() => {
    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const randomAmt = amounts[Math.floor(Math.random() * amounts.length)];
    showToast(randomName, randomAmt);
  }, 7000);
}

function startLiveFeedAnimation() {
  const feedDiv = document.getElementById('liveFeed');
  const notiFeed = document.getElementById('notificationFeed');
  if(!feedDiv) return;

  const firstNames = ['রহিম', 'সুমন', 'জাহিদ', 'তানভীর', 'সাকিব', 'মিম', 'ফাহিম', 'নাসির', 'রাশেদ', 'আরিফ', 'তুহিন', 'সাব্বির', 'মাহমুদ', 'ফরিদ', 'হাসান', 'রনি', 'শাকিল', 'ইমরান', 'আশিক', 'সজীব', 'আলম', 'মুন্না', 'সাইফুল', 'রুবেল', 'শামীম', 'কবির', 'নাজমুল', 'সিরাজ', 'হৃদয়', 'রিপন'];
  const lastNames = ['উদ্দিন', 'আহমেদ', 'হাসান', 'ইসলাম', 'খান', 'আক্তার', 'হোসেন', 'মিয়া', 'আলম', 'শেখ'];
  const locations = ['ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'কুমিল্লা'];
  const amounts = [2000, 3000, 5000, 8000, 10000, 15000, 20000, 25000];

  feedDiv.innerHTML = '';
  if(notiFeed) notiFeed.innerHTML = '';

  for(let i=0; i<40; i++) {
    const randomName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];
    const randomAmt = amounts[Math.floor(Math.random() * amounts.length)];
    const phone = '01' + Math.floor(Math.random() * 9) + Math.floor(Math.random() * 9) + '*****';

    const item = document.createElement('div');
    item.className = 'feed-item-animated';
    item.innerHTML = `
      <div class="feed-item-left">
        <div class="feed-avatar"><i class="fa-solid fa-user"></i></div>
        <div class="feed-details">
          <h4>${randomName}</h4>
          <p>${phone} • ${randomLoc}</p>
        </div>
      </div>
      <div class="feed-item-right"><span class="feed-amount">৳ ${randomAmt}</span></div>
    `;
    feedDiv.appendChild(item);

    if (notiFeed) {
      const notiItem = document.createElement('div');
      notiItem.className = 'feed-item-animated';
      notiItem.innerHTML = `
        <div class="feed-item-left">
          <div class="feed-avatar" style="background:#f0fdf4; color:#16a34a;"><i class="fa-solid fa-bell"></i></div>
          <div class="feed-details">
            <h4>${randomName}</h4>
            <p>সদ্য ৳${randomAmt} ঋণ পেয়েছেন।</p>
          </div>
        </div>
      `;
      notiFeed.appendChild(notiItem);
    }
  }

  setInterval(() => {
    if (feedDiv.scrollTop + feedDiv.clientHeight >= feedDiv.scrollHeight - 5) {
      feedDiv.scrollTop = 0;
    } else {
      feedDiv.scrollTop += 1;
    }
  }, 50);
}

socket.on('loan_approved', (loan) => {
  if (currentUser && loan.userId === currentUser.id) {
    showAlert('🎉 অভিনন্দন!', 'আপনার লোন সফলভাবে অ্যাপ্রুভ হয়েছে। ধন্যবাদ! ব্যালেন্স চেক করুন।', 'success');
    setTimeout(() => loadUserData(), 1000);
  }
});

socket.on('withdraw_approved', (w) => {
  if (currentUser && w.userId === currentUser.id) {
    showAlert('সফল!', 'আপনার উইথড্র রিকোয়েস্ট অ্যাপ্রুভ হয়েছে!', 'success');
    setTimeout(() => loadUserData(), 1000);
  }
});

function previewImage(input, previewId) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { document.getElementById(previewId).src = e.target.result; };
    reader.readAsDataURL(input.files[0]);
  }
}

function showLogin() { document.getElementById('registerScreen').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); }
function showRegister() { document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('registerScreen').classList.remove('hidden'); }

async function register() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const profile = document.getElementById('regProfile').files[0];
  
  if (!name || !phone || !password) return showAlert('এরর!', 'সব তথ্য দিন', 'error');

  const formData = new FormData();
  formData.append('name', name);
  formData.append('phone', phone);
  formData.append('email', email);
  formData.append('password', password);
  if(profile) formData.append('profile', profile);

  const res = await fetch('/api/register', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) {
    currentUser = data.user;
    localStorage.setItem('loan_user', JSON.stringify(currentUser));
    loadUserData();
  } else {
    showAlert('এরর!', data.error, 'error');
  }
}

async function login() {
  const phone = document.getElementById('loginPhone').value;
  const password = document.getElementById('loginPassword').value;
  if (!phone || !password) return showAlert('এরর!', 'ফোন ও পাসওয়ার্ড দিন', 'error');

  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password })
  });
  const data = await res.json();
  if (data.success) {
    currentUser = data.user;
    localStorage.setItem('loan_user', JSON.stringify(currentUser));
    loadUserData();
  } else {
    showAlert('এরর!', data.error, 'error');
  }
}

async function loadUserData() {
  document.getElementById('registerScreen').classList.add('hidden');
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('homeScreen').classList.remove('hidden');
  
  document.getElementById('userName').innerText = currentUser.name;
  document.getElementById('homeProfilePic').src = currentUser.profilePic ? '/' + currentUser.profilePic : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  
  startLiveFeedAnimation();
  startToastNotifications();
  showPage('mainPage');

  const res = await fetch('/api/user/' + currentUser.phone);
  const data = await res.json();
  
  document.getElementById('balance').innerText = data.user.balance || '0';
  document.getElementById('walletBalance').innerText = data.user.balance || '0';

  // Load Notifications
  const notiContainer = document.getElementById('notificationFeed');
  if (notiContainer) {
    if (data.notifications.length === 0) {
      notiContainer.innerHTML = '<div class="empty-state" style="text-align:center; padding:20px; color:#94a3b8;">কোনো নোটিফিকেশন নেই</div>';
    } else {
      notiContainer.innerHTML = data.notifications.reverse().map(n => `
        <div class="feed-item-animated" style="padding:15px; background:#f8fafc; border-radius:12px; margin-bottom:10px; border:1px solid #e2e8f0;">
          <div class="feed-item-left">
            <div class="feed-avatar" style="background:#eff6ff; color:#2563eb;"><i class="fa-solid fa-bell"></i></div>
            <div class="feed-details">
              <h4 style="color:#1e293b;">${n.title}</h4>
              <p style="color:#475569; margin-top:5px;">${n.message}</p>
              <small style="color:#94a3b8; font-size:11px;">${new Date(n.date).toLocaleString()}</small>
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  // Load User Loan History
  const historyContainer = document.getElementById('historyList');
  if (historyContainer) {
    if (data.loans.length === 0) {
      historyContainer.innerHTML = '<div class="empty-state" style="text-align:center; padding:20px; color:#94a3b8;">কোনো লোনের হিস্ট্রি নেই</div>';
    } else {
      historyContainer.innerHTML = data.loans.reverse().map(l => `
        <div class="setting-item" style="justify-content: space-between; margin-bottom:10px;">
          <div>
            <div style="font-weight:bold; color:#1e293b;">৳ ${l.amount}</div>
            <div style="font-size:12px; color:#64748b;">${new Date(l.date).toLocaleDateString()}</div>
          </div>
          <div style="font-size:12px; font-weight:bold; color:${l.status === 'APPROVED' ? '#16a34a' : '#ea580c'};">
            ${l.status === 'APPROVED' ? '✓ Approved' : '⏳ Pending'}
          </div>
        </div>
      `).join('');
    }
  }
}

function showPage(pageId) {
  document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
  
  document.getElementById(pageId).classList.remove('hidden');
  
  if(pageId === 'mainPage') document.querySelector('.nav-item:nth-child(1)').classList.add('active');
  if(pageId === 'loanPage') document.querySelector('.nav-item:nth-child(2)').classList.add('active');
  if(pageId === 'historyPage') document.querySelector('.nav-item:nth-child(3)').classList.add('active');
  if(pageId === 'profilePage') document.querySelector('.nav-item:nth-child(4)').classList.add('active');
}

async function updateProfile() {
  const name = document.getElementById('updateName').value;
  const email = document.getElementById('updateEmail').value;
  const password = document.getElementById('updatePassword').value;
  const profileFile = document.getElementById('updateProfile').files[0];

  const formData = new FormData();
  formData.append('userId', currentUser.id);
  formData.append('name', name);
  formData.append('email', email);
  if (password) formData.append('password', password);
  if (profileFile) formData.append('profile', profileFile);

  const res = await fetch('/api/update-profile', { method: 'POST', body: formData });
  const data = await res.json();
  
  if (data.success) {
    currentUser = data.user;
    localStorage.setItem('loan_user', JSON.stringify(currentUser));
    showAlert('সফল!', 'প্রোফাইল আপডেট হয়েছে!', 'success');
    loadUserData();
    showPage('mainPage');
  } else showAlert('এরর!', 'আপডেট ফেইল হয়েছে', 'error');
}

function goToStep(step) {
  if (step === 2) {
    const amount = parseFloat(document.getElementById('loanAmount').value);
    if (!amount || amount < 10000) return showAlert('এরর!', 'সর্বনিম্ন ১০,০০০ টাকা লোন নিতে হবে', 'error');
    if (amount > 300000) return showAlert('এরর!', 'সর্বোচ্চ ৩,০০,০০০ টাকা লোন নেওয়া যাবে', 'error');
    loanData = { amount, duration: document.getElementById('loanDuration').value, paymentMethod: document.getElementById('paymentMethod').value };
  }
  if (step === 3) {
    const fullName = document.getElementById('fullName').value;
    const fatherName = document.getElementById('fatherName').value;
    const motherName = document.getElementById('motherName').value;
    const dob = document.getElementById('dob').value;
    if (!fullName || !fatherName || !motherName || !dob) return showAlert('এরর!', 'সব তথ্য দিন', 'error');
    loanData.fullName = fullName;
    loanData.fatherName = fatherName;
    loanData.motherName = motherName;
    loanData.dob = dob;
  }
  if (step === 4) {
    const address = document.getElementById('address').value;
    const city = document.getElementById('city').value;
    const nid = document.getElementById('nidNumber').value;
    if (!address || !city || !nid) return showAlert('এরর!', 'সব তথ্য দিন', 'error');
    loanData.address = address;
    loanData.city = city;
    loanData.nidNumber = nid;
  }
  if (step === 5) {
    document.getElementById('depositAmountText').innerText = (loanData.amount * 0.10).toFixed(0);
  }

  currentStep = step;
  for (let i = 1; i <= 5; i++) {
    document.getElementById('step' + i).classList.add('hidden');
    if(document.getElementById('s' + i)) document.getElementById('s' + i).classList.remove('active');
  }
  document.getElementById('step' + step).classList.remove('hidden');
  if(document.getElementById('s' + step)) document.getElementById('s' + step).classList.add('active');
  
  const percent = Math.round((step / 5) * 100);
  document.getElementById('progressText').innerText = `Step ${step} of 5 - ${percent}% Complete`;
}

function saveNomineeAndNext() {
  const name = document.getElementById('nomineeName').value;
  const phone = document.getElementById('nomineePhone').value;
  const relation = document.getElementById('nomineeRelation').value;
  
  if (!name || !phone) {
    return showAlert('এরর!', 'নমিনির নাম ও ফোন দিন অথবা Skip করুন', 'error');
  }
  
  nomineeData = { name, phone, relation };
  goToStep(5);
}

function calculateLoan() {
  const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
  const duration = parseInt(document.getElementById('loanDuration').value) || 3;
  const fee = amount * 0.10;
  
  const interest = amount * 0.08;
  const totalRepay = amount + interest;
  const emi = totalRepay / duration;

  document.getElementById('feeDisplay').innerText = '৳ ' + fee.toFixed(0);
  document.getElementById('totalDisplay').innerText = '৳ ' + amount.toFixed(0);
  document.getElementById('emiDisplay').innerText = `৳ ${emi.toFixed(0)} x ${duration} মাস`;
}

function copyNumber() { navigator.clipboard.writeText('+8801351343287'); showAlert('সফল!', 'বিকাশ নাম্বার কপি হয়েছে!', 'success'); }

async function submitLoan() {
  const trxid = document.getElementById('trxid').value;
  if (!trxid) return showAlert('এরর!', 'ট্রানজেকশন আইডি দিন', 'error');

  const nidFront = document.getElementById('nidFrontCamera').files[0] || document.getElementById('nidFrontGallery').files[0];
  const selfie = document.getElementById('selfieCamera').files[0];
  
  if (!nidFront) return showAlert('এরর!', 'NID কার্ডের সামনের ছবি দিন', 'error');
  if (!selfie) return showAlert('এরর!', 'সেলফি তুলুন', 'error');

  const formData = new FormData();
  formData.append('userId', currentUser.id);
  formData.append('amount', loanData.amount);
  formData.append('duration', loanData.duration);
  formData.append('paymentMethod', loanData.paymentMethod);
  formData.append('fullName', loanData.fullName);
  formData.append('nidNumber', loanData.nidNumber);
  formData.append('nomineeName', nomineeData.name || 'N/A');
  formData.append('nomineePhone', nomineeData.phone || 'N/A');
  formData.append('nidFront', nidFront);
  formData.append('selfie', selfie);
  formData.append('trxid', trxid);

  const res = await fetch('/api/apply', { method: 'POST', body: formData });
  const data = await res.json();
  
  if (data.success) {
    document.getElementById('successTrxId').innerText = '#' + (data.loanId || 'L' + Date.now());
    document.getElementById('successAmount').innerText = '৳ ' + loanData.amount;
    showPage('successPage');
  } else {
    showAlert('এরর!', 'আবেদন সফল হয়নি, আবার চেষ্টা করুন', 'error');
  }
}

function showWithdrawForm() {
  document.getElementById('withdrawForm').classList.remove('hidden');
}

async function submitWithdraw() {
  const amount = parseFloat(document.getElementById('withdrawAmount').value);
  const method = document.getElementById('withdrawMethod').value;
  const account = document.getElementById('withdrawAccount').value;

  if (!amount || amount < 100) return showAlert('এরর!', 'সর্বনিম্ন ১০০ টাকা তুলতে পারবেন', 'error');
  if (!account) return showAlert('এরর!', 'অ্যাকাউন্ট নম্বর দিন', 'error');

  const res = await fetch('/api/withdraw', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.id, amount, method, account })
  });
  
  const data = await res.json();
  if (data.success) {
    showAlert('সফল!', 'উইথড্র রিকোয়েস্ট পাঠানো হয়েছে! অ্যাডমিন অ্যাপ্রুভ করলে টাকা পাবেন।', 'success');
    document.getElementById('withdrawForm').classList.add('hidden');
    document.getElementById('withdrawAmount').value = '';
    document.getElementById('withdrawAccount').value = '';
  } else {
    showAlert('এরর!', data.error, 'error');
  }
}

// --- OTP Functions ---
function showOtpScreen() {
  const name = document.getElementById('regName').value;
  const phone = document.getElementById('regPhone').value;
  const password = document.getElementById('regPassword').value;
  
  if (!name || !phone || !password) return showAlert('এরর!', 'সব তথ্য দিন', 'error');
  
  // Show OTP Screen
  document.getElementById('registerScreen').classList.add('hidden');
  document.getElementById('otpScreen').classList.remove('hidden');
  
  // Auto-fill OTP for demo (In real app, this would come from SMS)
  setTimeout(() => {
    showAlert('OTP পাঠানো হয়েছে!', 'ডেমো OTP: 1234', 'success');
  }, 500);
  
  // Move cursor to next input automatically
  const inputs = document.querySelectorAll('#otpScreen input');
  inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
      }
    });
  });
}

async function verifyOtp() {
  const otp1 = document.getElementById('otp1').value;
  const otp2 = document.getElementById('otp2').value;
  const otp3 = document.getElementById('otp3').value;
  const otp4 = document.getElementById('otp4').value;
  
  const otp = otp1 + otp2 + otp3 + otp4;
  
  // For demo, accept any 4 digit OTP
  if (otp.length !== 4) return showAlert('এরর!', '৪ ডিজিটের OTP দিন', 'error');
  
  // Now proceed to register
  await register();
}
