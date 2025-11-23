let polls = JSON.parse(localStorage.getItem("polls")) || [];
let registeredVoters = JSON.parse(localStorage.getItem('registeredVoters')) || [];
let currentVoter = JSON.parse(localStorage.getItem('currentVoter')) || null;
let currentPollIdHome = null;

// Detect poll ID from URL on page load (for QR code scans)
window.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const pollId = urlParams.get('poll');
  
  if (pollId) {
    // User scanned QR code or clicked poll link
    const poll = polls.find(p => p.id === pollId);
    
    if (poll) {
      // Set current poll and show registration
      currentPollIdHome = pollId;
      
      // Navigate to home page
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      
      const homeNav = document.querySelector('.nav-btn[data-page="home"]');
      const homePage = document.getElementById('home');
      
      if (homeNav) homeNav.classList.add('active');
      if (homePage) homePage.classList.add('active');
      
      // Show registration form directly
      hideAllHomeSections();
      document.getElementById("homeRegisterSection").style.display = "block";
      
      // Scroll to registration
      setTimeout(() => {
        const regSection = document.getElementById("homeRegisterSection");
        if (regSection) {
          regSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 300);
      
      console.log(`Poll detected from QR scan: ${poll.title}`);
    } else {
      alert('Poll not found. Please check the link or QR code.');
    }
  }
});

