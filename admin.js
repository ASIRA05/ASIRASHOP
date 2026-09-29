// ========================================
// ASIRASHOP ADMIN SYSTEM
// ========================================

const supabaseClient =
  window.supabaseClient;


// ========================================
// ELEMENTS
// ========================================

const loginPage =
  document.getElementById("loginPage");

const adminPage =
  document.getElementById("adminPage");

const loginForm =
  document.getElementById("loginForm");

const loginEmail =
  document.getElementById("loginEmail");

const loginPassword =
  document.getElementById("loginPassword");

const loginButton =
  document.getElementById("loginButton");

const loginMessage =
  document.getElementById("loginMessage");

const logoutButton =
  document.getElementById("logoutButton");

const adminStatus =
  document.getElementById("adminStatus");

const gamesList =
  document.getElementById("gamesList");

const productsList =
  document.getElementById("productsList");

const addGameButton =
  document.getElementById("addGameButton");

const addProductButton =
  document.getElementById("addProductButton");

const gameModal =
  document.getElementById("gameModal");

const productModal =
  document.getElementById("productModal");

const gameForm =
  document.getElementById("gameForm");

const productForm =
  document.getElementById("productForm");


// ========================================
// STATE
// ========================================

let adminReady = false;

let loadingAdmin = false;


// ========================================
// LOGIN MESSAGE
// ========================================

function showLoginMessage(
  message,
  type = "error"
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.className =
    "message show " + type;

}


function clearLoginMessage() {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    "";

  loginMessage.className =
    "message";

}


// ========================================
// ADMIN STATUS
// ========================================

function setAdminStatus(message) {

  if (adminStatus) {

    adminStatus.textContent =
      message;

  }

}


// ========================================
// HTML ESCAPE
// ========================================

function escapeHTML(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";

  }


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


// ========================================
// TIMEOUT
// ========================================

function withTimeout(
  promise,
  ms = 15000
) {

  return new Promise(
    (resolve, reject) => {

      let finished = false;


      const timer =
        setTimeout(
          () => {

            if (finished) {
              return;
            }

            finished = true;

            reject(
              new Error(
                "Supabase ไม่ตอบกลับภายใน " +
                (ms / 1000) +
                " วินาที"
              )
            );

          },
          ms
        );


      promise
        .then(
          value => {

            if (finished) {
              return;
            }

            finished = true;

            clearTimeout(timer);

            resolve(value);

          }
        )
        .catch(
          error => {

            if (finished) {
              return;
            }

            finished = true;

            clearTimeout(timer);

            reject(error);

          }
        );

    }
  );

}


// ========================================
// CHECK SUPABASE
// ========================================

function checkSupabaseConnection() {

  if (
    !window.supabaseClient ||
    !window.supabase
  ) {

    showLoginMessage(
      "ไม่พบการเชื่อมต่อ Supabase",
      "error"
    );

    if (loginButton) {

      loginButton.disabled =
        true;

    }

    return false;

  }


  return true;

}


// ========================================
// SHOW LOGIN
// ========================================

function showLoginPage() {

  if (loginPage) {

    loginPage.classList.remove(
      "hidden"
    );

  }


  if (adminPage) {

    adminPage.classList.add(
      "hidden"
    );

  }


  adminReady = false;

}


// ========================================
// SHOW ADMIN
// ========================================

function showAdminPage() {

  if (loginPage) {

    loginPage.classList.add(
      "hidden"
    );

  }


  if (adminPage) {

    adminPage.classList.remove(
      "hidden"
    );

  }


  clearLoginMessage();

  adminReady = true;

}


// ========================================
// CHECK ADMIN
// ========================================

