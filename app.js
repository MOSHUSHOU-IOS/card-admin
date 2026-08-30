const SUPABASE_URL =
    "https://dmdnnbjbjhjedzodmlft.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_YOcRrmDG4qJMMF90qW4p2Q_0HH_CA-D";


const supabase =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ==================================================
// 心跳设置
// ==================================================

const HEARTBEAT_TIMEOUT = 5000;
const HEARTBEAT_REFRESH_INTERVAL = 2000;

let heartbeatTimer = null;


// ==================================================
// 登录
// ==================================================

async function login() {

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;


    if (!email || !password) {

        showMessage("请输入邮箱和密码");

        return;
    }


    showMessage("正在登录...");


    const { error } =
        await supabase.auth.signInWithPassword({

            email,
            password

        });


    if (error) {

        showMessage(
            "登录失败：" + error.message
        );

        return;
    }


    showMessage("登录成功");


    showAdminPage();


    await loadDashboard();

    startHeartbeatRefresh();
}


// ==================================================
// 显示后台
// ==================================================

function showAdminPage() {

    document.getElementById(
        "loginPage"
    ).style.display = "none";


    document.getElementById(
        "adminPage"
    ).style.display = "block";
}


// ==================================================
// 显示登录
// ==================================================

function showLoginPage() {

    document.getElementById(
        "adminPage"
    ).style.display = "none";


    document.getElementById(
        "loginPage"
    ).style.display = "flex";
}


// ==================================================
// 退出
// ==================================================

async function logout() {

    stopHeartbeatRefresh();


    await supabase.auth.signOut();


    showLoginPage();


    document.getElementById(
        "password"
    ).value = "";
}


// ==================================================
// 忘记密码
// ==================================================

function showForgotPassword() {

    const box =
        document.getElementById(
            "forgotPasswordBox"
        );


    if (!box) {

        showMessage(
            "找不到密码重置区域"
        );

        return;
    }


    box.style.display = "block";


    const email =
        document.getElementById(
            "email"
        ).value.trim();


    if (email) {

        showMessage(
            "点击下面的按钮发送重置邮件"
        );

    } else {

        showMessage(
            "请先输入管理员邮箱"
        );
    }
}


// ==================================================
// 发送密码重置邮件
// ==================================================

async function sendResetEmail() {

    const email =
        document.getElementById(
            "email"
        ).value.trim();


    if (!email) {

        showMessage(
            "请先输入管理员邮箱"
        );

        return;
    }


    showMessage(
        "正在发送重置邮件..."
    );


    const redirectUrl =
        "https://moshushou-ios.github.io/card-admin/";


    const { error } =
        await supabase.auth.resetPasswordForEmail(

            email,

            {
                redirectTo: redirectUrl
            }

        );


    if (error) {

        showMessage(
            "发送失败：" + error.message
        );

        return;
    }


    showMessage(
        "重置邮件已发送，请检查邮箱"
    );
}


// ==================================================
// 密码恢复事件
// ==================================================

supabase.auth.onAuthStateChange(

    async (event, session) => {

        if (
            event === "PASSWORD_RECOVERY"
        ) {

            const box =
                document.getElementById(
                    "forgotPasswordBox"
                );


            const resetBox =
                document.getElementById(
                    "resetPasswordBox"
                );


            if (box) {

                box.style.display =
                    "block";
            }


            if (resetBox) {

                resetBox.style.display =
                    "block";
            }


            showMessage(
                "请输入新的管理员密码"
            );
        }
    }
);


// ==================================================
// 修改密码
// ==================================================

