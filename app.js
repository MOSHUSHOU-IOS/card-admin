// ==================================================
// Supabase 配置
// ==================================================

const SUPABASE_URL =
    "https://dmdnnbjbjhjedzodmlft.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_YOcRrmDG4qJMMF90qW4p2Q_0HH_CA-D";


// ==================================================
// Supabase 初始化
// ==================================================

let supabase = null;

function initSupabase() {

    try {

        if (
            !window.supabase ||
            typeof window.supabase.createClient !== "function"
        ) {

            console.error(
                "Supabase JS SDK 未加载"
            );

            showMessage(
                "系统错误：Supabase 未加载"
            );

            return false;
        }


        supabase =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );


        console.log(
            "Supabase 初始化成功"
        );


        return true;

    } catch (error) {

        console.error(
            "Supabase 初始化失败：",
            error
        );

        showMessage(
            "Supabase 初始化失败"
        );

        return false;
    }
}


// ==================================================
// 心跳设置
// ==================================================

const HEARTBEAT_TIMEOUT = 5000;

const HEARTBEAT_REFRESH_INTERVAL = 2000;

let heartbeatTimer = null;

let dashboardLoading = false;

let heartbeatLoading = false;


// ==================================================
// 登录
// ==================================================

async function login() {

    console.log(
        "login() 被调用"
    );


    if (!supabase) {

        showMessage(
            "系统尚未初始化，请刷新页面"
        );

        console.error(
            "Supabase 实例不存在"
        );

        return;
    }


    const emailElement =
        document.getElementById(
            "email"
        );


    const passwordElement =
        document.getElementById(
            "password"
        );


    if (!emailElement || !passwordElement) {

        showMessage(
            "找不到邮箱或密码输入框"
        );

        console.error(
            "缺少 #email 或 #password"
        );

        return;
    }


    const email =
        emailElement.value.trim();


    const password =
        passwordElement.value;


    if (!email || !password) {

        showMessage(
            "请输入邮箱和密码"
        );

        return;
    }


    showMessage(
        "正在登录..."
    );


    try {

        console.log(
            "正在请求 Supabase 登录..."
        );


        const result =
            await supabase.auth.signInWithPassword({

                email:
                    email,

                password:
                    password

            });


        console.log(
            "登录返回：",
            result
        );


        const data =
            result.data;

        const error =
            result.error;


        if (error) {

            console.error(
                "登录失败：",
                error
            );


            showMessage(
                "登录失败：" +
                error.message
            );

            return;
        }


        if (!data || !data.session) {

            console.error(
                "登录成功但没有 session"
            );

            showMessage(
                "登录失败：未获取到登录会话"
            );

            return;
        }


        console.log(
            "登录成功",
            data.user
        );


        showMessage(
            "登录成功"
        );


        showAdminPage();


        await loadDashboard();


        startHeartbeatRefresh();

    } catch (error) {

        console.error(
            "登录异常：",
            error
        );


        showMessage(
            "登录异常：" +
            (
                error.message ||
                "请检查网络连接"
            )
        );
    }
}


// ==================================================
// 显示后台
// ==================================================

function showAdminPage() {

    const loginPage =
        document.getElementById(
            "loginPage"
        );


    const adminPage =
        document.getElementById(
            "adminPage"
        );


    if (loginPage) {

        loginPage.style.display =
            "none";
    }


    if (adminPage) {

        adminPage.style.display =
            "block";
    }
}


// ==================================================
// 显示登录
// ==================================================

function showLoginPage() {

    const loginPage =
        document.getElementById(
            "loginPage"
        );


    const adminPage =
        document.getElementById(
            "adminPage"
        );


    if (adminPage) {

        adminPage.style.display =
            "none";
    }


    if (loginPage) {

        loginPage.style.display =
            "flex";
    }
}


// ==================================================
// 退出
// ==================================================

