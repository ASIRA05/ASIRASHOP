// ========================================
// ASIRASHOP ADMIN SYSTEM
// ========================================

const supabaseClient = window.supabaseClient;


// ========================================
// ELEMENTS
// ========================================

const loginPage = document.getElementById("loginPage");
const adminPage = document.getElementById("adminPage");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const logoutButton = document.getElementById("logoutButton");

const adminStatus = document.getElementById("adminStatus");

const gamesList = document.getElementById("gamesList");
const productsList = document.getElementById("productsList");

const addGameButton = document.getElementById("addGameButton");
const addProductButton = document.getElementById("addProductButton");

const gameModal = document.getElementById("gameModal");
const productModal = document.getElementById("productModal");

const gameForm = document.getElementById("gameForm");
const productForm = document.getElementById("productForm");


// ========================================
// HELPER
// ========================================

function showLoginMessage(message, type = "error") {

  loginMessage.textContent = message;

  loginMessage.className =
    "message show " + type;
}


function clearLoginMessage() {

  loginMessage.textContent = "";

  loginMessage.className = "message";
}


function setAdminStatus(message) {

  if (adminStatus) {
    adminStatus.textContent = message;
  }
}


function escapeHTML(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function wait(ms) {

  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });

}


// ========================================
// TIMEOUT
// ========================================

async function withTimeout(promise, ms = 15000) {

  let timer;

  const timeoutPromise = new Promise((_, reject) => {

    timer = setTimeout(() => {

      reject(
        new Error(
          "Supabase ไม่ตอบกลับภายใน 15 วินาที"
        )
      );

    }, ms);

  });


  try {

    return await Promise.race([
      promise,
      timeoutPromise
    ]);

  } finally {

    clearTimeout(timer);

  }

}


// ========================================
// CHECK SUPABASE
// ========================================

function checkSupabaseConnection() {

  if (!window.supabaseClient) {

    showLoginMessage(
      "ไม่พบการเชื่อมต่อ Supabase",
      "error"
    );

    loginButton.disabled = true;

    return false;
  }

  return true;
}


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  try {

    const {
      data: {
        user
      },
      error: sessionError
    } = await withTimeout(
      supabaseClient.auth.getUser(),
      15000
    );


    if (sessionError) {

      console.error(
        "GET USER ERROR:",
        sessionError
      );

      showLoginMessage(
        "ตรวจสอบบัญชีไม่สำเร็จ: " +
        sessionError.message
      );

      return false;
    }


    if (!user) {

      showLoginPage();

      return false;
    }


    console.log(
      "Logged in user:",
      user.email
    );


    const {
      data: admin,
      error: adminError
    } = await withTimeout(

      supabaseClient
        .from("admins")
        .select("id,user_id,email")
        .eq("user_id", user.id)
        .maybeSingle(),

      15000
    );


    if (adminError) {

      console.error(
        "ADMIN CHECK ERROR:",
        adminError
      );

      showLoginMessage(
        "ตรวจสอบสิทธิ์แอดมินไม่สำเร็จ: " +
        adminError.message
      );

      await supabaseClient.auth.signOut();

      showLoginPage();

      return false;
    }


    if (!admin) {

      showLoginMessage(
        "บัญชีนี้เข้าสู่ระบบได้ แต่ไม่มีสิทธิ์แอดมิน",
        "error"
      );

      await supabaseClient.auth.signOut();

      showLoginPage();

      return false;
    }


    showAdminPage();

    await loadAll();

    return true;

  } catch (error) {

    console.error(
      "CHECK ADMIN ERROR:",
      error
    );

    showLoginMessage(
      "เกิดข้อผิดพลาด: " +
      error.message
    );

    return false;
  }

}


// ========================================
// LOGIN
// ========================================

