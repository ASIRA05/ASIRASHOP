(function () {

  "use strict";

  console.log("ASIRASHOP admin.js started");


  /* =====================================================
     ELEMENTS
  ===================================================== */

  const loginPage = document.getElementById("loginPage");
  const adminPage = document.getElementById("adminPage");

  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginButton = document.getElementById("loginButton");

  const loginError = document.getElementById("loginError");
  const loginLoading = document.getElementById("loginLoading");

  const adminMessage = document.getElementById("adminMessage");


  /* =====================================================
     MESSAGE
  ===================================================== */

  function showMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = "message show " + (type || "info");
  }


  function hideMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.className = "message";
  }


  function loginMsg(message, type) {
    showMessage(loginError, message, type);
  }


  function adminMsg(message, type) {
    showMessage(adminMessage, message, type);
  }


  /* =====================================================
     LOADING
  ===================================================== */

  function setLoginLoading(isLoading) {
    if (!loginButton) return;

    loginButton.disabled = isLoading;

    if (isLoading) {
      loginButton.textContent = "กำลังเข้าสู่ระบบ...";
      if (loginLoading) loginLoading.textContent = "กำลังตรวจสอบบัญชี...";
    } else {
      loginButton.textContent = "เข้าสู่ระบบ";
      if (loginLoading) loginLoading.textContent = "";
    }
  }


  /* =====================================================
     PAGE
  ===================================================== */

  function showLogin() {
    loginPage.classList.remove("hidden");
    adminPage.classList.add("hidden");
  }


  function showAdmin() {
    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");
  }


  /* =====================================================
     GET SUPABASE
  ===================================================== */

  function getSupabase() {
    if (!window.supabaseClient) {
      throw new Error(
        "ไม่พบ Supabase Client\n" +
        "ตรวจสอบไฟล์ supabase.js"
      );
    }
    return window.supabaseClient;
  }


  /* =====================================================
     LOGIN
  ===================================================== */

  async function loginAdmin(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    console.log("LOGIN BUTTON CLICKED");

    hideMessage(loginError);

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    if (!email) {
      loginMsg("กรุณากรอกอีเมล", "error");
      loginEmail.focus();
      return false;
    }

    if (!password) {
      loginMsg("กรุณากรอกรหัสผ่าน", "error");
      loginPassword.focus();
      return false;
    }

    setLoginLoading(true);

    try {
      const supabase = getSupabase();

      console.log("กำลัง signInWithPassword");

      const result = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      console.log("LOGIN RESULT", result);

      if (result.error) {
        throw result.error;
      }

      const user = result.data.user;

      if (!user) {
        throw new Error("เข้าสู่ระบบสำเร็จ แต่ไม่พบข้อมูลผู้ใช้");
      }

      console.log("LOGIN USER:", user.email, user.id);

      /* ตรวจว่าเป็น Admin จริง */
      const adminResult = await supabase
        .from("admins")
        .select("user_id,email")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("ADMIN CHECK:", adminResult);

      if (adminResult.error) {
        console.error("ADMIN TABLE ERROR:", adminResult.error);
        await supabase.auth.signOut();
        throw new Error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์ Admin: " + adminResult.error.message);
      }

      if (!adminResult.data) {
        await supabase.auth.signOut();
        throw new Error("บัญชีนี้เข้าสู่ระบบได้ แต่ไม่ได้เป็น Admin ของ ASIRASHOP (ไม่พบ UID ในตาราง admins)");
      }

      loginMsg("เข้าสู่ระบบสำเร็จ", "success");

      showAdmin();

      await loadEverything();

    } catch (error) {
      console.error("LOGIN ERROR:", error);

      loginMsg(
        "เข้าสู่ระบบไม่สำเร็จ\n\n" + (error?.message || String(error)),
        "error"
      );

      showLogin();

    } finally {

      setLoginLoading(false);

    }

    return false;
  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  async function logoutAdmin() {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
    }

    showLogin();
    loginPassword.value = "";
  }


  /* =====================================================
     SESSION CHECK
  ===================================================== */

  async function checkSession() {
    try {
      const supabase = getSupabase();

      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      const session = data?.session;

      if (!session) {
        showLogin();
        return;
      }

      console.log("Existing session:", session.user.email);

      const adminResult = await supabase
        .from("admins")
        .select("user_id,email")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (adminResult.error || !adminResult.data) {
        console.warn("Session found but not an admin or table error", adminResult);
        await supabase.auth.signOut();
        showLogin();
        return;
      }

      showAdmin();
      await loadEverything();

    } catch (error) {
      console.error("SESSION ERROR:", error);
      showLogin();
    }
  }


  /* =====================================================
     SHOP SETTINGS
  ===================================================== */

  window.saveShopSettings = function () {
    adminMsg("ส่วนตั้งค่าร้านจะเชื่อมกับระบบร้านในขั้นต่อไป", "info");
  };


  /* =====================================================
     GAMES
  ===================================================== */

  let games = [];
  let products = [];


  async function loadGames() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw error;

    games = data || [];
    renderGames();
    populateProductGames();
  }


  function renderGames() {
    const container = document.getElementById("gamesList");

    if (!games.length) {
      container.innerHTML = '<div class="muted">ยังไม่มีเกม</div>';
      return;
    }

    container.innerHTML = games.map(function (game) {
      return `
        <div class="item">
          <div class="item-top">
            <img
              class="thumb"
              src="${escapeHtml(game.icon_url || "")}"
              onerror="this.style.display='none'"
            >
            <div class="item-info">
              <div class="item-name">${escapeHtml(game.name || "")}</div>
              <div class="muted">${escapeHtml(game.slug || "")}</div>
              <span class="status ${game.is_active ? "status-ok" : "status-off"}">
                ${game.is_active ? "แสดงอยู่" : "ซ่อนอยู่"}
              </span>
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-dark" onclick="window.editGame('${game.id}')">แก้ไข</button>
            <button type="button" class="btn btn-danger" onclick="window.deleteGame('${game.id}')">ลบ</button>
          </div>
        </div>
      `;
    }).join("");
  }


  window.openGameModal = function (game) {
    document.getElementById("gameModal").classList.remove("hidden");
    document.getElementById("gameModalTitle").textContent = game ? "แก้ไขเกม" : "เพิ่มเกม";
    document.getElementById("gameId").value = game?.id || "";
    document.getElementById("gameName").value = game?.name || "";
    document.getElementById("gameSlug").value = game?.slug || "";
    document.getElementById("gameDescription").value = game?.description || "";
    document.getElementById("gameIconUrl").value = game?.icon_url || "";
    document.getElementById("gameBannerUrl").value = game?.banner_url || "";
    document.getElementById("gameSortOrder").value = game?.sort_order ?? 0;
    document.getElementById("gameActive").checked = game?.is_active ?? true;
  };


  window.closeGameModal = function () {
    document.getElementById("gameModal").classList.add("hidden");
  };


  window.editGame = function (id) {
    const game = games.find(function (x) { return x.id === id; });
    if (!game) return;
    window.openGameModal(game);
  };


  window.saveGame = async function () {
    try {
      const supabase = getSupabase();
      const id = document.getElementById("gameId").value;

      const payload = {
        name: document.getElementById("gameName").value.trim(),
        slug: document.getElementById("gameSlug").value.trim(),
        description: document.getElementById("gameDescription").value.trim(),
        icon_url: document.getElementById("gameIconUrl").value.trim(),
        banner_url: document.getElementById("gameBannerUrl").value.trim(),
        sort_order: Number(document.getElementById("gameSortOrder").value) || 0,
        is_active: document.getElementById("gameActive").checked
      };

      if (!payload.name || !payload.slug) {
        throw new Error("กรุณาใส่ชื่อเกมและ Slug");
      }

      let result = id 
        ? await supabase.from("games").update(payload).eq("id", id)
        : await supabase.from("games").insert(payload);

      if (result.error) throw result.error;

      window.closeGameModal();
      await loadGames();
      adminMsg("บันทึกเกมเรียบร้อย", "success");

    } catch (error) {
      console.error(error);
      adminMsg("บันทึกเกมไม่สำเร็จ\n\n" + error.message, "error");
    }
  };


  window.deleteGame = async function (id) {
    if (!confirm("ต้องการลบเกมนี้ใช่หรือไม่?")) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("games").delete().eq("id", id);

      if (error) throw error;

      await loadGames();
      await loadProducts();
      adminMsg("ลบเกมเรียบร้อย", "success");

    } catch (error) {
      console.error(error);
      adminMsg("ลบเกมไม่สำเร็จ\n\n" + error.message, "error");
    }
  };


  /* =====================================================
     PRODUCTS
  ===================================================== */

  async function loadProducts() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("products")
      .select(`*, games ( name )`)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("PRODUCT LOAD ERROR:", error);
      const container = document.getElementById("productsList");
      container.innerHTML = `
        <div class="message show error">
          โหลดสินค้าไม่ได้: ${escapeHtml(error.message)}<br><br>
          ถ้ายังไม่ได้สร้างตาราง products ระบบสินค้าจะยังใช้ไม่ได้
        </div>
      `;
      return;
    }

    products = data || [];
    renderProducts();
  }


  function renderProducts() {
    const container = document.getElementById("productsList");

    if (!products.length) {
      container.innerHTML = '<div class="muted">ยังไม่มีสินค้า</div>';
      return;
    }

    container.innerHTML = products.map(function (product) {
      const statusText = product.status === "available"
        ? "พร้อมขาย"
        : product.status === "sold_out" ? "สินค้าหมด" : "ซ่อน";

      return `
        <div class="item">
          <div class="item-top">
            ${product.image_url ? `<img class="thumb" src="${escapeHtml(product.image_url)}" onerror="this.style.display='none'">` : ""}
            <div class="item-info">
              <div class="item-name">${escapeHtml(product.name || "")}</div>
              <div class="muted">เกม: ${escapeHtml(product.games?.name || "-")}</div>
              <div class="muted">ราคา: ${Number(product.price || 0).toLocaleString()} บาท</div>
              <div class="muted">Stock: ${product.stock ?? 0}</div>
              <span class="status ${product.status === "available" && Number(product.stock) > 0 ? "status-ok" : "status-off"}">
                ${statusText}
              </span>
            </div>
          </div>
          <div class="actions">
            <button type="button" class="btn btn-dark" onclick="window.editProduct('${product.id}')">แก้ไข</button>
            <button type="button" class="btn btn-danger" onclick="window.deleteProduct('${product.id}')">ลบ</button>
          </div>
        </div>
      `;
    }).join("");
  }


  function populateProductGames() {
    const select = document.getElementById("productGame");
    select.innerHTML = '<option value="">-- เลือกเกม --</option>';

    games.forEach(function (game) {
      const option = document.createElement("option");
      option.value = game.id;
      option.textContent = game.name;
      select.appendChild(option);
    });
  }


  window.openProductModal = function (product) {
    populateProductGames();

    document.getElementById("productModal").classList.remove("hidden");
    document.getElementById("productModalTitle").textContent = product ? "แก้ไขสินค้า" : "เพิ่มสินค้า";
    document.getElementById("productId").value = product?.id || "";
    document.getElementById("productGame").value = product?.game_id || "";
    document.getElementById("productName").value = product?.name || "";
    document.getElementById("productPrice").value = product?.price ?? "";
    document.getElementById("productStock").value = product?.stock ?? 0;
    document.getElementById("productDescription").value = product?.description || "";
    document.getElementById("productImage").value = product?.image_url || "";
    document.getElementById("productSortOrder").value = product?.sort_order ?? 0;
    document.getElementById("productStatus").value = product?.status || "available";
  };


  window.closeProductModal = function () {
    document.getElementById("productModal").classList.add("hidden");
  };


  window.editProduct = function (id) {
    const product = products.find(function (x) { return x.id === id; });
    if (!product) return;
    window.openProductModal(product);
  };


  window.saveProduct = async function () {
    try {
      const supabase = getSupabase();
      const id = document.getElementById("productId").value;

      const payload = {
        game_id: document.getElementById("productGame").value,
        name: document.getElementById("productName").value.trim(),
        price: Number(document.getElementById("productPrice").value) || 0,
        stock: Number(document.getElementById("productStock").value) || 0,
        description: document.getElementById("productDescription").value.trim(),
        image_url: document.getElementById("productImage").value.trim(),
        sort_order: Number(document.getElementById("productSortOrder").value) || 0,
        status: document.getElementById("productStatus").value
      };

      if (!payload.game_id) throw new Error("กรุณาเลือกเกม");
      if (!payload.name) throw new Error("กรุณาใส่ชื่อสินค้า");

      let result = id 
        ? await supabase.from("products").update(payload).eq("id", id)
        : await supabase.from("products").insert(payload);

      if (result.error) throw result.error;

      window.closeProductModal();
      await loadProducts();
      adminMsg("บันทึกสินค้าเรียบร้อย", "success");

    } catch (error) {
      console.error(error);
      adminMsg("บันทึกสินค้าไม่สำเร็จ\n\n" + error.message, "error");
    }
  };


  window.deleteProduct = async function (id) {
    if (!confirm("ต้องการลบสินค้านี้ใช่หรือไม่?")) return;

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;

      await loadProducts();
      adminMsg("ลบสินค้าเรียบร้อย", "success");

    } catch (error) {
      console.error(error);
      adminMsg("ลบสินค้าไม่สำเร็จ\n\n" + error.message, "error");
    }
  };


  /* =====================================================
     LOAD EVERYTHING
  ===================================================== */

  async function loadEverything() {
    adminMsg("กำลังโหลดข้อมูล...", "info");

    try {
      await loadGames();
      await loadProducts();
      adminMsg("โหลดข้อมูลเรียบร้อย", "success");
    } catch (error) {
      console.error("LOAD EVERYTHING ERROR:", error);
      adminMsg("โหลดข้อมูลไม่สำเร็จ\n\n" + error.message, "error");
    }
  }


  /* =====================================================
     ESCAPE HTML
  ===================================================== */

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* =====================================================
     GLOBAL ERROR HANDLER
  ===================================================== */

  window.addEventListener("error", function (event) {
    console.error("GLOBAL JS ERROR:", event.error || event.message);
    if (loginPage && !loginPage.classList.contains("hidden")) {
      loginMsg("JavaScript Error:\n\n" + event.message, "error");
    } else {
      adminMsg("JavaScript Error:\n\n" + event.message, "error");
    }
  });


  window.addEventListener("unhandledrejection", function (event) {
    console.error("UNHANDLED PROMISE:", event.reason);
    const message = event.reason?.message || String(event.reason);
    if (loginPage && !loginPage.classList.contains("hidden")) {
      loginMsg("เกิดข้อผิดพลาด:\n\n" + message, "error");
    } else {
      adminMsg("เกิดข้อผิดพลาด:\n\n" + message, "error");
    }
  });


  /* =====================================================
     EXPOSE LOGIN / LOGOUT
  ===================================================== */

  window.loginAdmin = loginAdmin;
  window.logoutAdmin = logoutAdmin;


  /* =====================================================
     START
  ===================================================== */

  console.log("ASIRASHOP admin system ready");

  checkSession();

})();