async function resetPassword() {

    const newPassword =
        document.getElementById(
            "newPassword"
        ).value;


    const confirmPassword =
        document.getElementById(
            "confirmPassword"
        ).value;


    if (
        !newPassword ||
        !confirmPassword
    ) {

        showMessage(
            "请输入新密码"
        );

        return;
    }


    if (
        newPassword.length < 6
    ) {

        showMessage(
            "新密码至少需要 6 位"
        );

        return;
    }


    if (
        newPassword !==
        confirmPassword
    ) {

        showMessage(
            "两次输入的密码不一致"
        );

        return;
    }


    showMessage(
        "正在修改密码..."
    );


    const { error } =
        await supabase.auth.updateUser({

            password:
                newPassword

        });


    if (error) {

        showMessage(
            "修改密码失败：" +
            error.message
        );

        return;
    }


    showMessage(
        "密码修改成功，请重新登录"
    );


    document.getElementById(
        "newPassword"
    ).value = "";


    document.getElementById(
        "confirmPassword"
    ).value = "";


    await supabase.auth.signOut();


    showLoginPage();
}


// ==================================================
// 加载后台
// ==================================================

async function loadDashboard() {

    const { data, error } =
        await supabase

            .from("cards")

            .select(
                "card, duration_days, status, created_at, activated_at, expires_at, device_id"
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.error(error);

        showMessage(
            "读取卡密失败：" +
            error.message
        );

        return;
    }


    const cards =
        data || [];


    updateStatistics(cards);

    renderCards(cards);

    renderStock(cards);

    await loadHeartbeats(cards);
}


// ==================================================
// 更新统计
// ==================================================

function updateStatistics(cards) {

    const total =
        cards.length;


    const unused =
        cards.filter(
            card =>
                card.status === "unused"
        ).length;


    const active =
        cards.filter(
            card =>
                card.status === "active"
        ).length;


    const expired =
        cards.filter(
            card =>
                card.status === "expired"
        ).length;


    document.getElementById(
        "totalCount"
    ).textContent = total;


    document.getElementById(
        "unusedCount"
    ).textContent = unused;


    document.getElementById(
        "activeCount"
    ).textContent = active;


    document.getElementById(
        "expiredCount"
    ).textContent = expired;
}


// ==================================================
// 最近卡密
// ==================================================

function renderCards(cards) {

    const tbody =
        document.getElementById(
            "cardTableBody"
        );


    if (!tbody)
        return;


    tbody.innerHTML = "";


    if (cards.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    暂无卡密
                </td>
            </tr>
        `;

        return;
    }


    cards
        .slice(0, 20)
        .forEach(card => {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        card.card
                    )}
                </td>

                <td>
                    ${getCardType(
                        card.duration_days
                    )}
                </td>

                <td>
                    ${getStatusHTML(
                        card.status
                    )}
                </td>

                <td>
                    ${formatTime(
                        card.activated_at
                    )}
                </td>

                <td>
                    ${formatTime(
                        card.expires_at
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        card.device_id ||
                        "未记录"
                    )}
                </td>

            `;


            tbody.appendChild(row);
        });
}


// ==================================================
// 库存
// ==================================================

function renderStock(cards) {

    const types = {

        day: 1,

        week: 7,

        month: 30

    };


    for (
        const [name, days]
        of Object.entries(types)
    ) {

        const unused =
            cards.filter(
                card =>
                    card.duration_days === days &&
                    card.status === "unused"
            ).length;


        const active =
            cards.filter(
                card =>
                    card.duration_days === days &&
                    card.status === "active"
            ).length;


        const expired =
            cards.filter(
                card =>
                    card.duration_days === days &&
                    card.status === "expired"
            ).length;


        const unusedElement =
            document.getElementById(
                `${name}Unused`
            );


        const activeElement =
            document.getElementById(
                `${name}Active`
            );


        const expiredElement =
            document.getElementById(
                `${name}Expired`
            );


        if (unusedElement)
            unusedElement.textContent =
                unused;


        if (activeElement)
            activeElement.textContent =
                active;


        if (expiredElement)
            expiredElement.textContent =
                expired;
    }
}


// ==================================================
// 心跳读取
// ==================================================