async function logout() {

    stopHeartbeatRefresh();


    if (!supabase) {

        showLoginPage();

        return;
    }


    try {

        const { error } =
            await supabase.auth.signOut();


        if (error) {

            console.error(
                "退出失败：",
                error
            );
        }

    } catch (error) {

        console.error(
            "退出异常：",
            error
        );
    }


    showLoginPage();


    const password =
        document.getElementById(
            "password"
        );


    if (password) {

        password.value =
            "";
    }
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


    box.style.display =
        "block";


    const emailElement =
        document.getElementById(
            "email"
        );


    const email =
        emailElement
            ? emailElement.value.trim()
            : "";


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

    if (!supabase) {

        showMessage(
            "系统尚未初始化"
        );

        return;
    }


    const emailElement =
        document.getElementById(
            "email"
        );


    const email =
        emailElement
            ? emailElement.value.trim()
            : "";


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
        "https://moshushou-ios.github.io/card-admin/reset.html";


    try {

        const { error } =
            await supabase.auth.resetPasswordForEmail(

                email,

                {
                    redirectTo:
                        redirectUrl
                }

            );


        if (error) {

            console.error(
                "发送密码重置邮件失败：",
                error
            );


            showMessage(
                "发送失败：" +
                error.message
            );

            return;
        }


        showMessage(
            "重置邮件已发送，请检查邮箱"
        );

    } catch (error) {

        console.error(
            "发送重置邮件异常：",
            error
        );


        showMessage(
            "发送失败：" +
            (
                error.message ||
                "请检查网络连接"
            )
        );
    }
}


// ==================================================
// 密码恢复
// ==================================================

if (
    typeof window !== "undefined"
) {

    window.addEventListener(
        "load",
        () => {

            if (!supabase) {

                return;
            }


            supabase.auth.onAuthStateChange(

                async (
                    event,
                    session
                ) => {

                    console.log(
                        "Supabase Auth Event:",
                        event
                    );


                    if (
                        event ===
                        "PASSWORD_RECOVERY"
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
        }
    );
}


// ==================================================
// 修改密码
// ==================================================

async function resetPassword() {

    if (!supabase) {

        showMessage(
            "系统尚未初始化"
        );

        return;
    }


    const newPasswordElement =
        document.getElementById(
            "newPassword"
        );


    const confirmPasswordElement =
        document.getElementById(
            "confirmPassword"
        );


    const newPassword =
        newPasswordElement
            ? newPasswordElement.value
            : "";


    const confirmPassword =
        confirmPasswordElement
            ? confirmPasswordElement.value
            : "";


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


    try {

        const { error } =
            await supabase.auth.updateUser({

                password:
                    newPassword

            });


        if (error) {

            console.error(
                "修改密码失败：",
                error
            );


            showMessage(
                "修改密码失败：" +
                error.message
            );

            return;
        }


        showMessage(
            "密码修改成功，请重新登录"
        );


        if (newPasswordElement) {

            newPasswordElement.value =
                "";
        }


        if (confirmPasswordElement) {

            confirmPasswordElement.value =
                "";
        }


        await supabase.auth.signOut();


        showLoginPage();

    } catch (error) {

        console.error(
            "修改密码异常：",
            error
        );


        showMessage(
            "修改密码失败：" +
            (
                error.message ||
                "请稍后再试"
            )
        );
    }
}


// ==================================================
// 加载后台
// ==================================================

async function loadDashboard() {

    if (!supabase) {

        return;
    }


    if (dashboardLoading) {

        return;
    }


    dashboardLoading =
        true;


    try {

        const { data, error } =
            await supabase

                .from("cards")

                .select(
                    "card, duration_days, status, created_at, activated_at, expires_at, device_id"
                )

                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                "读取卡密失败：",
                error
            );


            showMessage(
                "读取卡密失败：" +
                error.message
            );


            return;
        }


        const cards =
            data || [];


        updateStatistics(
            cards
        );


        renderCards(
            cards
        );


        renderStock(
            cards
        );


        await loadHeartbeats(
            cards
        );

    } catch (error) {

        console.error(
            "加载后台异常：",
            error
        );


        showMessage(
            "后台加载失败：" +
            (
                error.message ||
                "请检查网络连接"
            )
        );

    } finally {

        dashboardLoading =
            false;
    }
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
                card.status ===
                "unused"
        ).length;


    const active =
        cards.filter(
            card =>
                card.status ===
                "active"
        ).length;


    const expired =
        cards.filter(
            card =>
                card.status ===
                "expired"
        ).length;


    const totalElement =
        document.getElementById(
            "totalCount"
        );


    const unusedElement =
        document.getElementById(
            "unusedCount"
        );


    const activeElement =
        document.getElementById(
            "activeCount"
        );


    const expiredElement =
        document.getElementById(
            "expiredCount"
        );


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (unusedElement) {

        unusedElement.textContent =
            unused;
    }


    if (activeElement) {

        activeElement.textContent =
            active;
    }


    if (expiredElement) {

        expiredElement.textContent =
            expired;
    }
}


