const SUPABASE_URL = "https://dmdnnbjbjhjedzodmlft.supabase.co";
const SUPABASE_KEY = "sb_publishable_YOcRrmDG4qJMMF90qW4p2Q_0HH_CA-D";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showMessage("请输入邮箱和密码");
        return;
    }

    showMessage("正在登录...");

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        showMessage("登录失败：" + error.message);
        return;
    }

    showMessage("登录成功");

    document.getElementById("loginPage").style.display = "none";
    document.getElementById("adminPage").style.display = "block";

    await loadDashboard();
}

async function logout() {
    await supabase.auth.signOut();

    document.getElementById("adminPage").style.display = "none";
    document.getElementById("loginPage").style.display = "block";

    document.getElementById("password").value = "";
}

async function loadDashboard() {
    const { data, error } = await supabase
        .from("cards")
        .select("card, duration_days, status, created_at, activated_at, expires_at, device_id")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        showMessage("读取卡密失败：" + error.message);
        return;
    }

    const cards = data || [];

    const total = cards.length;
    const unused = cards.filter(card => card.status === "unused").length;
    const active = cards.filter(card => card.status === "active").length;
    const expired = cards.filter(card => card.status === "expired").length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("unusedCount").textContent = unused;
    document.getElementById("activeCount").textContent = active;
    document.getElementById("expiredCount").textContent = expired;

    renderCards(cards);
}

function renderCards(cards) {
    const tbody = document.getElementById("cardTableBody");

    tbody.innerHTML = "";

    cards.slice(0, 20).forEach(card => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(card.card)}</td>
            <td>${getCardType(card.duration_days)}</td>
            <td>${getStatusHTML(card.status)}</td>
            <td>${formatTime(card.activated_at)}</td>
            <td>${formatTime(card.expires_at)}</td>
            <td>${escapeHTML(card.device_id || "未记录")}</td>
        `;

        tbody.appendChild(row);
    });
}

function getCardType(days) {
    if (days === 1) return "天卡";
    if (days === 7) return "周卡";
    if (days === 30) return "月卡";
    return days + "天";
}

function getStatusHTML(status) {
    if (status === "unused") {
        return '<span class="status status-unused">未激活</span>';
    }

    if (status === "active") {
        return '<span class="status status-active">正常使用</span>';
    }

    if (status === "expired") {
        return '<span class="status status-expired">已过期</span>';
    }

    return '<span class="status">' + escapeHTML(status || "未知") + "</span>";
}

function formatTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

function showMessage(message) {
    const element = document.getElementById("message");

    if (element) {
        element.textContent = message;
    }
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function checkLogin() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("adminPage").style.display = "block";

        await loadDashboard();
    }
}

window.login = login;
window.logout = logout;

window.addEventListener("DOMContentLoaded", checkLogin);