async function checkAdmin() {

  if (loadingAdmin) {

    return false;

  }


  loadingAdmin = true;


  try {

    console.log(
      "Checking Supabase session..."
    );


    const {
      data,
      error
    } = await withTimeout(

      supabaseClient.auth.getSession(),

      15000

    );


    if (error) {

      console.error(
        "GET SESSION ERROR:",
        error
      );

      showLoginPage();

      showLoginMessage(
        "ตรวจสอบ Session ไม่สำเร็จ: " +
        error.message,
        "error"
      );

      return false;

    }


    const session =
      data?.session;


    // ------------------------------------
    // NO SESSION
    // ------------------------------------

    if (
      !session ||
      !session.user
    ) {

      console.log(
        "No active session"
      );

      showLoginPage();

      return false;

    }


    const user =
      session.user;


    console.log(
      "Current user:",
      user.email
    );


    // ------------------------------------
    // CHECK ADMIN TABLE
    // ------------------------------------

    const {
      data: admin,
      error: adminError
    } = await withTimeout(

      supabaseClient
        .from("admins")
        .select(
          "id,user_id,email"
        )
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle(),

      15000

    );


    if (adminError) {

      console.error(
        "ADMIN CHECK ERROR:",
        adminError
      );

      showLoginPage();

      showLoginMessage(
        "ตรวจสอบสิทธิ์แอดมินไม่สำเร็จ: " +
        adminError.message,
        "error"
      );

      return false;

    }


    // ------------------------------------
    // NOT ADMIN
    // ------------------------------------

    if (!admin) {

      console.error(
        "User is not admin"
      );


      await supabaseClient.auth.signOut();


      showLoginPage();


      showLoginMessage(
        "บัญชีนี้ไม่มีสิทธิ์แอดมิน",
        "error"
      );


      return false;

    }


    // ------------------------------------
    // ADMIN VERIFIED
    // ------------------------------------

    console.log(
      "ADMIN VERIFIED:",
      admin.email
    );


    showAdminPage();


    setAdminStatus(
      "กำลังโหลดข้อมูลร้าน..."
    );


    await loadAll();


    setAdminStatus(
      "เชื่อมต่อ ASIRASHOP สำเร็จ"
    );


    return true;


  } catch (error) {

    console.error(
      "CHECK ADMIN ERROR:",
      error
    );


    showLoginPage();


    showLoginMessage(
      "เกิดข้อผิดพลาด: " +
      (
        error.message ||
        "ไม่ทราบสาเหตุ"
      ),
      "error"
    );


    return false;


  } finally {

    loadingAdmin = false;

  }

}


// ========================================
// LOGIN
// ========================================

async function loginAdmin(event) {

  event.preventDefault();


  if (
    !checkSupabaseConnection()
  ) {

    return;

  }


  const email =
    loginEmail.value.trim();


  const password =
    loginPassword.value;


  if (
    !email ||
    !password
  ) {

    showLoginMessage(
      "กรุณากรอกอีเมลและรหัสผ่าน",
      "error"
    );

    return;

  }


  clearLoginMessage();


  loginButton.disabled =
    true;


  loginButton.textContent =
    "กำลังเข้าสู่ระบบ...";


  try {

    console.log(
      "LOGIN:",
      email
    );


    // ------------------------------------
    // SIGN IN
    // ------------------------------------

    const {
      data,
      error
    } = await withTimeout(

      supabaseClient.auth
        .signInWithPassword({

          email:
            email,

          password:
            password

        }),

      15000

    );


    console.log(
      "LOGIN RESPONSE:",
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


      const lower =
        message.toLowerCase();


      if (
        lower.includes(
          "invalid login credentials"
        )
      ) {

        message =
          "อีเมลหรือรหัสผ่านไม่ถูกต้อง";

      }


      if (
        lower.includes(
          "email not confirmed"
        )
      ) {

        message =
          "อีเมลนี้ยังไม่ได้ยืนยัน";

      }


      showLoginMessage(
        message,
        "error"
      );


      loginButton.disabled =
        false;


      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;

    }


    // ------------------------------------
    // CHECK SESSION
    // ------------------------------------

    if (
      !data ||
      !data.session ||
      !data.user
    ) {

      showLoginMessage(
        "เข้าสู่ระบบแล้ว แต่ไม่พบ Session",
        "error"
      );


      loginButton.disabled =
        false;


      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;

    }


    console.log(
      "LOGIN SUCCESS"
    );


    console.log(
      "SESSION SAVED:",
      !!data.session
    );


    showLoginMessage(
      "เข้าสู่ระบบสำเร็จ กำลังตรวจสอบสิทธิ์...",
      "success"
    );


    // ------------------------------------
    // CHECK ADMIN
    // ------------------------------------

    const isAdmin =
      await checkAdmin();


    if (!isAdmin) {

      loginButton.disabled =
        false;


      loginButton.textContent =
        "เข้าสู่ระบบ";


      return;

    }


    // สำเร็จ
    loginButton.disabled =
      false;


    loginButton.textContent =
      "เข้าสู่ระบบ";


  } catch (error) {

    console.error(
      "LOGIN EXCEPTION:",
      error
    );


    showLoginMessage(
      error.message ||
      "ไม่สามารถเข้าสู่ระบบได้",
      "error"
    );


    loginButton.disabled =
      false;


    loginButton.textContent =
      "เข้าสู่ระบบ";

  }

}


// ========================================
// LOGOUT
// ========================================

