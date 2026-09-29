document.addEventListener("DOMContentLoaded", async () => {
  const supabase = window.supabaseClient;

  if (!supabase) {
    showLoginMessage("ไม่พบการเชื่อมต่อ Supabase");
    return;
  }

  await checkAdmin();
});


/* =========================
   CHECK ADMIN
========================= */

async function checkAdmin() {
  const supabase = window.supabaseClient;

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    showLoginPage();
    return;
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("user_id, email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !admin) {
    await supabase.auth.signOut();
    showLoginPage();
    return;
  }

  showAdminPage(user);
}


/* =========================
   LOGIN PAGE
========================= */

function showLoginPage() {
  const loginPage = document.getElementById("loginPage");
  const adminPage = document.getElementById("adminPage");

  if (loginPage) {
    loginPage.classList.remove("hidden");
  }

  if (adminPage) {
    adminPage.classList.add("hidden");
  }

  const loginButton =
    document.getElementById("loginButton");

  if (loginButton) {
    loginButton.onclick = loginAdmin;
  }
}


async function loginAdmin() {
  const supabase = window.supabaseClient;

  const email =
    document.getElementById("adminEmail")
      ?.value
      .trim();

  const password =
    document.getElementById("adminPassword")
      ?.value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) {
    if (message) {
      message.textContent =
        "กรุณากรอกอีเมลและรหัสผ่าน";
    }

    return;
  }

  if (message) {
    message.textContent =
      "กำลังเข้าสู่ระบบ...";
  }

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    if (message) {
      message.textContent =
        "เข้าสู่ระบบไม่สำเร็จ: " +
        error.message;
    }

    return;
  }

  location.reload();
}


function showLoginMessage(message) {
  const element =
    document.getElementById("loginMessage");

  if (element) {
    element.textContent = message;
  }
}


/* =========================
   ADMIN PAGE
========================= */

function showAdminPage(user) {
  const loginPage =
    document.getElementById("loginPage");

  const adminPage =
    document.getElementById("adminPage");

  if (loginPage) {
    loginPage.classList.add("hidden");
  }

  if (adminPage) {
    adminPage.classList.remove("hidden");
  }

  const status =
    document.getElementById("adminStatus");

  if (status) {
    status.textContent =
      "เข้าสู่ระบบแล้ว: " +
      user.email;
  }

  const logoutButton =
    document.getElementById("logoutButton");

  if (logoutButton) {
    logoutButton.onclick =
      logoutAdmin;
  }

  loadGames();
}


/* =========================
   LOGOUT
========================= */

async function logoutAdmin() {
  const supabase =
    window.supabaseClient;

  await supabase.auth.signOut();

  location.reload();
}


/* =========================
   LOAD GAMES
========================= */

async function loadGames() {
  const supabase =
    window.supabaseClient;

  const container =
    document.getElementById("gamesList");

  if (!container) {
    return;
  }

  container.innerHTML =
    "<p>กำลังโหลดเกม...</p>";

  const {
    data: games,
    error
  } = await supabase
    .from("games")
    .select("*")
    .order("sort_order", {
      ascending: true
    });

  if (error) {
    container.innerHTML = `
      <p style="color:#ff7777;">
        โหลดเกมไม่สำเร็จ<br>
        ${escapeHtml(error.message)}
      </p>
    `;

    return;
  }

  if (!games || games.length === 0) {
    container.innerHTML =
      "<p>ยังไม่มีเกม</p>";

    return;
  }

  container.innerHTML =
    games.map(renderGameCard).join("");

  attachGameButtons();
}


/* =========================
   RENDER GAME
========================= */

function renderGameCard(game) {
  const icon =
    game.icon_url ||
    "https://placehold.co/100x100/222/fff?text=GAME";

  const statusClass =
    game.is_active
      ? "status-on"
      : "status-off";

  const statusText =
    game.is_active
      ? "เปิดแสดง"
      : "ซ่อน";

  return `
    <div class="game-card">

      <div class="game-head">

        <img
          class="game-icon"
          src="${escapeAttribute(icon)}"
          alt="${escapeAttribute(game.name)}"
          onerror="this.src='https://placehold.co/100x100/222/fff?text=GAME'"
        >

        <div>

          <div class="game-name">
            ${escapeHtml(game.name)}
          </div>

          <div class="game-slug">
            ${escapeHtml(game.slug)}
          </div>

        </div>

      </div>

      <span class="status ${statusClass}">
        ${statusText}
      </span>

      <div class="game-description">
        ${
          game.description
            ? escapeHtml(game.description)
            : "ยังไม่มีคำอธิบาย"
        }
      </div>

      <div class="game-actions">

        <button
          class="btn btn-dark edit-game-button"
          data-id="${game.id}"
        >
          แก้ไข
        </button>

        <button
          class="btn btn-danger delete-game-button"
          data-id="${game.id}"
        >
          ลบ
        </button>

      </div>

    </div>
  `;
}


/* =========================
   GAME BUTTONS
========================= */

function attachGameButtons() {

  document
    .querySelectorAll(".edit-game-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          editGame(id);

        }
      );

    });


  document
    .querySelectorAll(".delete-game-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const id =
            button.dataset.id;

          deleteGame(id);

        }
      );

    });
}


/* =========================
   EDIT GAME
========================= */