// ==================================================
// 最近卡密
// ==================================================

function renderCards(cards) {

    const tbody =
        document.getElementById(
            "cardTableBody"
        );


    if (!tbody) {

        return;
    }


    tbody.innerHTML =
        "";


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
        .forEach(
            card => {

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


                tbody.appendChild(
                    row
                );
            }
        );
}


// ==================================================
// 库存
// ==================================================

function renderStock(cards) {

    const types = {

        day:
            1,

        week:
            7,

        month:
            30

    };


    for (
        const [name, days]
        of Object.entries(types)
    ) {

        const unused =
            cards.filter(
                card =>
                    Number(
                        card.duration_days
                    ) === days &&
                    card.status ===
                    "unused"
            ).length;


        const active =
            cards.filter(
                card =>
                    Number(
                        card.duration_days
                    ) === days &&
                    card.status ===
                    "active"
            ).length;


        const expired =
            cards.filter(
                card =>
                    Number(
                        card.duration_days
                    ) === days &&
                    card.status ===
                    "expired"
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


        if (unusedElement) {

            unusedElement.textContent =
                unused;
        }


        if (activeElement) {

            activeElement.textContent =
                active;
        }


        if (expiredElement) {

            expiredElement.textContent =
                expired;
        }
    }
}


// ==================================================
// 读取心跳
// ==================================================

async function loadHeartbeats(cards) {

    if (!supabase) {

        return;
    }


    const tbody =
        document.getElementById(
            "onlineTableBody"
        );


    if (!tbody) {

        return;
    }


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
                    ${escapeHTML(
                        error.message
                    )}
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


    cards.forEach(
        card => {

            cardMap.set(
                card.card,
                card
            );

        }
    );


    const rows = [];


    heartbeats.forEach(
        heartbeat => {

            const card =
                cardMap.get(
                    heartbeat.card
                );


            if (!card) {

                return;
            }


            const heartbeatTime =
                new Date(
                    heartbeat.last_heartbeat
                ).getTime();


            if (
                Number.isNaN(
                    heartbeatTime
                )
            ) {

                return;
            }


            const elapsed =
                now -
                heartbeatTime;


            const online =
                elapsed <=
                HEARTBEAT_TIMEOUT;


            rows.push({

                heartbeat:
                    heartbeat,

                card:
                    card,

                online:
                    online,

                elapsed:
                    elapsed

            });

        }
    );


    rows.sort(
        (
            a,
            b
        ) => {

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
                    b.heartbeat
                        .last_heartbeat
                ).getTime()
                -
                new Date(
                    a.heartbeat
                        .last_heartbeat
                ).getTime()
            );
        }
    );


    renderHeartbeatRows(
        rows
    );
}


// ==================================================
// 显示心跳
// ==================================================

function renderHeartbeatRows(rows) {

    const tbody =
        document.getElementById(
            "onlineTableBody"
        );


    if (!tbody) {

        return;
    }


    tbody.innerHTML =
        "";


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


    rows.forEach(
        item => {

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


            tbody.appendChild(
                row
            );

        }
    );
}


// ==================================================
// 自动刷新心跳
// ==================================================

function startHeartbeatRefresh() {

    stopHeartbeatRefresh();


    heartbeatTimer =
        setInterval(
            async () => {

                if (
                    heartbeatLoading
                ) {

                    return;
                }


                heartbeatLoading =
                    true;


                try {

                    if (!supabase) {

                        return;
                    }


                    const {
                        data,
                        error
                    } =
                        await supabase
                            .auth
                            .getSession();


                    if (error) {

                        console.error(
                            "检查登录状态失败：",
                            error
                        );

                        return;
                    }


                    if (
                        !data.session
                    ) {

                        stopHeartbeatRefresh();

                        showLoginPage();

                        return;
                    }


                    await loadHeartbeatOnly();

                } catch (error) {

                    console.error(
                        "心跳刷新异常：",
                        error
                    );

                } finally {

                    heartbeatLoading =
                        false;
                }

            },

            HEARTBEAT_REFRESH_INTERVAL
        );
}


// ==================================================
// 只刷新心跳
// ==================================================