async function logoutAdmin() {

  try {

    loginButton.disabled =
      false;


    await supabaseClient.auth
      .signOut();


  } catch (error) {

    console.error(
      "LOGOUT ERROR:",
      error
    );

  }


  showLoginPage();


  loginEmail.value =
    "";


  loginPassword.value =
    "";


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
      .order(
        "sort_order",
        {
          ascending: true
        }
      ),

    15000

  );


  if (error) {

    throw error;

  }


  renderGames(
    data || []
  );


  updateGameSelect(
    data || []
  );

}


// ========================================
// RENDER GAMES
// ========================================

function renderGames(games) {

  if (!games.length) {

    gamesList.innerHTML =
      `
      <div class="item">
        ยังไม่มีเกม
      </div>
      `;

    return;

  }


  gamesList.innerHTML =
    games.map(
      game => {

        return `
          <div class="item">

            <div class="item-main">

              <div class="item-title">
                ${escapeHTML(
                  game.name
                )}
              </div>

              <div class="item-meta">
                slug:
                ${escapeHTML(
                  game.slug
                )}

                ·

                ${
                  game.is_active
                    ? "แสดง"
                    : "ซ่อน"
                }
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

      }
    ).join("");

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
    `
    <option value="">
      เลือกเกม
    </option>
    `;


  games.forEach(
    game => {

      select.innerHTML +=
        `
        <option
          value="${game.id}"
        >
          ${escapeHTML(
            game.name
          )}
        </option>
        `;

    }
  );

}


// ========================================
// OPEN GAME MODAL
// ========================================

function openGameModal(
  game = null
) {

  gameModal.classList.remove(
    "hidden"
  );


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
    ).checked =
      true;

  }

}


// ========================================
// CLOSE GAME MODAL
// ========================================

function closeGameModal() {

  gameModal.classList.add(
    "hidden"
  );

}


// ========================================
// SAVE GAME
// ========================================

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
      ).value.trim() ||
      null,

    banner_url:
      document.getElementById(
        "gameBannerUrl"
      ).value.trim() ||
      null,

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
            .eq(
              "id",
              id
            ),

          15000

        );


    } else {

      result =
        await withTimeout(

          supabaseClient
            .from("games")
            .insert(
              payload
            ),

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
        .eq(
          "id",
          id
        )
        .single(),

      15000

    );


    if (error) {

      throw error;

    }


    openGameModal(
      data
    );


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
        .eq(
          "id",
          id
        ),

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
      .order(
        "sort_order",
        {
          ascending: true
        }
      ),

    15000

  );


  if (error) {

    throw error;

  }


  renderProducts(
    data || []
  );

}


// ========================================
// RENDER PRODUCTS
// ========================================

function renderProducts(
  products
) {

  if (!products.length) {

    productsList.innerHTML =
      `
      <div class="item">
        ยังไม่มีสินค้า
      </div>
      `;

    return;

  }


  productsList.innerHTML =
    products.map(
      product => {

        let statusText =
          "พร้อมขาย";


        if (
          product.status ===
          "sold_out"
        ) {

          statusText =
            "สินค้าหมด";

        }


        if (
          product.status ===
          "hidden"
        ) {

          statusText =
            "ซ่อน";

        }


        return `
          <div class="item">

            <div class="item-main">

              <div class="item-title">
                ${escapeHTML(
                  product.name
                )}
              </div>


              <div class="item-meta">

                เกม:
                ${escapeHTML(
                  product.games?.name ||
                  "-"
                )}

                · ราคา:
                ${Number(
                  product.price
                ).toLocaleString()}
                บาท

                · สต็อก:
                ${product.stock}

                ·
                ${statusText}

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

      }
    ).join("");

}


// ========================================
// OPEN PRODUCT MODAL
// ========================================

function openProductModal(
  product = null
) {

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
      product.stock ?? 0;


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
      product.status ||
      "available";


  } else {

    productForm.reset();


    document.getElementById(
      "productModalTitle"
    ).textContent =
      "เพิ่มสินค้า";


    document.getElementById(
      "productStock"
    ).value =
      1;


    document.getElementById(
      "productStatus"
    ).value =
      "available";

  }

}