async function editGame(id) {
  const supabase =
    window.supabaseClient;

  const {
    data: game,
    error
  } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !game) {
    alert("ไม่พบข้อมูลเกม");
    return;
  }

  document.getElementById("gameModalTitle")
    .textContent = "แก้ไขเกม";

  document.getElementById("gameId")
    .value = game.id;

  document.getElementById("gameName")
    .value = game.name || "";

  document.getElementById("gameSlug")
    .value = game.slug || "";

  document.getElementById("gameDescription")
    .value = game.description || "";

  document.getElementById("gameIconUrl")
    .value = game.icon_url || "";

  document.getElementById("gameBannerUrl")
    .value = game.banner_url || "";

  document.getElementById("gameSortOrder")
    .value = game.sort_order ?? 0;

  document.getElementById("gameActive")
    .value =
      game.is_active
        ? "true"
        : "false";

  updateImagePreview(
    "gameIconUrl",
    "gameIconPreview"
  );

  updateImagePreview(
    "gameBannerUrl",
    "gameBannerPreview"
  );

  document
    .getElementById("gameModal")
    .classList.remove("hidden");
}


/* =========================
   SAVE GAME
========================= */

const saveGameButton =
  document.getElementById("saveGameButton");

if (saveGameButton) {

  saveGameButton.addEventListener(
    "click",
    saveGame
  );

}


async function saveGame() {
  const supabase =
    window.supabaseClient;

  const id =
    document.getElementById("gameId")
      .value
      .trim();

  const name =
    document.getElementById("gameName")
      .value
      .trim();

  const slug =
    document.getElementById("gameSlug")
      .value
      .trim();

  const description =
    document.getElementById("gameDescription")
      .value
      .trim();

  const icon_url =
    document.getElementById("gameIconUrl")
      .value
      .trim();

  const banner_url =
    document.getElementById("gameBannerUrl")
      .value
      .trim();

  const sort_order =
    Number(
      document.getElementById("gameSortOrder")
        .value
    ) || 0;

  const is_active =
    document.getElementById("gameActive")
      .value === "true";


  if (!name) {
    alert("กรุณาใส่ชื่อเกม");
    return;
  }

  if (!slug) {
    alert("กรุณาใส่ Slug");
    return;
  }


  const gameData = {
    name,
    slug,
    description,
    icon_url,
    banner_url,
    sort_order,
    is_active
  };


  let result;


  if (id) {

    result =
      await supabase
        .from("games")
        .update(gameData)
        .eq("id", id);

  } else {

    result =
      await supabase
        .from("games")
        .insert(gameData);

  }


  if (result.error) {

    alert(
      "บันทึกไม่สำเร็จ:\n" +
      result.error.message
    );

    return;
  }


  alert(
    id
      ? "แก้ไขเกมเรียบร้อยแล้ว"
      : "เพิ่มเกมเรียบร้อยแล้ว"
  );


  document
    .getElementById("gameModal")
    .classList.add("hidden");


  await loadGames();
}


/* =========================
   DELETE GAME
========================= */

async function deleteGame(id) {

  const confirmed =
    confirm(
      "ต้องการลบเกมนี้ใช่หรือไม่?"
    );

  if (!confirmed) {
    return;
  }


  const supabase =
    window.supabaseClient;


  const { error } =
    await supabase
      .from("games")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "ลบเกมไม่สำเร็จ:\n" +
      error.message
    );

    return;
  }


  alert(
    "ลบเกมเรียบร้อยแล้ว"
  );


  await loadGames();
}


/* =========================
   IMAGE PREVIEW
========================= */

function updateImagePreview(
  inputId,
  previewId
) {

  const input =
    document.getElementById(inputId);

  const preview =
    document.getElementById(previewId);

  if (!input || !preview) {
    return;
  }


  if (!input.value.trim()) {

    preview.style.display =
      "none";

    return;
  }


  preview.src =
    input.value.trim();

  preview.style.display =
    "block";
}


const gameIconUrl =
  document.getElementById(
    "gameIconUrl"
  );

if (gameIconUrl) {

  gameIconUrl.addEventListener(
    "input",
    () => {

      updateImagePreview(
        "gameIconUrl",
        "gameIconPreview"
      );

    }
  );

}


const gameBannerUrl =
  document.getElementById(
    "gameBannerUrl"
  );

if (gameBannerUrl) {

  gameBannerUrl.addEventListener(
    "input",
    () => {

      updateImagePreview(
        "gameBannerUrl",
        "gameBannerPreview"
      );

    }
  );

}


/* =========================
   SHOP SETTINGS
========================= */

const saveShopSettings =
  document.getElementById(
    "saveShopSettings"
  );

if (saveShopSettings) {

  saveShopSettings.addEventListener(
    "click",
    () => {

      const shopName =
        document.getElementById(
          "shopName"
        ).value.trim();

      const shopTagline =
        document.getElementById(
          "shopTagline"
        ).value.trim();


      localStorage.setItem(
        "ASIRASHOP_shopName",
        shopName
      );

      localStorage.setItem(
        "ASIRASHOP_shopTagline",
        shopTagline
      );


      alert(
        "บันทึกการตั้งค่าแล้ว"
      );

    }
  );

}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(value) {

  return escapeHtml(value);

}