async function loadHeartbeats(cards) {

    const tbody =
        document.getElementById(
            "onlineTableBody"
        );


    if (!tbody)
        return;


    const { data, error } =
        await supabase

            .from("card_heartbeats")

            .select(
                "card, device_id, last_heartbeat"
            );


    if (error) {

        console.error(
            "读取心跳失败：",
            error
        );


        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    读取心跳失败：
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;

        return;
    }


    const heartbeats =
        data || [];


    const now =
        Date.now();


    const cardMap =
        new Map();


    cards.forEach(card => {

        cardMap.set(
            card.card,
            card
        );

    });


    const rows = [];


    heartbeats.forEach(heartbeat => {

        const card =
            cardMap.get(
                heartbeat.card
            );


        if (!card)
            return;


        const heartbeatTime =
            new Date(
                heartbeat.last_heartbeat
            ).getTime();


        if (
            Number.isNaN(
                heartbeatTime
            )
        )
            return;


        const elapsed =
            now - heartbeatTime;


        const online =
            elapsed <=
            HEARTBEAT_TIMEOUT;


        rows.push({

            heartbeat,

            card,

            online,

            elapsed

        });

    });


    rows.sort(
        (a, b) => {

            if (
                a.online !==
                b.online
            ) {

                return a.online
                    ? -1
                    : 1;
            }


            return (
                new Date(
                    b.heartbeat.last_heartbeat
                ).getTime()
                -
                new Date(
                    a.heartbeat.last_heartbeat
                ).getTime()
            );
        }
    );


    renderHeartbeatRows(rows);
}


// ==================================================
// 显示心跳列表
// ==================================================

function renderHeartbeatRows(rows) {

    const tbody =
        document.getElementById(
            "onlineTableBody"
        );


    if (!tbody)
        return;


    tbody.innerHTML = "";


    if (rows.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    暂无心跳数据
                </td>
            </tr>
        `;

        return;
    }


    rows.forEach(item => {

        const heartbeat =
            item.heartbeat;

        const card =
            item.card;

        const row =
            document.createElement(
                "tr"
            );


        const statusHTML =
            item.online

                ? `
                    <span class="online">
                        🟢 在线
                    </span>
                  `

                : `
                    <span class="offline">
                        ⚪ 离线
                    </span>
                  `;


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    heartbeat.card
                )}
            </td>

            <td>
                ${getCardType(
                    card.duration_days
                )}
            </td>

            <td>
                ${escapeHTML(
                    heartbeat.device_id ||
                    card.device_id ||
                    "未记录"
                )}
            </td>

            <td>
                ${formatTime(
                    heartbeat.last_heartbeat
                )}
            </td>

            <td>
                ${formatTime(
                    card.activated_at
                )}
            </td>

            <td>
                ${formatTime(
                    card.expires_at
                )}
            </td>

            <td>
                ${statusHTML}
            </td>

        `;


        tbody.appendChild(row);

    });
}


// ==================================================
// 自动刷新心跳
// ==================================================

function startHeartbeatRefresh() {

    stopHeartbeatRefresh();


    heartbeatTimer =
        setInterval(
            async () => {

                const { data } =
                    await supabase.auth.getSession();


                if (!data.session) {

                    stopHeartbeatRefresh();

                    return;
                }


                await loadHeartbeatOnly();

            },

            HEARTBEAT_REFRESH_INTERVAL
        );
}


// ==================================================
// 只刷新心跳
// ==================================================

async function loadHeartbeatOnly() {

    const { data, error } =
        await supabase

            .from("cards")

            .select(
                "card, duration_days, status, created_at, activated_at, expires_at, device_id"
            );


    if (error) {

        console.error(
            "刷新卡密失败：",
            error
        );

        return;
    }


    await loadHeartbeats(
        data || []
    );
}


// ==================================================
// 停止自动刷新
// ==================================================

function stopHeartbeatRefresh() {

    if (
        heartbeatTimer
    ) {

        clearInterval(
            heartbeatTimer
        );

        heartbeatTimer = null;
    }
}


// ==================================================
// 指定卡密查询
// ==================================================