// ========================================
// CLOSE PRODUCT MODAL
// ========================================

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


  const imageInput =
    document.getElementById(
      "productImage"
    );


  const imageFile =
    imageInput?.files?.[0];


  let imageUrl =
    null;


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
          .select(
            "image_url"
          )
          .eq(
            "id",
            id
          )
          .single(),

        15000

      );


      if (oldError) {

        throw oldError;

      }


      imageUrl =
        oldProduct?.image_url ||
        null;

    }


    // ------------------------------------
    // UPLOAD IMAGE
    // ------------------------------------

    if (imageFile) {

      const extension =
        imageFile.name
          .split(".")
          .pop()
          .toLowerCase();


      const fileName =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .substring(2) +
        "." +
        extension;


      const filePath =
        "products/" +
        fileName;


      const {
        error: uploadError
      } = await withTimeout(

        supabaseClient
          .storage
          .from(
            "store-assets"
          )
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
          .from(
            "store-assets"
          )
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
            .update(
              payload
            )
            .eq(
              "id",
              id
            ),

          15000

        );


    } else {

      result =
        await withTimeout(

          supabaseClient
            .from("products")
            .insert(
              payload
            ),

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


    // ล้าง input รูป
    if (imageInput) {

      imageInput.value =
        "";

    }


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
        .eq(
          "id",
          id
        )
        .single(),

      15000

    );


    if (error) {

      throw error;

    }


    openProductModal(
      data
    );


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
        .eq(
          "id",
          id
        ),

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

const saveShopButton =
  document.getElementById(
    "saveShopButton"
  );


if (saveShopButton) {

  saveShopButton.addEventListener(
    "click",
    () => {

      const shopName =
        document.getElementById(
          "shopName"
        );

      const shopTagline =
        document.getElementById(
          "shopTagline"
        );

      const shopLine =
        document.getElementById(
          "shopLine"
        );

      const shopInstagram =
        document.getElementById(
          "shopInstagram"
        );


      localStorage.setItem(
        "ASIRASHOP_NAME",
        shopName?.value || ""
      );


      localStorage.setItem(
        "ASIRASHOP_TAGLINE",
        shopTagline?.value || ""
      );


      localStorage.setItem(
        "ASIRASHOP_LINE",
        shopLine?.value || ""
      );


      localStorage.setItem(
        "ASIRASHOP_INSTAGRAM",
        shopInstagram?.value || ""
      );


      setAdminStatus(
        "บันทึกตั้งค่าร้านแล้ว"
      );

    }
  );

}


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
  () => {

    openGameModal();

  }
);


addProductButton.addEventListener(
  "click",
  () => {

    openProductModal();

  }
);


document
  .getElementById(
    "closeGameModal"
  )
  .addEventListener(
    "click",
    closeGameModal
  );


document
  .getElementById(
    "cancelGameButton"
  )
  .addEventListener(
    "click",
    closeGameModal
  );


document
  .getElementById(
    "closeProductModal"
  )
  .addEventListener(
    "click",
    closeProductModal
  );


document
  .getElementById(
    "cancelProductButton"
  )
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
// SUPABASE AUTH STATE
// ========================================

supabaseClient.auth.onAuthStateChange(
  (event, session) => {

    console.log(
      "AUTH EVENT:",
      event
    );


    console.log(
      "AUTH SESSION:",
      !!session
    );


    // ไม่ทำอะไรทันทีตอน INITIAL_SESSION
    // เพราะ startAdmin() จะเป็นคนตรวจครั้งแรก

    if (
      event === "SIGNED_OUT"
    ) {

      showLoginPage();

      clearLoginMessage();

    }

  }
);


// ========================================
// START
// ========================================

(async function startAdmin() {

  console.log(
    "================================"
  );

  console.log(
    "ASIRASHOP ADMIN START"
  );

  console.log(
    "================================"
  );


  // เริ่มต้นให้หน้า Login แสดงก่อน
  showLoginPage();


  if (
    !checkSupabaseConnection()
  ) {

    return;

  }


  try {

    console.log(
      "กำลังตรวจสอบ Session..."
    );


    const {
      data,
      error
    } = await withTimeout(

      supabaseClient.auth
        .getSession(),

      15000

    );


    if (error) {

      console.error(
        "INITIAL SESSION ERROR:",
        error
      );


      showLoginPage();


      showLoginMessage(
        "ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ: " +
        error.message,
        "error"
      );


      return;

    }


    console.log(
      "INITIAL SESSION:",
      data.session
    );


    // ------------------------------------
    // HAS SESSION
    // ------------------------------------

    if (
      data.session
    ) {

      console.log(
        "พบ Session เดิม"
      );


      const isAdmin =
        await checkAdmin();


      if (!isAdmin) {

        showLoginPage();

      }


      return;

    }


    // ------------------------------------
    // NO SESSION
    // ------------------------------------

    console.log(
      "ไม่มี Session เดิม"
    );


    showLoginPage();


  } catch (error) {

    console.error(
      "START ERROR:",
      error
    );


    showLoginPage();


    showLoginMessage(
      "เชื่อมต่อ Supabase ไม่สำเร็จ: " +
      (
        error.message ||
        "ไม่ทราบสาเหตุ"
      ),
      "error"
    );

  }

})();