// Navigation logic for page switching
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const targetPage = btn.getAttribute('data-page');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    let page = document.getElementById(targetPage);
    if(page) { page.classList.add('active'); }
    // Hide all home sub-sections on nav
    if (targetPage === "home") hideAllHomeSections();
    // Hide all results sub-sections
    if (targetPage === "results") {
      if (document.getElementById("resultsAccessForm")) document.getElementById("resultsAccessForm").reset();
      if (document.getElementById("resultsAccessMsg")) document.getElementById("resultsAccessMsg").style.display = "none";
      if (document.getElementById("allResultsSection")) document.getElementById("allResultsSection").style.display = "none";
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

// Home option logic
document.getElementById("chooseCreatePoll").onclick = function () {
  // Navigate to Create Poll page
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  const createPollNav = document.querySelector('.nav-btn[data-page="create-poll"]');
  if (createPollNav) createPollNav.classList.add('active');
  
  const createPollPage = document.getElementById('create-poll');
  if (createPollPage) createPollPage.classList.add('active');
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById("chooseVotePoll").onclick = function () {
  // Show vote by link section on home page
  hideAllHomeSections();
  document.getElementById("homeVotePollSection").style.display = "block";
  // Scroll to the vote section smoothly
  setTimeout(() => {
    const voteSection = document.getElementById("homeVotePollSection");
    if (voteSection) {
      voteSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
};

function hideAllHomeSections() {
  document.getElementById("homeVotePollSection").style.display = "none";
  document.getElementById("homeRegisterSection").style.display = "none";
  document.getElementById("homeVoteSection").style.display = "none";
}

// -------- CREATE POLL LOGIC --------
function removeCandidateHome(btn) {
  let container = document.getElementById("candidateFieldsHome");
  if (container.children.length > 2) {
    btn.parentElement.remove();
  }
  // Only show delete button if more than 2 candidates
  Array.from(container.querySelectorAll(".remove-candidate-btn")).forEach(b => {
    b.style.display = container.children.length > 2 ? "inline-block" : "none";
  });
}
window.removeCandidateHome = removeCandidateHome;

const createPollFormHome = document.getElementById("createPollForm");
const addCandidateBtnHome = document.getElementById("addCandidateBtnHome");

if (addCandidateBtnHome && createPollFormHome) {
  addCandidateBtnHome.onclick = function () {
    let fieldsContainer = document.getElementById("candidateFieldsHome");
    let count = fieldsContainer.querySelectorAll(".candidate-input").length;
    if (count < 7) {
      const idx = count + 1;
      const div = document.createElement("div");
      div.className = "form-group candidate-input";
      div.innerHTML = `
        <label for="candidate${idx}">Candidate ${idx} Name</label>
        <input type="text" id="candidate${idx}" required>
        <button type="button" class="remove-candidate-btn" onclick="removeCandidateHome(this)">❌</button>
      `;
      fieldsContainer.appendChild(div);
      Array.from(fieldsContainer.querySelectorAll(".remove-candidate-btn")).forEach(b => {
        b.style.display = fieldsContainer.children.length > 2 ? "inline-block" : "none";
      });
    }
  };

  createPollFormHome.onsubmit = function (e) {
    e.preventDefault();
    const pollTitle = document.getElementById("pollTitle").value.trim();
    const candidateInputs = createPollFormHome.querySelectorAll(".candidate-input input");
    const candidateNames = [];
    candidateInputs.forEach(inp => {
      if (inp.value.trim() !== "") candidateNames.push(inp.value.trim());
    });
    if (!pollTitle || candidateNames.length < 2) {
      showPollCreationStatus("Title and at least two candidates required.", "error");
      return;
    }
    
    const pollId = 'poll-' + Date.now();
    polls.push({ id: pollId, title: pollTitle, candidates: candidateNames });
    localStorage.setItem("polls", JSON.stringify(polls));
    
    // ✅ GITHUB PAGES URL
    const pollUrl = `https://raksha-mv.github.io/FWD_BlockchainVotingSystem/?poll=${pollId}`;
    
    document.getElementById("pollLinkHome").value = pollUrl;
    
    // Generate QR Code
    const qrcodeContainer = document.getElementById('qrcode');
    if (qrcodeContainer) {
      qrcodeContainer.innerHTML = '';
      new QRCode(qrcodeContainer, {
        text: pollUrl,
        width: 200,
        height: 200,
        colorDark: "#212836",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
      });
    }
    
    document.getElementById('pollLinkSectionHome').style.display = 'block';
    showPollCreationStatus("Poll created successfully!", "success");
    
    createPollFormHome.reset();
    let fieldsContainer = document.getElementById("candidateFieldsHome");
    while (fieldsContainer.children.length > 2) {
      fieldsContainer.lastChild.remove();
    }
    Array.from(fieldsContainer.querySelectorAll(".remove-candidate-btn")).forEach(b => {
      b.style.display = "none";
    });
    
    // Scroll to QR code section
    setTimeout(() => {
      const pollLinkSection = document.getElementById('pollLinkSectionHome');
      if (pollLinkSection) {
        pollLinkSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

function showPollCreationStatus(msg, type) {
  const stat = document.getElementById("pollCreationStatus");
  stat.textContent = msg;
  stat.className = "status-message " + type;
  stat.style.display = 'block';
  setTimeout(() => stat.style.display = 'none', 2000);
}

function copyPollLinkHome() {
  const inp = document.getElementById("pollLinkHome");
  inp.select();
  inp.setSelectionRange(0, 99999); // For mobile devices
  
  // Modern clipboard API with fallback
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(inp.value).then(() => {
      alert("✓ Link copied to clipboard!");
    }).catch(() => {
      // Fallback for older browsers
      document.execCommand("copy");
      alert("✓ Link copied!");
    });
  } else {
    // Fallback for older browsers
    document.execCommand("copy");
    alert("✓ Link copied!");
  }
}
window.copyPollLinkHome = copyPollLinkHome;

// Download QR Code as image
function downloadQRCode() {
  const qrCanvas = document.querySelector('#qrcode canvas');
  if (qrCanvas) {
    const url = qrCanvas.toDataURL("image/png");
    const link = document.createElement('a');
    link.download = 'poll-qr-code.png';
    link.href = url;
    link.click();
    alert("✓ QR code downloaded!");
  } else {
    alert('QR code not found. Please create a poll first.');
  }
}
window.downloadQRCode = downloadQRCode;

// -------- VOTE BY LINK LOGIC --------
document.getElementById("goToRegisterHome").onclick = function () {
  const link = document.getElementById("pollLinkInputHome").value.trim();
  if (!link) {
    alert("Please paste a poll link.");
    return;
  }
  try {
    const url = new URL(link, window.location.href);
    const pollId = new URLSearchParams(url.search).get("poll");
    const poll = polls.find(p => p.id === pollId);
    if (!poll) {
      alert("Invalid link or poll not found!");
      return;
    }
    currentPollIdHome = pollId;
    hideAllHomeSections();
    document.getElementById("homeRegisterSection").style.display = "block";
  } catch {
    alert("Please paste a valid poll link.");
  }
};

// -------- REGISTRATION + VOTE LOGIC --------
const registerFormHome = document.getElementById('registerFormHome');
if (registerFormHome) {
  registerFormHome.addEventListener('submit', function (e) {
    e.preventDefault();
    const voterName = document.getElementById('voterNameHome').value.trim();
    const email = document.getElementById('emailHome').value.trim();
    const walletAddress = document.getElementById('walletAddressHome').value.trim();
    
    if (!voterName || !email || !walletAddress) {
      showRegistrationStatusHome('All fields are required.', 'error');
      return;
    }
    if (email.indexOf('@') === -1) {
      showRegistrationStatusHome('Enter a valid email.', 'error');
      return;
    }
    
    // Check if wallet address already registered
    const voterExists = registeredVoters.some(voter => voter.walletAddress === walletAddress);
    if (voterExists) {
      showRegistrationStatusHome('This wallet address is already registered. Use another.', 'error');
      return;
    }
    
    const newVoter = {
      name: voterName,
      email: email,
      walletAddress: walletAddress,
      timestamp: new Date().toISOString()
    };
    
    registeredVoters.push(newVoter);
    currentVoter = newVoter;
    localStorage.setItem('registeredVoters', JSON.stringify(registeredVoters));
    localStorage.setItem('currentVoter', JSON.stringify(currentVoter));
    
    showRegistrationStatusHome('Registration successful! Proceed to vote.', 'success');
    setTimeout(() => {
      hideAllHomeSections();
      showVoteCandidatesHome();
    }, 1000);
    registerFormHome.reset();
  });
}

function showRegistrationStatusHome(message, type) {
  const statusElement = document.getElementById('registrationStatusHome');
  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  statusElement.style.display = 'block';
  setTimeout(() => statusElement.style.display = 'none', 1800);
}

// -------- CANDIDATES FOR VOTING --------
function showVoteCandidatesHome() {
  const poll = polls.find(p => p.id === currentPollIdHome);
  if (!poll) {
    alert("Invalid poll!");
    return;
  }
  document.getElementById("homeVoteSection").style.display = "block";
  document.getElementById("activePollTitleHome").textContent = poll.title;
  let grid = document.createElement("div");
  grid.className = "candidates-grid";
  grid.innerHTML = poll.candidates.map((name, i) => `
    <label class="candidate-card">
      <input type="radio" name="candidate" value="${name}" required>
      <div class="candidate-content">
        <div class="candidate-avatar">${String.fromCharCode(65+i)}</div>
        <h3>${name}</h3>
        <p>Candidate</p>
      </div>
    </label>
  `).join('');
  const form = document.getElementById("voteFormHome");
  form.querySelector(".candidates-grid")?.remove();
  form.insertBefore(grid, form.querySelector("button[type=submit]"));
}

const voteFormHome = document.getElementById('voteFormHome');
if (voteFormHome) {
  voteFormHome.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentVoter || !currentPollIdHome) {
      alert("Select a poll and register first.");
      return;
    }
    
    let votes = JSON.parse(localStorage.getItem('votes')) || [];
    
    // Check if wallet address already voted in this poll
    if (votes.some(v => v.walletAddress === currentVoter.walletAddress && v.pollId === currentPollIdHome)) {
      alert('You have already voted in this poll!');
      return;
    }
    
    const selectedCandidate = voteFormHome.querySelector("input[name='candidate']:checked");
    if (!selectedCandidate) {
      alert('Please select a candidate.');
      return;
    }
    
    const candidateName = selectedCandidate.value;
    const vote = {
      pollId: currentPollIdHome,
      voter: currentVoter.name,
      candidate: candidateName,
      walletAddress: currentVoter.walletAddress,
      timestamp: new Date().toISOString()
    };
    
    votes.push(vote);
    localStorage.setItem('votes', JSON.stringify(votes));
    alert(`Your vote for ${candidateName} has been recorded securely on the blockchain.`);
    voteFormHome.reset();
  });
}

// -------- RESULTS PAGE LOGIC --------
const resultsAccessForm = document.getElementById("resultsAccessForm");
const walletAddressResults = document.getElementById("walletAddressResults");
const resultsAccessMsg = document.getElementById("resultsAccessMsg");
const allResultsSection = document.getElementById("allResultsSection");
const resultsPollList = document.getElementById("resultsPollList");
const resultsGridSection = document.getElementById("resultsGridSection");

let eligiblePolls = [];
if (resultsAccessForm) {
  resultsAccessForm.addEventListener("submit", function(e) {
    e.preventDefault();
    resultsAccessMsg.style.display = "none";
    const address = walletAddressResults.value.trim();
    
    if (!address) {
      showResultsAccessMsg("Please enter your blockchain wallet address.", "error");
      return;
    }
    
    const votes = JSON.parse(localStorage.getItem('votes')) || [];
    const votedPollIds = votes.filter(v => v.walletAddress === address).map(v => v.pollId);
    
    if (votedPollIds.length === 0) {
      showResultsAccessMsg("You must vote at least once (with this wallet address) to access results.", "error");
      allResultsSection.style.display = "none";
      return;
    }
    
    eligiblePolls = polls.filter(poll => votedPollIds.includes(poll.id));
    if (eligiblePolls.length === 0) {
      showResultsAccessMsg("No eligible polls found for this wallet address.", "error");
      allResultsSection.style.display = "none";
      return;
    }
    
    showResultsAccessMsg("Access granted. Select a poll to view results.", "success");
    renderResultsPollList(address);
    allResultsSection.style.display = "block";
  });
}

function showResultsAccessMsg(msg, type) {
  resultsAccessMsg.textContent = msg;
  resultsAccessMsg.className = "status-message " + type;
  resultsAccessMsg.style.display = "block";
  setTimeout(() => resultsAccessMsg.style.display = 'none', 2000);
}

function renderResultsPollList(address) {
  resultsPollList.innerHTML = "";
  eligiblePolls.forEach(poll => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span style="font-weight:600;color:#8b9ef7;">${poll.title}</span>
      <button class="btn-secondary" onclick="viewPollResults('${poll.id}', '${address}')">View</button>
    `;
    resultsPollList.appendChild(li);
  });
}

window.viewPollResults = function(pollId, address) {
  const poll = polls.find(p => p.id === pollId);
  if (!poll) return;
  const votes = JSON.parse(localStorage.getItem('votes')) || [];
  const voted = votes.some(v => v.walletAddress === address && v.pollId === pollId);
  if (!voted) {
    resultsGridSection.innerHTML = `<div class="status-message error" style="display:block;">You must vote in this poll (with this address) to view results.</div>`;
    document.getElementById("totalVotesCount").textContent = "0";
    return;
  }
  let pollResults = {};
  poll.candidates.forEach(candidate => { pollResults[candidate] = 0; });
  let pollVotes = votes.filter(v => v.pollId === pollId);
  pollVotes.forEach(vote => { if (pollResults[vote.candidate] !== undefined) pollResults[vote.candidate]++; });
  let totalVotes = pollVotes.length;
  let html = "";
  poll.candidates.forEach(candidate => {
    let count = pollResults[candidate] || 0;
    let percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
    html += `
      <div class="result-item">
        <h3>${candidate}</h3>
        <div class="progress-bar"><div class="progress-fill" style="width:${percentage}%;"></div></div>
        <div class="vote-count">${count} votes (${percentage}%)</div>
      </div>
    `;
  });
  resultsGridSection.innerHTML = html;
  document.getElementById("totalVotesCount").textContent = totalVotes.toString();
};

// Footer navigation links
document.querySelectorAll('.footer-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetPage = link.getAttribute('data-page');
    
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Activate target page
    const navBtn = document.querySelector(`.nav-btn[data-page="${targetPage}"]`);
    if (navBtn) navBtn.classList.add('active');
    
    const page = document.getElementById(targetPage);
    if (page) page.classList.add('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