async function searchCard() {

    const input =
        document.getElementById(
            "searchInput"
        );


    const result =
        document.getElementById(
            "searchResult"
        );


    const card =
        input.value.trim();


    if (!card) {

        result.innerHTML =
            "请输入卡密";

        return;
    }


    result.innerHTML =
        "正在查询...";


    const { data, error } =
        await supabase

            .from("cards")

            .select(
                "card, duration_days, status, created_at, activated_at, expires_at, device_id"
            )

            .eq(
                "card",
                card
            )

            .maybeSingle();


    if (error) {

        console.error(error);

        result.innerHTML =
            "查询失败：" +
            escapeHTML(
                error.message
            );

        return;
    }


    if (!data) {

        result.innerHTML =
            "没有找到这张卡密";

        return;
    }


    result.innerHTML = `

        <div class="card">

            <p>
                <strong>卡密：</strong>
                ${escapeHTML(data.card)}
            </p>

            <p>
                <strong>类型：</strong>
                ${getCardType(
                    data.duration_days
                )}
            </p>

            <p>
                <strong>状态：</strong>
                ${getStatusHTML(
                    data.status
                )}
            </p>

            <p>
                <strong>激活时间：</strong>
                ${formatTime(
                    data.activated_at
                )}
            </p>

            <p>
                <strong>到期时间：</strong>
                ${formatTime(
                    data.expires_at
                )}
            </p>

            <p>
                <strong>设备 ID：</strong>
                ${escapeHTML(
                    data.device_id ||
                    "未记录"
                )}
            </p>

        </div>

    `;
}


// ==================================================
// 状态查询
// ==================================================

async function showCardsByStatus(
    status,
    title
) {

    const { data, error } =
        await supabase

            .from("cards")

            .select(
                "card, duration_days, status, created_at, activated_at, expires_at, device_id"
            )

            .eq(
                "status",
                status
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        showMessage(
            "查询失败：" +
            error.message
        );

        return;
    }


    const cards =
        data || [];


    const tbody =
        document.getElementById(
            "cardTableBody"
        );


    tbody.innerHTML = "";


    if (
        cards.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td colspan="6">
                    ${title}：暂无数据
                </td>

            </tr>

        `;

        return;
    }


    cards.forEach(card => {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                ${escapeHTML(
                    card.card
                )}
            </td>

            <td>
                ${getCardType(
                    card.duration_days
                )}
            </td>

            <td>
                ${getStatusHTML(
                    card.status
                )}
            </td>

            <td>
                ${formatTime(
                    card.activated_at
                )}
            </td>

            <td>
                ${formatTime(
                    card.expires_at
                )}
            </td>

            <td>
                ${escapeHTML(
                    card.device_id ||
                    "未记录"
                )}
            </td>

        `;


        tbody.appendChild(row);
    });


    showMessage(
        `${title}：${cards.length} 张`
    );
}


function showUnusedCards() {

    showCardsByStatus(
        "unused",
        "未激活卡密"
    );
}


function showActiveCards() {

    showCardsByStatus(
        "active",
        "已激活卡密"
    );
}


function showExpiredCards() {

    showCardsByStatus(
        "expired",
        "已过期卡密"
    );
}


// ==================================================
// 卡密类型
// ==================================================

function getCardType(days) {

    if (days === 1)
        return "天卡";

    if (days === 7)
        return "周卡";

    if (days === 30)
        return "月卡";

    return days + "天";
}


// ==================================================
// 状态
// ==================================================

function getStatusHTML(status) {

    if (status === "unused") {

        return `
            <span class="status status-unused">
                未激活
            </span>
        `;
    }


    if (status === "active") {

        return `
            <span class="status status-active">
                正常使用
            </span>
        `;
    }


    if (status === "expired") {

        return `
            <span class="status status-expired">
                已过期
            </span>
        `;
    }


    return `
        <span class="status">
            ${escapeHTML(
                status || "未知"
            )}
        </span>
    `;
}


// ==================================================
// 时间
// ==================================================