async function loadHeartbeatOnly() {

    if (!supabase) {

        return;
    }


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
        heartbeatTimer !== null
    ) {

        clearInterval(
            heartbeatTimer
        );


        heartbeatTimer =
            null;
    }
}


// ==================================================
// 指定卡密查询
// ==================================================

async function searchCard() {

    if (!supabase) {

        showMessage(
            "系统尚未初始化"
        );

        return;
    }


    const input =
        document.getElementById(
            "searchInput"
        );


    const result =
        document.getElementById(
            "searchResult"
        );


    if (!input || !result) {

        return;
    }


    const card =
        input.value.trim();


    if (!card) {

        result.innerHTML =
            "请输入卡密";

        return;
    }


    result.innerHTML =
        "正在查询...";


    try {

        const {
            data,
            error
        } =
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

            console.error(
                "查询卡密失败：",
                error
            );


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
                    ${escapeHTML(
                        data.card
                    )}
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

    } catch (error) {

        console.error(
            "查询卡密异常：",
            error
        );


        result.innerHTML =
            "查询失败：" +
            (
                error.message ||
                "请稍后再试"
            );
    }
}


// ==================================================
// 状态查询
// ==================================================

async function showCardsByStatus(
    status,
    title
) {

    if (!supabase) {

        showMessage(
            "系统尚未初始化"
        );

        return;
    }


    try {

        const {
            data,
            error
        } =
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
                        ascending:
                            false
                    }
                );


        if (error) {

            console.error(
                "状态查询失败：",
                error
            );


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


        if (!tbody) {

            return;
        }


        tbody.innerHTML =
            "";


        if (
            cards.length === 0
        ) {

            tbody.innerHTML = `

                <tr>

                    <td colspan="6">
                        ${escapeHTML(
                            title
                        )}：暂无数据
                    </td>

                </tr>

            `;

            return;
        }


        cards.forEach(
            card => {

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


                tbody.appendChild(
                    row
                );

            }
        );


        showMessage(
            `${title}：${cards.length} 张`
        );

    } catch (error) {

        console.error(
            "状态查询异常：",
            error
        );


        showMessage(
            "查询失败：" +
            (
                error.message ||
                "请稍后再试"
            )
        );
    }
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

    const number =
        Number(days);


    if (number === 1) {

        return "天卡";
    }


    if (number === 7) {

        return "周卡";
    }


    if (number === 30) {

        return "月卡";
    }


    return number + "天";
}


// ==================================================
// 状态
// ==================================================

function getStatusHTML(status) {

    if (
        status ===
        "unused"
    ) {

        return `
            <span class="status status-unused">
                未激活
            </span>
        `;
    }


    if (
        status ===
        "active"
    ) {

        return `
            <span class="status status-active">
                正常使用
            </span>
        `;
    }


    if (
        status ===
        "expired"
    ) {

        return `
            <span class="status status-expired">
                已过期
            </span>
        `;
    }


    return `
        <span class="status">
            ${escapeHTML(
                status ||
                "未知"
            )}
        </span>
    `;
}


// ==================================================
// 时间
// ==================================================

