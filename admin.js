document.addEventListener(
  "DOMContentLoaded",
  initAdmin
);


async function initAdmin() {

  const supabase =
    window.supabaseClient;

  if (!supabase) {

    showLoginMessage(
      "ไม่พบการเชื่อมต่อ Supabase"
    );

    return;
  }


  setupButtons();

  await checkAdmin();

}



/* =========================
   BUTTONS
========================= */

function setupButtons() {

  document
    .getElementById("loginButton")
    ?.addEventListener(
      "click",
      loginAdmin
    );


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
    .getElementById("closeGameModal")
    ?.addEventListener(
      "click",
      closeGameModal
    );


  document
    .getElementById("cancelGameButton")
    ?.addEventListener(
      "click",
      closeGameModal
    );


  document
    .getElementById("saveGameButton")
    ?.addEventListener(
      "click",
      saveGame
    );


  document
    .getElementById("addProductButton")
    ?.addEventListener(
      "click",
      openNewProduct
    );


  document
    .getElementById("closeProductModal")
    ?.addEventListener(
      "click",
      closeProductModal
    );


  document
    .getElementById("cancelProductButton")
    ?.addEventListener(
      "click",
      closeProductModal
    );


  document
    .getElementById("saveProductButton")
    ?.addEventListener(
      "click",
      saveProduct
    );


  document
    .getElementById("productImage")
    ?.addEventListener(
      "change",
      previewProductImage
    );


  document
    .getElementById("gameIconUrl")
    ?.addEventListener(
      "input",
      () =>
        updateImagePreview(
          "gameIconUrl",
          "gameIconPreview"
        )
    );


  document
    .getElementById("gameBannerUrl")
    ?.addEventListener(
      "input",
      () =>
        updateImagePreview(
          "gameBannerUrl",
          "gameBannerPreview"
        )
    );


  document
    .getElementById("saveShopSettings")
    ?.addEventListener(
      "click",
      saveShopSettings
    );

}



/* =========================
   AUTH
========================= */

async function checkAdmin() {

  const supabase =
    window.supabaseClient;


  const {
    data,
    error
  } =
    await supabase.auth.getUser();


  if (error) {

    showLoginPage();

    return;
  }


  const user = data.user;


  if (!user) {

    showLoginPage();

    return;
  }


  const {
    data: admin,
    error: adminError
  } =
    await supabase
      .from("admins")
      .select("user_id,email")
      .eq("user_id", user.id)
      .maybeSingle();


  if (
    adminError ||
    !admin
  ) {

    await supabase.auth.signOut();

    showLoginMessage(
      "บัญชีนี้ไม่มีสิทธิ์แอดมิน"
    );

    showLoginPage();

    return;
  }


  showAdminPage(user);

}



function showLoginPage() {

  document
    .getElementById("loginPage")
    ?.classList.remove(
      "hidden"
    );


  document
    .getElementById("adminPage")
    ?.classList.add(
      "hidden"
    );

}



function showAdminPage(user) {

  document
    .getElementById("loginPage")
    ?.classList.add(
      "hidden"
    );


  document
    .getElementById("adminPage")
    ?.classList.remove(
      "hidden"
    );


  const status =
    document.getElementById(
      "adminStatus"
    );


  if (status) {

    status.textContent =
      "เข้าสู่ระบบแล้ว: " +
      user.email;

  }


  loadGames();
  loadProductGames();
  loadProducts();

}



async function loginAdmin() {

  const supabase =
    window.supabaseClient;


  const email =
    document
      .getElementById(
        "adminEmail"
      )
      .value
      .trim();


  const password =
    document
      .getElementById(
        "adminPassword"
      )
      .value;


  if (
    !email ||
    !password
  ) {

    showLoginMessage(
      "กรุณากรอกอีเมลและรหัสผ่าน"
    );

    return;
  }


  showLoginMessage(
    "กำลังเข้าสู่ระบบ..."
  );


  const {
    error
  } =
    await supabase.auth
      .signInWithPassword({
        email,
        password
      });


  if (error) {

    showLoginMessage(
      "เข้าสู่ระบบไม่สำเร็จ: " +
      error.message
    );

    return;
  }


  location.reload();

}



function showLoginMessage(message) {

  const element =
    document.getElementById(
      "loginMessage"
    );


  if (element) {

    element.textContent =
      message;

  }

}



async function logoutAdmin() {

  await window.supabaseClient
    .auth
    .signOut();

  location.reload();

}



/* =========================
   GAMES
========================= */