function formatTime(value) {

    if (!value)
        return "—";


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";
    }


    return date.toLocaleString(
        "zh-CN",
        {

            timeZone:
                "Asia/Shanghai",

            year:
                "numeric",

            month:
                "2-digit",

            day:
                "2-digit",

            hour:
                "2-digit",

            minute:
                "2-digit",

            second:
                "2-digit",

            hour12:
                false
        }
    );
}


// ==================================================
// 生成卡密
// ==================================================

function randomPart(length = 4) {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let result = "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];
    }


    return result;
}


function generateCardCode(type) {

    const prefix =
        type.toUpperCase();


    return `
        ${prefix}-${randomPart()}-${randomPart()}-${randomPart()}
    `.replace(/\s+/g, "");
}


async function generateCards() {

    const type =
        document.getElementById(
            "generateType"
        ).value;


    const count =
        Number(
            document.getElementById(
                "generateCount"
            ).value
        );


    if (
        !Number.isInteger(count) ||
        count < 1 ||
        count > 1000
    ) {

        showMessage(
            "生成数量必须是 1～1000"
        );

        return;
    }


    const durationMap = {

        day: 1,

        week: 7,

        month: 30

    };


    const durationDays =
        durationMap[type];


    const cards = [];


    for (
        let i = 0;
        i < count;
        i++
    ) {

        cards.push({

            card:
                generateCardCode(type),

            duration_days:
                durationDays,

            status:
                "unused"

        });
    }


    showMessage(
        "正在保存卡密..."
    );


    const { data, error } =
        await supabase

            .from("cards")

            .insert(cards)

            .select(
                "card"
            );


    if (error) {

        console.error(error);

        showMessage(
            "生成失败：" +
            error.message
        );

        return;
    }


    const generated =
        (data || [])
            .map(
                item =>
                    item.card
            )
            .join("\n");


    document.getElementById(
        "generatedCards"
    ).textContent =
        generated;


    document.getElementById(
        "generateResult"
    ).style.display =
        "block";


    showMessage(
        `成功生成 ${data.length} 张卡密`
    );


    await loadDashboard();
}


// ==================================================
// 复制生成的卡密
// ==================================================

async function copyGeneratedCards() {

    const text =
        document.getElementById(
            "generatedCards"
        ).textContent;


    if (!text) {

        showMessage(
            "没有可复制的卡密"
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        showMessage(
            "已复制全部卡密"
        );

    } catch (error) {

        console.error(error);

        showMessage(
            "复制失败，请手动复制"
        );
    }
}


// ==================================================
// 清空生成结果
// ==================================================

function clearGeneratedCards() {

    document.getElementById(
        "generatedCards"
    ).textContent = "";


    document.getElementById(
        "generateResult"
    ).style.display =
        "none";
}
// ==================================================
// 消息提示
// ==================================================

function showMessage(message) {

    const element =
        document.getElementById("message");

    if (element) {

        element.textContent = message;

    }
}


// ==================================================
// HTML 安全处理
// ==================================================

function escapeHTML(value) {

    ...

// ==================================================
// HTML 安全处理
// ==================================================

function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


// ==================================================
// 登录状态检查
// ==================================================

async function checkLogin() {

    const { data } =
        await supabase.auth.getSession();


    if (data.session) {

        showAdminPage();

        await loadDashboard();

        startHeartbeatRefresh();

    } else {

        showLoginPage();
    }
}


// ==================================================
// 暴露给 HTML
// ==================================================

window.login =
    login;

window.logout =
    logout;

window.showForgotPassword =
    showForgotPassword;

window.sendResetEmail =
    sendResetEmail;

window.resetPassword =
    resetPassword;

window.generateCards =
    generateCards;

window.copyGeneratedCards =
    copyGeneratedCards;

window.clearGeneratedCards =
    clearGeneratedCards;

window.searchCard =
    searchCard;

window.showUnusedCards =
    showUnusedCards;

window.showActiveCards =
    showActiveCards;

window.showExpiredCards =
    showExpiredCards;

window.loadDashboard =
    loadDashboard;


// ==================================================
// 页面启动
// ==================================================

window.addEventListener(
    "DOMContentLoaded",
    checkLogin
);
