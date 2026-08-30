console.log("=== app.js 开始加载 ===");

function showMessage(message) {
    const element = document.getElementById("message");

    if (element) {
        element.textContent = message;
    }

    console.log(message);
}


// ==================================================
// 诊断 Supabase SDK
// ==================================================

if (!window.supabase) {

    showMessage(
        "❌ Supabase SDK 加载失败，请检查网络/CDN"
    );

    throw new Error(
        "Supabase SDK 未加载：window.supabase 不存在"
    );
}

showMessage("✅ Supabase SDK 已加载");


// ==================================================
// Supabase
// ==================================================

const SUPABASE_URL =
    "https://dmdnnbjbjhjedzodmlft.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_YOcRrmDG4qJMMF90qW4p2Q_0HH_CA-D";


let supabaseClient;

try {

    supabaseClient =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY
        );

    console.log(
        "=== Supabase Client 创建成功 ==="
    );

} catch (error) {

    showMessage(
        "❌ Supabase 初始化失败：" +
        error.message
    );

    throw error;
}


// ==================================================
// 登录
// ==================================================

async function login() {

    showMessage("正在执行登录...");

    console.log("=== login() 已执行 ===");


    const emailElement =
        document.getElementById("email");

    const passwordElement =
        document.getElementById("password");


    if (!emailElement || !passwordElement) {

        showMessage(
            "❌ 找不到邮箱或密码输入框"
        );

        return;
    }


    const email =
        emailElement.value.trim();

    const password =
        passwordElement.value;


    console.log(
        "邮箱：",
        email
    );


    if (!email || !password) {

        showMessage(
            "请输入邮箱和密码"
        );

        return;
    }


    showMessage(
        "正在连接 Supabase..."
    );


    try {

        const result =
            await supabaseClient.auth.signInWithPassword({

                email: email,

                password: password

            });


        console.log(
            "登录结果：",
            result
        );


        if (result.error) {

            showMessage(
                "❌ 登录失败：" +
                result.error.message
            );

            return;
        }


        showMessage(
            "✅ 登录成功"
        );


        const loginPage =
            document.getElementById("loginPage");

        const adminPage =
            document.getElementById("adminPage");


        if (loginPage) {

            loginPage.style.display =
                "none";
        }


        if (adminPage) {

            adminPage.style.display =
                "block";
        }

    } catch (error) {

        console.error(
            "登录异常：",
            error
        );

        showMessage(
            "❌ 登录异常：" +
            error.message
        );
    }
}


// ==================================================
// 测试 Supabase 连接
// ==================================================

async function testSupabase() {

    showMessage(
        "正在测试 Supabase..."
    );


    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {

            showMessage(
                "❌ Supabase 测试失败：" +
                error.message
            );

            return;
        }


        showMessage(
            "✅ Supabase 连接正常"
        );


        console.log(
            "Session：",
            data
        );

    } catch (error) {

        showMessage(
            "❌ 网络连接异常：" +
            error.message
        );
    }
}


// ==================================================
// 暴露给 HTML
// ==================================================

window.login =
    login;

window.testSupabase =
    testSupabase;


console.log(
    "=== app.js 加载完成 ==="
);

showMessage(
    "系统初始化完成"
);