async function loginAdmin(event) {

  event.preventDefault();


  if (!checkSupabaseConnection()) {
    return;
  }


  const email =
    loginEmail.value.trim();

  const password =
    loginPassword.value;


  if (!email || !password) {

    showLoginMessage(
      "กรุณากรอกอีเมลและรหัสผ่าน"
    );

    return;
  }


  clearLoginMessage();


  loginButton.disabled = true;

  loginButton.textContent =
    "กำลังเข้าสู่ระบบ...";


  try {

    console.log(
      "กำลัง Login:",
      email
    );


    const result =
      await withTimeout(

        supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        }),

        15000

      );


    const {
      data,
      error
    } = result;


    console.log(
      "LOGIN RESULT:",
      data,
      error
    );


    if (error) {

      console.error(
        "LOGIN ERROR:",
        error
      );


      let message =
        error.message ||
        "เข้าสู่ระบบไม่สำเร็จ";


      if (
        message
          .toLowerCase()
          .includes("invalid login credentials")
      ) {

        message =
          "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
      }


      if (
        message
          .toLowerCase()
          .includes("email not confirmed")
      ) {

        message =
          "อีเมลนี้ยังไม่ได้ยืนยัน";
      }


      showLoginMessage(
        message,
        "error"
      );


      loginButton.disabled = false;

      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;
    }


    if (!data || !data.user) {

      showLoginMessage(
        "Supabase ไม่ส่งข้อมูลผู้ใช้กลับมา"
      );


      loginButton.disabled = false;

      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;
    }


    showLoginMessage(
      "เข้าสู่ระบบสำเร็จ กำลังตรวจสอบสิทธิ์...",
      "success"
    );


    const isAdmin =
      await checkAdmin();


    if (!isAdmin) {

      loginButton.disabled = false;

      loginButton.textContent =
        "เข้าสู่ระบบ";

      return;
    }


  } catch (error) {

    console.error(
      "LOGIN EXCEPTION:",
      error
    );


    showLoginMessage(
      error.message ||
      "ไม่สามารถเข้าสู่ระบบได้"
    );


    loginButton.disabled = false;

    loginButton.textContent =
      "เข้าสู่ระบบ";
  }

}


// ========================================
// LOGOUT
// ========================================

async function logoutAdmin() {

  try {

    await supabaseClient.auth.signOut();

  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

  }


  showLoginPage();
}


// ========================================
// PAGE STATE
// ========================================

function showLoginPage() {

  loginPage.classList.remove("hidden");

  adminPage.classList.add("hidden");
}


function showAdminPage() {

  loginPage.classList.add("hidden");

  adminPage.classList.remove("hidden");

  clearLoginMessage();
}


// ========================================
// LOAD ALL
// ========================================

async function loadAll() {

  setAdminStatus(
    "กำลังโหลดข้อมูล..."
  );


  try {

    await loadGames();

    await loadProducts();

    setAdminStatus(
      "เชื่อมต่อ ASIRASHOP สำเร็จ"
    );

  } catch (error) {

    console.error(
      "LOAD ERROR:",
      error
    );

    setAdminStatus(
      "โหลดข้อมูลไม่สำเร็จ: " +
      error.message
    );
  }

}


// ========================================
// GAMES
// ========================================

async function loadGames() {

  const {
    data,
    error
  } = await withTimeout(

    supabaseClient
      .from("games")
      .select("*")
      .order("sort_order", {
        ascending: true
      }),

    15000
  );


  if (error) {

    throw error;
  }


  renderGames(data || []);

  updateGameSelect(data || []);
}


function renderGames(games) {

  if (!games.length) {

    gamesList.innerHTML =
      `<div class="item">
        ยังไม่มีเกม
      </div>`;

    return;
  }


  gamesList.innerHTML =
    games.map(game => {

      return `
        <div class="item">

          <div class="item-main">

            <div class="item-title">
              ${escapeHTML(game.name)}
            </div>

            <div class="item-meta">
              slug: ${escapeHTML(game.slug)}
              ·
              ${game.is_active
                ? "แสดง"
                : "ซ่อน"}
            </div>

          </div>

          <div class="item-actions">

            <button
              class="small-button edit-button"
              onclick="editGame('${game.id}')"
            >
              แก้ไข
            </button>

            <button
              class="small-button delete-button"
              onclick="deleteGame('${game.id}')"
            >
              ลบ
            </button>

          </div>

        </div>
      `;

    }).join("");
}


// ========================================
// GAME SELECT
// ========================================

function updateGameSelect(games) {

  const select =
    document.getElementById(
      "productGame"
    );


  if (!select) {
    return;
  }


  select.innerHTML =
    `<option value="">
      เลือกเกม
    </option>`;


  games.forEach(game => {

    select.innerHTML +=
      `<option value="${game.id}">
        ${escapeHTML(game.name)}
      </option>`;

  });

}


