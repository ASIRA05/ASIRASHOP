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
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    showLoginPage();
    return;
  }

  const {
    data: admin
  } = await supabase
    .from("admins")
    .select("user_id,email")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {

    await supabase.auth.signOut();

    showLoginPage();

    return;
  }

  showAdminPage(user);
}


/* =========================
   LOGIN
========================= */

function showLoginPage() {

  document
    .getElementById("loginPage")
    ?.classList.remove("hidden");

  document
    .getElementById("adminPage")
    ?.classList.add("hidden");

  const button =
    document.getElementById("loginButton");

  if (button) {
    button.onclick = loginAdmin;
  }
}


async function loginAdmin() {

  const supabase =
    window.supabaseClient;

  const email =
    document
      .getElementById("adminEmail")
      .value
      .trim();

  const password =
    document
      .getElementById("adminPassword")
      .value;

  const message =
    document.getElementById("loginMessage");

  if (!email || !password) {

    message.textContent =
      "กรุณากรอกอีเมลและรหัสผ่าน";

    return;
  }

  message.textContent =
    "กำลังเข้าสู่ระบบ...";

  const { error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {

    message.textContent =
      "เข้าสู่ระบบไม่สำเร็จ: " +
      error.message;

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
   ADMIN
========================= */

function showAdminPage(user) {

  document
    .getElementById("loginPage")
    ?.classList.add("hidden");

  document
    .getElementById("adminPage")
    ?.classList.remove("hidden");

  const status =
    document.getElementById("adminStatus");

  if (status) {

    status.textContent =
      "เข้าสู่ระบบแล้ว: " +
      user.email;
  }

  document
    .getElementById("logoutButton")
    ?.addEventListener(
      "click",
      logoutAdmin
    );

  document
    .getElementById("addGameButton")
    ?.addEventListener(
      "click",
      openNewGame
    );

  document
    .getElementById("saveGameButton")
    ?.addEventListener(
      "click",
      saveGame
    );

  document
    .getElementById("cancelGameButton")
    ?.addEventListener(
      "click",
      closeGameModal
    );

  document
    .getElementById("closeGameModal")
    ?.addEventListener(
      "click",
      closeGameModal
    );

  document
    .getElementById("addProductButton")
    ?.addEventListener(
      "click",
      openNewProduct
    );

  document
    .getElementById("saveProductButton")
    ?.addEventListener(
      "click",
      saveProduct
    );

  document
    .getElementById("cancelProductButton")
    ?.addEventListener(
      "click",
      closeProductModal
    );

  document
    .getElementById("closeProductModal")
    ?.addEventListener(
      "click",
      closeProductModal
    );

  document
    .getElementById("productImage")
    ?.addEventListener(
      "change",
      previewProductImage
    );

  loadGames();
  loadProductGames();
  loadProducts();
}


/* =========================
   LOGOUT
========================= */

async function logoutAdmin() {

  await window.supabaseClient.auth.signOut();

  location.reload();
}


/* =========================
   GAMES
========================= */

async function loadGames() {

  const supabase =
    window.supabaseClient;

  const container =
    document.getElementById("gamesList");

  if (!container) return;

  container.innerHTML =
    "<p>กำลังโหลดเกม...</p>";

  const {
    data,
    error
  } = await supabase
    .from("games")
    .select("*")
    .order("sort_order", {
      ascending: true
    });

  if (error) {

    container.innerHTML =
      `<p style="color:#ff7777">
        ${escapeHtml(error.message)}
      </p>`;

    return;
  }

  if (!data?.length) {

    container.innerHTML =
      "<p>ยังไม่มีเกม</p>";

    return;
  }

  container.innerHTML =
    data.map(renderGame).join("");

  document
    .querySelectorAll(".edit-game")
    .forEach(button => {

      button.onclick = () =>
        editGame(button.dataset.id);

    });

  document
    .querySelectorAll(".delete-game")
    .forEach(button => {

      button.onclick = () =>
        deleteGame(button.dataset.id);

    });
}


function renderGame(game) {

  const icon =
    game.icon_url ||
    "https://placehold.co/100x100";

  return `
    <div class="game-card">

      <div class="game-head">

        <img
          class="game-icon"
          src="${escapeAttribute(icon)}"
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

      <span class="status ${
        game.is_active
          ? "status-on"
          : "status-off"
      }">

        ${
          game.is_active
            ? "เปิดแสดง"
            : "ซ่อน"
        }

      </span>

      <div class="game-description">

        ${
          escapeHtml(
            game.description ||
            "ยังไม่มีคำอธิบาย"
          )
        }

      </div>

      <div class="game-actions">

        <button
          class="btn btn-dark edit-game"
          data-id="${game.id}"
        >
          แก้ไข
        </button>

        <button
          class="btn btn-danger delete-game"
          data-id="${game.id}"
        >
          ลบ
        </button>

      </div>

    </div>
  `;
}


function openNewGame() {

  document.getElementById(
    "gameModalTitle"
  ).textContent = "เพิ่มเกม";

  document.getElementById(
    "gameId"
  ).value = "";

  document.getElementById(
    "gameName"
  ).value = "";

  document.getElementById(
    "gameSlug"
  ).value = "";

  document.getElementById(
    "gameDescription"
  ).value = "";

  document.getElementById(
    "gameIconUrl"
  ).value = "";

  document.getElementById(
    "gameBannerUrl"
  ).value = "";

  document.getElementById(
    "gameSortOrder"
  ).value = 0;

  document.getElementById(
    "gameActive"
  ).value = "true";

  document
    .getElementById("gameModal")
    .classList.remove("hidden");
}


function closeGameModal() {

  document
    .getElementById("gameModal")
    .classList.add("hidden");
}


async function editGame(id) {

  const {
    data,
    error
  } = await window.supabaseClient
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {

    alert("ไม่พบข้อมูลเกม");

    return;
  }

  document.getElementById(
    "gameModalTitle"
  ).textContent = "แก้ไขเกม";

  document.getElementById(
    "gameId"
  ).value = data.id;

  document.getElementById(
    "gameName"
  ).value = data.name || "";

  document.getElementById(
    "gameSlug"
  ).value = data.slug || "";

  document.getElementById(
    "gameDescription"
  ).value =
    data.description || "";

  document.getElementById(
    "gameIconUrl"
  ).value =
    data.icon_url || "";

  document.getElementById(
    "gameBannerUrl"
  ).value =
    data.banner_url || "";

  document.getElementById(
    "gameSortOrder"
  ).value =
    data.sort_order || 0;

  document.getElementById(
    "gameActive"
  ).value =
    data.is_active
      ? "true"
      : "false";

  document
    .getElementById("gameModal")
    .classList.remove("hidden");
}


async function saveGame() {

  const id =
    document.getElementById("gameId")
      .value
      .trim();

  const game = {

    name:
      document.getElementById("gameName")
        .value
        .trim(),

    slug:
      document.getElementById("gameSlug")
        .value
        .trim(),

    description:
      document.getElementById("gameDescription")
        .value
        .trim(),

    icon_url:
      document.getElementById("gameIconUrl")
        .value
        .trim(),

    banner_url:
      document.getElementById("gameBannerUrl")
        .value
        .trim(),

    sort_order:
      Number(
        document.getElementById(
          "gameSortOrder"
        ).value
      ) || 0,

    is_active:
      document.getElementById(
        "gameActive"
      ).value === "true"

  };


  if (!game.name || !game.slug) {

    alert(
      "กรุณากรอกชื่อเกมและ Slug"
    );

    return;
  }


  let result;


  if (id) {

    result =
      await window.supabaseClient
        .from("games")
        .update(game)
        .eq("id", id);

  } else {

    result =
      await window.supabaseClient
        .from("games")
        .insert(game);

  }


  if (result.error) {

    alert(
      "บันทึกไม่สำเร็จ:\n" +
      result.error.message
    );

    return;
  }


  alert("บันทึกเกมเรียบร้อยแล้ว");

  closeGameModal();

  loadGames();
}


async function deleteGame(id) {

  if (
    !confirm(
      "ต้องการลบเกมนี้ใช่หรือไม่?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await window.supabaseClient
      .from("games")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "ลบไม่สำเร็จ:\n" +
      error.message
    );

    return;
  }


  alert("ลบเกมเรียบร้อยแล้ว");

  loadGames();
}


/* =========================
   PRODUCT GAMES
========================= */

async function loadProductGames() {

  const select =
    document.getElementById(
      "productGame"
    );

  if (!select) return;


  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("games")
      .select("id,name")
      .order("sort_order");


  if (error) {

    select.innerHTML =
      "<option>โหลดเกมไม่สำเร็จ</option>";

    return;
  }


  select.innerHTML =
    `<option value="">
      เลือกเกม
    </option>` +
    (data || [])
      .map(game => `
        <option value="${game.id}">
          ${escapeHtml(game.name)}
        </option>
      `)
      .join("");
}


/* =========================
   PRODUCTS
========================= */

async function loadProducts() {

  const container =
    document.getElementById(
      "productsList"
    );

  if (!container) return;


  container.innerHTML =
    "<p>กำลังโหลดสินค้า...</p>";


  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("products")
      .select(`
        *,
        games (
          name
        )
      `)
      .order("sort_order");


  if (error) {

    container.innerHTML =
      `<p style="color:#ff7777">
        ${escapeHtml(error.message)}
      </p>`;

    return;
  }


  if (!data?.length) {

    container.innerHTML =
      "<p style='color:#888'>ยังไม่มีสินค้า</p>";

    return;
  }


  container.innerHTML =
    data.map(renderProduct).join("");


  document
    .querySelectorAll(".edit-product")
    .forEach(button => {

      button.onclick = () =>
        editProduct(button.dataset.id);

    });


  document
    .querySelectorAll(".delete-product")
    .forEach(button => {

      button.onclick = () =>
        deleteProduct(button.dataset.id);

    });
}


function renderProduct(product) {

  const image =
    product.image_url ||
    "https://placehold.co/120x120";


  let statusText = "พร้อมขาย";

  if (product.stock <= 0) {
    statusText = "สินค้าหมด";
  }

  if (product.status === "hidden") {
    statusText = "ซ่อน";
  }


  return `
    <div class="game-card">

      <div class="game-head">

        <img
          class="game-icon"
          src="${escapeAttribute(image)}"
        >

        <div>

          <div class="game-name">
            ${escapeHtml(product.name)}
          </div>

          <div class="game-slug">
            ${
              escapeHtml(
                product.games?.name ||
                "ไม่ระบุเกม"
              )
            }
          </div>

        </div>

      </div>

      <div style="margin-top:12px">

        ราคา:
        <strong>
          ${Number(product.price).toLocaleString()}
          บาท
        </strong>

      </div>

      <div style="margin-top:7px">

        สต็อก:
        <strong>
          ${product.stock}
        </strong>

      </div>

      <div class="status ${
        product.stock > 0 &&
        product.status === "available"
          ? "status-on"
          : "status-off"
      }">

        ${statusText}

      </div>

      <div class="game-actions">

        <button
          class="btn btn-dark edit-product"
          data-id="${product.id}"
        >
          แก้ไข
        </button>

        <button
          class="btn btn-danger delete-product"
          data-id="${product.id}"
        >
          ลบ
        </button>

      </div>

    </div>
  `;
}


/* =========================
   NEW PRODUCT
========================= */

function openNewProduct() {

  document.getElementById(
    "productModalTitle"
  ).textContent = "เพิ่มสินค้า";

  document.getElementById(
    "productId"
  ).value = "";

  document.getElementById(
    "productGame"
  ).value = "";

  document.getElementById(
    "productName"
  ).value = "";

  document.getElementById(
    "productPrice"
  ).value = "";

  document.getElementById(
    "productStock"
  ).value = 1;

  document.getElementById(
    "productDescription"
  ).value = "";

  document.getElementById(
    "productImage"
  ).value = "";

  document.getElementById(
    "productSortOrder"
  ).value = 0;

  document.getElementById(
    "productStatus"
  ).value = "available";

  document
    .getElementById(
      "productImagePreview"
    )
    .style.display = "none";

  document
    .getElementById("productModal")
    .classList.remove("hidden");
}


function closeProductModal() {

  document
    .getElementById("productModal")
    .classList.add("hidden");
}


/* =========================
   PREVIEW PRODUCT IMAGE
========================= */

function previewProductImage(event) {

  const file =
    event.target.files?.[0];

  const preview =
    document.getElementById(
      "productImagePreview"
    );

  if (!file) {

    preview.style.display =
      "none";

    return;
  }


  const url =
    URL.createObjectURL(file);

  preview.src = url;

  preview.style.display =
    "block";
}


/* =========================
   UPLOAD IMAGE
========================= */

async function uploadProductImage(file) {

  if (!file) {
    return null;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filename =
    `${crypto.randomUUID()}.${extension}`;


  const path =
    `products/${filename}`;


  const {
    error
  } =
    await window.supabaseClient
      .storage
      .from("store-assets")
      .upload(
        path,
        file,
        {
          upsert: false,
          contentType: file.type
        }
      );


  if (error) {

    throw new Error(
      "อัปโหลดรูปไม่สำเร็จ: " +
      error.message
    );
  }


  const {
    data
  } =
    window.supabaseClient
      .storage
      .from("store-assets")
      .getPublicUrl(path);


  return data.publicUrl;
}


/* =========================
   SAVE PRODUCT
========================= */

async function saveProduct() {

  const id =
    document.getElementById(
      "productId"
    ).value.trim();


  const game_id =
    document.getElementById(
      "productGame"
    ).value;


  const name =
    document.getElementById(
      "productName"
    ).value.trim();


  const price =
    Number(
      document.getElementById(
        "productPrice"
      ).value
    );


  const stock =
    Number(
      document.getElementById(
        "productStock"
      ).value
    );


  const description =
    document.getElementById(
      "productDescription"
    ).value.trim();


  const status =
    document.getElementById(
      "productStatus"
    ).value;


  const sort_order =
    Number(
      document.getElementById(
        "productSortOrder"
      ).value
    ) || 0;


  const file =
    document.getElementById(
      "productImage"
    ).files?.[0];


  if (!game_id) {

    alert("กรุณาเลือกเกม");

    return;
  }


  if (!name) {

    alert("กรุณาใส่ชื่อสินค้า");

    return;
  }


  if (Number.isNaN(price) || price < 0) {

    alert("กรุณาใส่ราคาให้ถูกต้อง");

    return;
  }


  if (Number.isNaN(stock) || stock < 0) {

    alert(
      "กรุณาใส่จำนวนสต็อกให้ถูกต้อง"
    );

    return;
  }


  const saveButton =
    document.getElementById(
      "saveProductButton"
    );


  saveButton.disabled = true;

  saveButton.textContent =
    "กำลังบันทึก...";


  try {

    let image_url = null;


    if (file) {

      image_url =
        await uploadProductImage(file);

    }


    const product = {

      game_id,

      name,

      price,

      stock,

      description,

      status:
        stock <= 0
          ? "sold_out"
          : status,

      sort_order

    };


    if (image_url) {

      product.image_url =
        image_url;

    }


    let result;


    if (id) {

      result =
        await window.supabaseClient
          .from("products")
          .update(product)
          .eq("id", id);

    } else {

      result =
        await window.supabaseClient
          .from("products")
          .insert(product);

    }


    if (result.error) {
      throw result.error;
    }


    alert(
      id
        ? "แก้ไขสินค้าเรียบร้อยแล้ว"
        : "เพิ่มสินค้าเรียบร้อยแล้ว"
    );


    closeProductModal();

    await loadProducts();

  } catch (error) {

    alert(
      "บันทึกสินค้าไม่สำเร็จ:\n" +
      error.message
    );

  } finally {

    saveButton.disabled = false;

    saveButton.textContent =
      "บันทึกสินค้า";
  }
}


/* =========================
   EDIT PRODUCT
========================= */

async function editProduct(id) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("products")
      .select("*")
      .eq("id", id)
      .single();


  if (error || !data) {

    alert("ไม่พบสินค้านี้");

    return;
  }


  document.getElementById(
    "productModalTitle"
  ).textContent = "แก้ไขสินค้า";


  document.getElementById(
    "productId"
  ).value = data.id;


  document.getElementById(
    "productGame"
  ).value = data.game_id;


  document.getElementById(
    "productName"
  ).value = data.name || "";


  document.getElementById(
    "productPrice"
  ).value = data.price;


  document.getElementById(
    "productStock"
  ).value = data.stock;


  document.getElementById(
    "productDescription"
  ).value =
    data.description || "";


  document.getElementById(
    "productSortOrder"
  ).value =
    data.sort_order || 0;


  document.getElementById(
    "productStatus"
  ).value =
    data.status || "available";


  const preview =
    document.getElementById(
      "productImagePreview"
    );


  if (data.image_url) {

    preview.src =
      data.image_url;

    preview.style.display =
      "block";

  } else {

    preview.style.display =
      "none";

  }


  document
    .getElementById("productModal")
    .classList.remove("hidden");
}


/* =========================
   DELETE PRODUCT
========================= */

async function deleteProduct(id) {

  if (
    !confirm(
      "ต้องการลบสินค้านี้ใช่หรือไม่?"
    )
  ) {
    return;
  }


  const {
    error
  } =
    await window.supabaseClient
      .from("products")
      .delete()
      .eq("id", id);


  if (error) {

    alert(
      "ลบสินค้าไม่สำเร็จ:\n" +
      error.message
    );

    return;
  }


  alert(
    "ลบสินค้าเรียบร้อยแล้ว"
  );


  loadProducts();
}


/* =========================
   ESCAPE
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
