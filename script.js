let registeredVoters = JSON.parse(localStorage.getItem('registeredVoters')) || [];
let currentVoter = JSON.parse(localStorage.getItem('currentVoter')) || null;

// IST Time utility
function getCurrentIST() {
    const d = new Date();
    return new Date(d.getTime() + (5.5 * 60 * 60 * 1000)); // UTC+5:30
}

function isAfterResultsRelease() {
    const now = getCurrentIST();
    const release = new Date(now);
    release.setHours(22, 35, 0, 0); // 10:35 PM IST
    return now >= release;
}

function hasVoted(voterId) {
    const votes = JSON.parse(localStorage.getItem('votes')) || [];
    return votes.some(v => v.voterId === voterId);
}

/* -----------------------------------------
   PAGE SWITCHING (UPDATED FOR YOUR HTML)
--------------------------------------------- */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');

    // Voting restrictions
    if (pageId === 'vote') {
        if (!currentVoter) {
            alert("⚠️ Please register first.");
            return;
        }
        if (hasVoted(currentVoter.voterId)) {
            document.getElementById("voteLockedMessage").style.display = "none";
            document.getElementById("voteContent").style.display = "block";
        }
    }

    // Results visibility restriction
    if (pageId === 'results' && !isAfterResultsRelease()) {
        alert("⏳ Results will be available at 10:35 PM IST.");
        return;
    }

    // Switch pages
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(pageId).classList.add("active");

    // Update nav button highlight
    navBtns.forEach(b => b.classList.remove("active"));
    document.querySelector(`[onclick="showPage('${pageId}')"]`).classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* -----------------------------------------
   REGISTRATION SYSTEM
--------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    if (currentVoter) {
        enableVoting();
        if (hasVoted(currentVoter.voterId)) disableVoteForm();
    }

    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = voterName.value.trim();
            const voterId = document.getElementById("voterId").value.trim();
            const email = document.getElementById("email").value.trim();
            const wallet = document.getElementById("walletAddress").value.trim();

            if (!name || !voterId || !email || !wallet) {
                showRegistrationStatus("All fields are required.", "error");
                return;
            }
            if (!email.includes("@")) {
                showRegistrationStatus("Enter a valid email.", "error");
                return;
            }
            if (registeredVoters.some(v => v.voterId === voterId)) {
                showRegistrationStatus("Voter ID already exists.", "error");
                return;
            }

            const newVoter = {
                name,
                voterId,
                email,
                walletAddress: wallet,
                timestamp: new Date().toISOString(),
            };

            registeredVoters.push(newVoter);
            currentVoter = newVoter;
            localStorage.setItem("registeredVoters", JSON.stringify(registeredVoters));
            localStorage.setItem("currentVoter", JSON.stringify(currentVoter));

            showRegistrationStatus("✓ Registration successful!", "success");
            enableVoting();
            registerForm.reset();

            setTimeout(() => showPage("vote"), 1200);
        });
    }

    const voteForm = document.getElementById("voteForm");
    if (voteForm) {
        voteForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (hasVoted(currentVoter.voterId)) {
                alert("You have already voted.");
                disableVoteForm();
                return;
            }

            const selected = document.querySelector("input[name='candidate']:checked");
            if (!selected) {
                alert("Select a candidate.");
                return;
            }

            const candidateName = selected.closest(".candidate-card").querySelector("h3").textContent;

            let votes = JSON.parse(localStorage.getItem("votes")) || [];
            votes.push({
                voter: currentVoter.name,
                voterId: currentVoter.voterId,
                candidate: candidateName,
                timestamp: new Date().toISOString(),
            });

            localStorage.setItem("votes", JSON.stringify(votes));

            alert(`Vote submitted for ${candidateName}`);
            disableVoteForm();
            voteForm.reset();

            setTimeout(() => {
                if (isAfterResultsRelease()) showPage("results");
                else alert("Results available at 10:35 PM IST.");
            }, 1000);
        });
    }

    updateResults();

    if (!isAfterResultsRelease()) {
        document.getElementById("results").style.display = "none";
    }

    setInterval(() => {
        if (isAfterResultsRelease()) {
            document.getElementById("results").style.display = "";
            updateResults();
        }
    }, 20000);
});

/* -----------------------------------------
   VOTING ENABLE/DISABLE
--------------------------------------------- */

function disableVoteForm() {
    const form = document.getElementById("voteForm");
    if (!form) return;

    const btn = form.querySelector("button[type='submit']");
    btn.disabled = true;
    btn.textContent = "You have voted!";
    btn.style.opacity = "0.6";
    form.querySelectorAll("input").forEach(i => i.disabled = true);
}

function enableVoting() {
    if (!currentVoter) return;

    document.getElementById("voteLockedMessage").style.display = "none";
    document.getElementById("voteContent").style.display = "block";
    document.getElementById("registeredVoterName").textContent = currentVoter.name;
}

/* -----------------------------------------
   STATUS + RESULTS
--------------------------------------------- */

function showRegistrationStatus(msg, type) {
    const el = document.getElementById("registrationStatus");
    el.textContent = msg;
    el.className = `status-message ${type}`;
}

function goToRegister() {
    showPage("register");
}

function updateResults() {
    const votes = JSON.parse(localStorage.getItem("votes")) || [];

    if (votes.length === 0) return;

    let counts = {
        "Candidate A": 0,
        "Candidate B": 0,
        "Candidate C": 0,
    };

    votes.forEach(v => {
        if (counts[v.candidate] != null) counts[v.candidate]++;
    });

    const total = votes.length;

    document.querySelectorAll(".result-item").forEach((item, index) => {
        const name = Object.keys(counts)[index];
        const count = counts[name];
        const percentage = Math.round((count / total) * 100);

        item.querySelector(".progress-fill").style.width = percentage + "%";
        item.querySelector(".vote-count").textContent = `${count} votes (${percentage}%)`;
    });

    document.querySelector(".total-votes strong").textContent = total;
}

/* -----------------------------------------
   ADMIN: CLEAR ALL DATA
--------------------------------------------- */

window.clearAllData = function () {
    if (!confirm("Clear all data?")) return;

    localStorage.clear();
    currentVoter = null;
    disableVoting();
    document.getElementById("registerForm").reset();
    showRegistrationStatus("All data cleared.", "success");
};