function formatTime(value) {

    if (!value) {

        return "—";
    }


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
// 随机字符串
// ==================================================

function randomPart(
    length = 4
) {

    const chars =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let result =
        "";


    if (
        window.crypto &&
        window.crypto.getRandomValues
    ) {

        const values =
            new Uint32Array(
                length
            );


        window.crypto.getRandomValues(
            values
        );


        for (
            let i = 0;
            i < length;
            i++
        ) {

            result +=
                chars[
                    values[i] %
                    chars.length
                ];
        }


        return result;
    }


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


// ==================================================
// 生成卡密
// ==================================================

function generateCardCode(type) {

    const prefix =
        String(type)
            .toUpperCase();


    return (
        prefix +
        "-" +
        randomPart(4) +
        "-" +
        randomPart(4) +
        "-" +
        randomPart(4)
    );
}


// ==================================================
// 生成卡密
// ==================================================

async function generateCards() {

    if (!supabase) {

        showMessage(
            "系统尚未初始化"
        );

        return;
    }


    const typeElement =
        document.getElementById(
            "generateType"
        );


    const countElement =
        document.getElementById(
            "generateCount"
        );


    if (
        !typeElement ||
        !countElement
    ) {

        showMessage(
            "找不到生成卡密控件"
        );

        return;
    }


    const type =
        typeElement.value;


    const count =
        Number(
            countElement.value
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

        day:
            1,

        week:
            7,

        month:
            30

    };


    const durationDays =
        durationMap[type];


    if (!durationDays) {

        showMessage(
            "无效的卡密类型"
        );

        return;
    }


    const cards = [];


    const generatedCodes =
        new Set();


    // ==================================================
    // 本批次防重复
    // ==================================================

    while (
        cards.length <
        count
    ) {

        const code =
            generateCardCode(
                type
            );


        if (
            generatedCodes.has(
                code
            )
        ) {

            continue;
        }


        generatedCodes.add(
            code
        );


        cards.push({

            card:
                code,

            duration_days:
                durationDays,

            status:
                "unused"

        });
    }


    showMessage(
        "正在保存卡密..."
    );


    try {

        const {
            data,
            error
        } =
            await supabase

                .from("cards")

                .insert(
                    cards
                )

                .select(
                    "card"
                );


        if (error) {

            console.error(
                "生成卡密失败：",
                error
            );


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


        const generatedElement =
            document.getElementById(
                "generatedCards"
            );


        const resultElement =
            document.getElementById(
                "generateResult"
            );


        if (generatedElement) {

            generatedElement.textContent =
                generated;
        }


        if (resultElement) {

            resultElement.style.display =
                "block";
        }


        showMessage(
            `成功生成 ${(data || []).length} 张卡密`
        );


        await loadDashboard();

    } catch (error) {

        console.error(
            "生成卡密异常：",
            error
        );


        showMessage(
            "生成失败：" +
            (
                error.message ||
                "请检查网络连接"
            )
        );
    }
}


// ==================================================
// 复制卡密
// ==================================================

async function copyGeneratedCards() {

    const element =
        document.getElementById(
            "generatedCards"
        );


    const text =
        element
            ? element.textContent
            : "";


    if (!text) {

        showMessage(
            "没有可复制的卡密"
        );

        return;
    }


    try {

        if (
            navigator.clipboard &&
            navigator.clipboard.writeText
        ) {

            await navigator.clipboard.writeText(
                text
            );

        } else {

            const textarea =
                document.createElement(
                    "textarea"
                );


            textarea.value =
                text;


            textarea.style.position =
                "fixed";


            textarea.style.opacity =
                "0";


            document.body.appendChild(
                textarea
            );


            textarea.select();


            document.execCommand(
                "copy"
            );


            document.body.removeChild(
                textarea
            );
        }


        showMessage(
            "已复制全部卡密"
        );

    } catch (error) {

        console.error(
            "复制失败：",
            error
        );


        showMessage(
            "复制失败，请手动复制"
        );
    }
}


// ==================================================
// 清空生成结果
// ==================================================

function clearGeneratedCards() {

    const generatedElement =
        document.getElementById(
            "generatedCards"
        );


    const resultElement =
        document.getElementById(
            "generateResult"
        );


    if (generatedElement) {

        generatedElement.textContent =
            "";
    }


    if (resultElement) {

        resultElement.style.display =
            "none";
    }
}


// ==================================================
// 消息
// ==================================================

function showMessage(message) {

    const element =
        document.getElementById(
            "message"
        );


    if (element) {

        element.textContent =
            message;

    } else {

        console.log(
            message
        );
    }
}


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

    console.log(
        "开始检查登录状态..."
    );


    if (!supabase) {

        showLoginPage();

        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .auth
                .getSession();


        if (error) {

            console.error(
                "检查登录状态失败：",
                error
            );


            showLoginPage();

            return;
        }


        if (
            data &&
            data.session
        ) {

            console.log(
                "检测到已有登录状态"
            );


            showAdminPage();


            await loadDashboard();


            startHeartbeatRefresh();

        } else {

            console.log(
                "当前没有登录"
            );


            showLoginPage();
        }

    } catch (error) {

        console.error(
            "启动检查异常：",
            error
        );


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
    async () => {

        console.log(
            "DOMContentLoaded"
        );


        const success =
            initSupabase();


        if (!success) {

            return;
        }


        // 给登录按钮增加兼容绑定
        const loginButton =
            document.getElementById(
                "loginButton"
            );


        if (loginButton) {

            loginButton.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    login();

                }
            );
        }


        await checkLogin();

    }
);