async function loadGames() {

  const container =
    document.getElementById(
      "gamesList"
    );


  if (!container) return;


  container.innerHTML =
    `<p class="loading">
      กำลังโหลดเกม...
    </p>`;


  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("games")
      .select("*")
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    container.innerHTML =
      `<p class="error">
        โหลดเกมไม่สำเร็จ<br>
        ${escapeHtml(
          error.message
        )}
      </p>`;

    return;
  }


  if (!data?.length) {

    container.innerHTML =
      "<p>ยังไม่มีเกม</p>";

    return;
  }


  container.innerHTML =
    data
      .map(renderGame)
      .join("");


  document
    .querySelectorAll(
      ".edit-game"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          editGame(
            button.dataset.id
          )
      );

    });


  document
    .querySelectorAll(
      ".delete-game"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteGame(
            button.dataset.id
          )
      );

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
          alt=""
          onerror="
            this.src='https://placehold.co/100x100'
          "
        >

        <div>

          <div class="game-name">
            ${escapeHtml(
              game.name
            )}
          </div>

          <div class="game-slug">
            ${escapeHtml(
              game.slug
            )}
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
  ).textContent =
    "เพิ่มเกม";


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


  hidePreview(
    "gameIconPreview"
  );


  hidePreview(
    "gameBannerPreview"
  );


  document
    .getElementById(
      "gameModal"
    )
    .classList.remove(
      "hidden"
    );

}



function closeGameModal() {

  document
    .getElementById(
      "gameModal"
    )
    .classList.add(
      "hidden"
    );

}



async function editGame(id) {

  const {
    data,
    error
  } =
    await window.supabaseClient
      .from("games")
      .select("*")
      .eq("id", id)
      .single();


  if (
    error ||
    !data
  ) {

    alert(
      "ไม่พบข้อมูลเกม"
    );

    return;
  }


  document.getElementById(
    "gameModalTitle"
  ).textContent =
    "แก้ไขเกม";


  document.getElementById(
    "gameId"
  ).value =
    data.id;


  document.getElementById(
    "gameName"
  ).value =
    data.name || "";


  document.getElementById(
    "gameSlug"
  ).value =
    data.slug || "";


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


  updateImagePreview(
    "gameIconUrl",
    "gameIconPreview"
  );


  updateImagePreview(
    "gameBannerUrl",
    "gameBannerPreview"
  );


  document
    .getElementById(
      "gameModal"
    )
    .classList.remove(
      "hidden"
    );

}



async function saveGame() {

  const id =
    document.getElementById(
      "gameId"
    ).value.trim();


  const game = {

    name:
      document
        .getElementById(
          "gameName"
        )
        .value
        .trim(),

    slug:
      document
        .getElementById(
          "gameSlug"
        )
        .value
        .trim(),

    description:
      document
        .getElementById(
          "gameDescription"
        )
        .value
        .trim(),

    icon_url:
      document
        .getElementById(
          "gameIconUrl"
        )
        .value
        .trim(),

    banner_url:
      document
        .getElementById(
          "gameBannerUrl"
        )
        .value
        .trim(),

    sort_order:
      Number(
        document
          .getElementById(
            "gameSortOrder"
          )
          .value
      ) || 0,

    is_active:
      document
        .getElementById(
          "gameActive"
        )
        .value ===
      "true"

  };


  if (
    !game.name ||
    !game.slug
  ) {

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
      "บันทึกเกมไม่สำเร็จ:\n" +
      result.error.message
    );

    return;
  }


  alert(
    "บันทึกเกมเรียบร้อยแล้ว"
  );


  closeGameModal();

  await loadGames();

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
   PRODUCT GAME LIST
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
      .select(
        "id,name"
      )
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    select.innerHTML =
      `<option value="">
        โหลดเกมไม่สำเร็จ
      </option>`;

    return;
  }


  select.innerHTML =
    `<option value="">
      เลือกเกม
    </option>` +
    (data || [])
      .map(game => `
        <option value="${game.id}">
          ${escapeHtml(
            game.name
          )}
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
    `<p class="loading">
      กำลังโหลดสินค้า...
    </p>`;


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
      .order(
        "sort_order",
        {
          ascending: true
        }
      );


  if (error) {

    container.innerHTML =
      `<p class="error">
        โหลดสินค้าไม่สำเร็จ<br>
        ${escapeHtml(
          error.message
        )}
      </p>`;

    return;
  }


  if (!data?.length) {

    container.innerHTML =
      `<p style="color:#888">
        ยังไม่มีสินค้า
      </p>`;

    return;
  }


  container.innerHTML =
    data
      .map(renderProduct)
      .join("");


  document
    .querySelectorAll(
      ".edit-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          editProduct(
            button.dataset.id
          )
      );

    });


  document
    .querySelectorAll(
      ".delete-product"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () =>
          deleteProduct(
            button.dataset.id
          )
      );

    });

}



function renderProduct(product) {

  const image =
    product.image_url ||
    "https://placehold.co/120x120";


  let statusText =
    "พร้อมขาย";


  if (
    product.stock <= 0
  ) {

    statusText =
      "สินค้าหมด";

  } else if (
    product.status ===
    "sold_out"
  ) {

    statusText =
      "สินค้าหมด";

  } else if (
    product.status ===
    "hidden"
  ) {

    statusText =
      "ซ่อน";

  }


  const active =
    product.stock > 0 &&
    product.status ===
      "available";


  return `

    <div class="game-card">

      <div class="game-head">

        <img
          class="game-icon"
          src="${escapeAttribute(image)}"
          alt=""
          onerror="
            this.src='https://placehold.co/120x120'
          "
        >


        <div>

          <div class="game-name">

            ${escapeHtml(
              product.name
            )}

          </div>


          <div class="game-slug">

            ${escapeHtml(
              product.games?.name ||
              "ไม่ระบุเกม"
            )}

          </div>

        </div>

      </div>


      <div
        style="
          margin-top:12px;
          font-size:16px;
        "
      >

        ราคา:

        <strong>

          ${Number(
            product.price
          ).toLocaleString()}

          บาท

        </strong>

      </div>


      <div
        style="
          margin-top:7px;
        "
      >

        สต็อก:

        <strong>
          ${product.stock}
        </strong>

      </div>


      <span class="status ${
        active
          ? "status-on"
          : "status-off"
      }">

        ${statusText}

      </span>


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
  ).textContent =
    "เพิ่มสินค้า";


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
  ).value =
    "available";


  hidePreview(
    "productImagePreview"
  );


  document
    .getElementById(
      "productModal"
    )
    .classList.remove(
      "hidden"
    );

}