// ========================================
// ADD GAME
// ========================================

function openGameModal(game = null) {

  gameModal.classList.remove("hidden");


  if (game) {

    document.getElementById(
      "gameModalTitle"
    ).textContent =
      "แก้ไขเกม";


    document.getElementById(
      "gameId"
    ).value =
      game.id || "";


    document.getElementById(
      "gameName"
    ).value =
      game.name || "";


    document.getElementById(
      "gameSlug"
    ).value =
      game.slug || "";


    document.getElementById(
      "gameDescription"
    ).value =
      game.description || "";


    document.getElementById(
      "gameIconUrl"
    ).value =
      game.icon_url || "";


    document.getElementById(
      "gameBannerUrl"
    ).value =
      game.banner_url || "";


    document.getElementById(
      "gameSortOrder"
    ).value =
      game.sort_order || 0;


    document.getElementById(
      "gameActive"
    ).checked =
      game.is_active !== false;

  } else {

    gameForm.reset();

    document.getElementById(
      "gameModalTitle"
    ).textContent =
      "เพิ่มเกม";

    document.getElementById(
      "gameActive"
    ).checked = true;

  }

}


function closeGameModal() {

  gameModal.classList.add("hidden");
}


async function saveGame(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "gameId"
    ).value;


  const payload = {

    name:
      document.getElementById(
        "gameName"
      ).value.trim(),

    slug:
      document.getElementById(
        "gameSlug"
      ).value.trim(),

    description:
      document.getElementById(
        "gameDescription"
      ).value.trim(),

    icon_url:
      document.getElementById(
        "gameIconUrl"
      ).value.trim() || null,

    banner_url:
      document.getElementById(
        "gameBannerUrl"
      ).value.trim() || null,

    sort_order:
      Number(
        document.getElementById(
          "gameSortOrder"
        ).value
      ) || 0,

    is_active:
      document.getElementById(
        "gameActive"
      ).checked

  };


  try {

    let result;


    if (id) {

      result =
        await withTimeout(

          supabaseClient
            .from("games")
            .update(payload)
            .eq("id", id),

          15000
        );

    } else {

      result =
        await withTimeout(

          supabaseClient
            .from("games")
            .insert(payload),

          15000
        );

    }


    if (result.error) {

      throw result.error;
    }


    closeGameModal();

    await loadGames();

    setAdminStatus(
      "บันทึกเกมเรียบร้อย"
    );

  } catch (error) {

    console.error(
      "SAVE GAME ERROR:",
      error
    );

    alert(
      "บันทึกเกมไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// EDIT GAME
// ========================================

async function editGame(id) {

  try {

    const {
      data,
      error
    } = await withTimeout(

      supabaseClient
        .from("games")
        .select("*")
        .eq("id", id)
        .single(),

      15000
    );


    if (error) {
      throw error;
    }


    openGameModal(data);

  } catch (error) {

    alert(
      "โหลดเกมไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// DELETE GAME
// ========================================

async function deleteGame(id) {

  const confirmDelete =
    confirm(
      "ต้องการลบเกมนี้ใช่หรือไม่?\nสินค้าในเกมนี้อาจถูกลบตามด้วย"
    );


  if (!confirmDelete) {
    return;
  }


  try {

    const {
      error
    } = await withTimeout(

      supabaseClient
        .from("games")
        .delete()
        .eq("id", id),

      15000
    );


    if (error) {
      throw error;
    }


    await loadGames();

    await loadProducts();

    setAdminStatus(
      "ลบเกมเรียบร้อย"
    );

  } catch (error) {

    alert(
      "ลบเกมไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// PRODUCTS
// ========================================

async function loadProducts() {

  const {
    data,
    error
  } = await withTimeout(

    supabaseClient
      .from("products")
      .select(`
        *,
        games (
          name
        )
      `)
      .order("sort_order", {
        ascending: true
      }),

    15000
  );


  if (error) {

    throw error;
  }


  renderProducts(data || []);
}


function renderProducts(products) {

  if (!products.length) {

    productsList.innerHTML =
      `<div class="item">
        ยังไม่มีสินค้า
      </div>`;

    return;
  }


  productsList.innerHTML =
    products.map(product => {

      let statusText =
        "พร้อมขาย";


      if (product.status === "sold_out") {
        statusText =
          "สินค้าหมด";
      }


      if (product.status === "hidden") {
        statusText =
          "ซ่อน";
      }


      return `
        <div class="item">

          <div class="item-main">

            <div class="item-title">
              ${escapeHTML(product.name)}
            </div>

            <div class="item-meta">

              เกม:
              ${escapeHTML(
                product.games?.name ||
                "-"
              )}

              · ราคา:
              ${Number(product.price).toLocaleString()}
              บาท

              · สต็อก:
              ${product.stock}

              · ${statusText}

            </div>

          </div>


          <div class="item-actions">

            <button
              class="small-button edit-button"
              onclick="editProduct('${product.id}')"
            >
              แก้ไข
            </button>

            <button
              class="small-button delete-button"
              onclick="deleteProduct('${product.id}')"
            >
              ลบ
            </button>

          </div>

        </div>
      `;

    }).join("");
}


// ========================================
// PRODUCT MODAL
// ========================================

function openProductModal(product = null) {

  productModal.classList.remove(
    "hidden"
  );


  if (product) {

    document.getElementById(
      "productModalTitle"
    ).textContent =
      "แก้ไขสินค้า";


    document.getElementById(
      "productId"
    ).value =
      product.id || "";


    document.getElementById(
      "productGame"
    ).value =
      product.game_id || "";


    document.getElementById(
      "productName"
    ).value =
      product.name || "";


    document.getElementById(
      "productPrice"
    ).value =
      product.price || 0;


    document.getElementById(
      "productStock"
    ).value =
      product.stock || 0;


    document.getElementById(
      "productDescription"
    ).value =
      product.description || "";


    document.getElementById(
      "productSortOrder"
    ).value =
      product.sort_order || 0;


    document.getElementById(
      "productStatus"
    ).value =
      product.status || "available";


  } else {

    productForm.reset();

    document.getElementById(
      "productModalTitle"
    ).textContent =
      "เพิ่มสินค้า";


    document.getElementById(
      "productStock"
    ).value = 1;


    document.getElementById(
      "productStatus"
    ).value =
      "available";

  }

}


function closeProductModal() {

  productModal.classList.add(
    "hidden"
  );

}


// ========================================
// SAVE PRODUCT
// ========================================

async function saveProduct(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "productId"
    ).value;


  const imageFile =
    document.getElementById(
      "productImage"
    ).files[0];


  let imageUrl = null;


  try {

    // ------------------------------------
    // OLD IMAGE
    // ------------------------------------

    if (id) {

      const {
        data: oldProduct,
        error: oldError
      } = await withTimeout(

        supabaseClient
          .from("products")
          .select("image_url")
          .eq("id", id)
          .single(),

        15000
      );


      if (oldError) {
        throw oldError;
      }


      imageUrl =
        oldProduct?.image_url || null;

    }


    // ------------------------------------
    // UPLOAD IMAGE
    // ------------------------------------

    if (imageFile) {

      const fileExtension =
        imageFile.name
          .split(".")
          .pop();


      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExtension}`;


      const filePath =
        `products/${fileName}`;


      const {
        error: uploadError
      } = await withTimeout(

        supabaseClient
          .storage
          .from("store-assets")
          .upload(
            filePath,
            imageFile,
            {
              upsert: false,
              contentType:
                imageFile.type
            }
          ),

        30000
      );


      if (uploadError) {
        throw uploadError;
      }


      const {
        data: publicData
      } =
        supabaseClient
          .storage
          .from("store-assets")
          .getPublicUrl(
            filePath
          );


      imageUrl =
        publicData.publicUrl;
    }


    // ------------------------------------
    // PAYLOAD
    // ------------------------------------

    const payload = {

      game_id:
        document.getElementById(
          "productGame"
        ).value,

      name:
        document.getElementById(
          "productName"
        ).value.trim(),

      image_url:
        imageUrl,

      price:
        Number(
          document.getElementById(
            "productPrice"
          ).value
        ) || 0,

      description:
        document.getElementById(
          "productDescription"
        ).value.trim(),

      stock:
        Number(
          document.getElementById(
            "productStock"
          ).value
        ) || 0,

      status:
        document.getElementById(
          "productStatus"
        ).value,

      sort_order:
        Number(
          document.getElementById(
            "productSortOrder"
          ).value
        ) || 0,

      updated_at:
        new Date().toISOString()

    };


    // ------------------------------------
    // SAVE
    // ------------------------------------

    let result;


    if (id) {

      result =
        await withTimeout(

          supabaseClient
            .from("products")
            .update(payload)
            .eq("id", id),

          15000
        );

    } else {

      result =
        await withTimeout(

          supabaseClient
            .from("products")
            .insert(payload),

          15000
        );

    }


    if (result.error) {

      throw result.error;
    }


    closeProductModal();

    await loadProducts();

    setAdminStatus(
      "บันทึกสินค้าเรียบร้อย"
    );


  } catch (error) {

    console.error(
      "SAVE PRODUCT ERROR:",
      error
    );


    alert(
      "บันทึกสินค้าไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// EDIT PRODUCT
// ========================================

async function editProduct(id) {

  try {

    const {
      data,
      error
    } = await withTimeout(

      supabaseClient
        .from("products")
        .select("*")
        .eq("id", id)
        .single(),

      15000
    );


    if (error) {
      throw error;
    }


    openProductModal(data);

  } catch (error) {

    alert(
      "โหลดสินค้าไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteProduct(id) {

  const confirmDelete =
    confirm(
      "ต้องการลบสินค้านี้ใช่หรือไม่?"
    );


  if (!confirmDelete) {
    return;
  }


  try {

    const {
      error
    } = await withTimeout(

      supabaseClient
        .from("products")
        .delete()
        .eq("id", id),

      15000
    );


    if (error) {
      throw error;
    }


    await loadProducts();


    setAdminStatus(
      "ลบสินค้าเรียบร้อย"
    );

  } catch (error) {

    alert(
      "ลบสินค้าไม่สำเร็จ:\n" +
      error.message
    );

  }

}


// ========================================
// SHOP SETTINGS
// ========================================

document
  .getElementById("saveShopButton")
  ?.addEventListener(
    "click",
    () => {

      localStorage.setItem(
        "ASIRASHOP_NAME",
        document.getElementById(
          "shopName"
        ).value
      );


      localStorage.setItem(
        "ASIRASHOP_TAGLINE",
        document.getElementById(
          "shopTagline"
        ).value
      );


      localStorage.setItem(
        "ASIRASHOP_LINE",
        document.getElementById(
          "shopLine"
        ).value
      );


      localStorage.setItem(
        "ASIRASHOP_INSTAGRAM",
        document.getElementById(
          "shopInstagram"
        ).value
      );


      setAdminStatus(
        "บันทึกตั้งค่าร้านแล้ว"
      );

    }
  );


// ========================================
// EVENTS
// ========================================

loginForm.addEventListener(
  "submit",
  loginAdmin
);


logoutButton.addEventListener(
  "click",
  logoutAdmin
);


addGameButton.addEventListener(
  "click",
  () => openGameModal()
);


addProductButton.addEventListener(
  "click",
  () => openProductModal()
);


document
  .getElementById("closeGameModal")
  .addEventListener(
    "click",
    closeGameModal
  );


document
  .getElementById("cancelGameButton")
  .addEventListener(
    "click",
    closeGameModal
  );


document
  .getElementById("closeProductModal")
  .addEventListener(
    "click",
    closeProductModal
  );


document
  .getElementById("cancelProductButton")
  .addEventListener(
    "click",
    closeProductModal
  );


gameForm.addEventListener(
  "submit",
  saveGame
);


productForm.addEventListener(
  "submit",
  saveProduct
);


// ========================================
// START
// ========================================

(async function startAdmin() {

  console.log(
    "ASIRASHOP ADMIN START"
  );


  if (!checkSupabaseConnection()) {
    return;
  }


  try {

    const {
      data,
      error
    } = await withTimeout(

      supabaseClient.auth.getSession(),

      15000
    );


    if (error) {

      console.error(
        "SESSION ERROR:",
        error
      );

      showLoginPage();

      return;
    }


    if (data.session) {

      console.log(
        "Existing session found"
      );

      await checkAdmin();

    } else {

      console.log(
        "No existing session"
      );

      showLoginPage();

    }

  } catch (error) {

    console.error(
      "START ERROR:",
      error
    );


    showLoginMessage(
      "เชื่อมต่อ Supabase ไม่สำเร็จ: " +
      error.message
    );

  }

})();