function closeProductModal() {

  document
    .getElementById(
      "productModal"
    )
    .classList.add(
      "hidden"
    );

}



/* =========================
   PRODUCT IMAGE
========================= */

function previewProductImage(event) {

  const file =
    event.target.files?.[0];


  const preview =
    document.getElementById(
      "productImagePreview"
    );


  if (!file) {

    hidePreview(
      "productImagePreview"
    );

    return;
  }


  const url =
    URL.createObjectURL(
      file
    );


  preview.src = url;

  preview.style.display =
    "block";

}



/* =========================
   UPLOAD PRODUCT IMAGE
========================= */

async function uploadProductImage(
  file
) {

  if (!file) {
    return null;
  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  const filename =
    crypto.randomUUID() +
    "." +
    extension;


  const path =
    "products/" +
    filename;


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
          contentType:
            file.type
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
      .getPublicUrl(
        path
      );


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

    alert(
      "กรุณาเลือกเกม"
    );

    return;
  }


  if (!name) {

    alert(
      "กรุณาใส่ชื่อสินค้า"
    );

    return;
  }


  if (
    Number.isNaN(price) ||
    price < 0
  ) {

    alert(
      "กรุณาใส่ราคาให้ถูกต้อง"
    );

    return;
  }


  if (
    Number.isNaN(stock) ||
    stock < 0
  ) {

    alert(
      "กรุณาใส่จำนวนสต็อกให้ถูกต้อง"
    );

    return;
  }


  const button =
    document.getElementById(
      "saveProductButton"
    );


  button.disabled = true;

  button.textContent =
    "กำลังบันทึก...";


  try {

    let image_url =
      null;


    if (file) {

      image_url =
        await uploadProductImage(
          file
        );

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
          .eq(
            "id",
            id
          );

    } else {

      result =
        await window.supabaseClient
          .from("products")
          .insert(
            product
          );

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

    button.disabled =
      false;

    button.textContent =
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
      .eq(
        "id",
        id
      )
      .single();


  if (
    error ||
    !data
  ) {

    alert(
      "ไม่พบสินค้านี้"
    );

    return;
  }


  document.getElementById(
    "productModalTitle"
  ).textContent =
    "แก้ไขสินค้า";


  document.getElementById(
    "productId"
  ).value =
    data.id;


  document.getElementById(
    "productGame"
  ).value =
    data.game_id;


  document.getElementById(
    "productName"
  ).value =
    data.name || "";


  document.getElementById(
    "productPrice"
  ).value =
    data.price;


  document.getElementById(
    "productStock"
  ).value =
    data.stock;


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
    data.status ||
    "available";


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

    hidePreview(
      "productImagePreview"
    );

  }


  document
    .getElementById(
      "productModal"
    )
    .classList.remove(
      "hidden"
    );

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
      .eq(
        "id",
        id
      );


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


  await loadProducts();

}



/* =========================
   SHOP SETTINGS
========================= */

function saveShopSettings() {

  const name =
    document.getElementById(
      "shopName"
    ).value.trim();


  const tagline =
    document.getElementById(
      "shopTagline"
    ).value.trim();


  localStorage.setItem(
    "ASIRASHOP_shopName",
    name
  );


  localStorage.setItem(
    "ASIRASHOP_shopTagline",
    tagline
  );


  alert(
    "บันทึกการตั้งค่าแล้ว"
  );

}



/* =========================
   IMAGE PREVIEW
========================= */

function updateImagePreview(
  inputId,
  previewId
) {

  const input =
    document.getElementById(
      inputId
    );


  const preview =
    document.getElementById(
      previewId
    );


  if (
    !input ||
    !preview
  ) {
    return;
  }


  const value =
    input.value.trim();


  if (!value) {

    hidePreview(
      previewId
    );

    return;
  }


  preview.src =
    value;


  preview.style.display =
    "block";

}



function hidePreview(
  previewId
) {

  const preview =
    document.getElementById(
      previewId
    );


  if (preview) {

    preview.style.display =
      "none";

  }

}



/* =========================
   ESCAPE
========================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
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


function escapeAttribute(
  value
) {

  return escapeHtml(
    value
  );

}
