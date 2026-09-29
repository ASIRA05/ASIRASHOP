/* =========================================================
   ASIRASHOP - UI SYSTEM
   ========================================================= */

const ASIRA_DEFAULT_SETTINGS = {
    theme: "dark",

    colors: {
        bg: "#08090d",
        surface: "#101218",
        surface2: "#171923",
        border: "#272a34",
        text: "#ffffff",
        muted: "#858996",
        primary: "#f2c96d",
        primaryText: "#111111"
    },

    site: {
        name: "ASIRASHOP",
        tagline: "GAME ID STORE",
        logo: "",
        favicon: ""
    },

    homepage: {
        hero: true,
        games: true,
        newProducts: true,
        popularProducts: true,
        promotion: true,
        reviews: true,
        howToBuy: true,
        faq: true
    },

    navigation: [
        {
            name: "หน้าแรก",
            url: "index.html",
            icon: "⌂",
            enabled: true
        },
        {
            name: "เกมทั้งหมด",
            url: "#games",
            icon: "🎮",
            enabled: true
        },
        {
            name: "ไอดีมาใหม่",
            url: "#new-products",
            icon: "🔥",
            enabled: true
        },
        {
            name: "โปรโมชั่น",
            url: "#promotion",
            icon: "🏷️",
            enabled: true
        }
    ]
};


/* =========================================================
   SETTINGS
   ========================================================= */

function getAsiraSettings() {

    try {

        const saved =
            localStorage.getItem("ASIRASHOP_SETTINGS");

        if (!saved) {

            return structuredClone(
                ASIRA_DEFAULT_SETTINGS
            );
        }

        const parsed = JSON.parse(saved);

        return mergeObjects(
            structuredClone(ASIRA_DEFAULT_SETTINGS),
            parsed
        );

    } catch (error) {

        console.error(
            "ASIRASHOP settings error:",
            error
        );

        return structuredClone(
            ASIRA_DEFAULT_SETTINGS
        );
    }
}


/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveAsiraSettings(settings) {

    try {

        localStorage.setItem(
            "ASIRASHOP_SETTINGS",
            JSON.stringify(settings)
        );

        return true;

    } catch (error) {

        console.error(
            "Cannot save ASIRASHOP settings:",
            error
        );

        return false;
    }
}


/* =========================================================
   RESET SETTINGS
   ========================================================= */

function resetAsiraSettings() {

    localStorage.removeItem(
        "ASIRASHOP_SETTINGS"
    );

    location.reload();
}


/* =========================================================
   OBJECT MERGE
   ========================================================= */

function mergeObjects(target, source) {

    Object.keys(source || {}).forEach(key => {

        if (
            source[key] &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
        ) {

            if (!target[key]) {
                target[key] = {};
            }

            mergeObjects(
                target[key],
                source[key]
            );

        } else {

            target[key] = source[key];

        }

    });

    return target;
}


/* =========================================================
   APPLY COLORS
   ========================================================= */

function applyAsiraColors(settings) {

    const root =
        document.documentElement;

    const colors =
        settings.colors || {};

    if (colors.bg)
        root.style.setProperty(
            "--bg",
            colors.bg
        );

    if (colors.surface)
        root.style.setProperty(
            "--surface",
            colors.surface
        );

    if (colors.surface2)
        root.style.setProperty(
            "--surface-2",
            colors.surface2
        );

    if (colors.border)
        root.style.setProperty(
            "--border",
            colors.border
        );

    if (colors.text)
        root.style.setProperty(
            "--text",
            colors.text
        );

    if (colors.muted)
        root.style.setProperty(
            "--muted",
            colors.muted
        );

    if (colors.primary)
        root.style.setProperty(
            "--primary",
            colors.primary
        );

    if (colors.primaryText)
        root.style.setProperty(
            "--primary-text",
            colors.primaryText
        );
}


/* =========================================================
   APPLY SITE NAME
   ========================================================= */

function applyAsiraSite(settings) {

    const site =
        settings.site || {};

    document
        .querySelectorAll(
            "[data-site-name]"
        )
        .forEach(element => {

            element.textContent =
                site.name || "ASIRASHOP";

        });


    document
        .querySelectorAll(
            "[data-site-tagline]"
        )
        .forEach(element => {

            element.textContent =
                site.tagline ||
                "GAME ID STORE";

        });


    if (
        site.logo &&
        site.logo.trim() !== ""
    ) {

        document
            .querySelectorAll(
                "[data-site-logo]"
            )
            .forEach(element => {

                if (
                    element.tagName === "IMG"
                ) {

                    element.src =
                        site.logo;

                }

            });

    }


    if (
        site.favicon &&
        site.favicon.trim() !== ""
    ) {

        let favicon =
            document.querySelector(
                'link[rel="icon"]'
            );

        if (!favicon) {

            favicon =
                document.createElement(
                    "link"
                );

            favicon.rel = "icon";

            document.head.appendChild(
                favicon
            );
        }

        favicon.href =
            site.favicon;
    }
}


/* =========================================================
   HOMEPAGE SECTION VISIBILITY
   ========================================================= */

function applyHomepageSections(settings) {

    const homepage =
        settings.homepage || {};

    const sectionMap = {

        hero:
            "[data-section='hero']",

        games:
            "[data-section='games']",

        newProducts:
            "[data-section='new-products']",

        popularProducts:
            "[data-section='popular-products']",

        promotion:
            "[data-section='promotion']",

        reviews:
            "[data-section='reviews']",

        howToBuy:
            "[data-section='how-to-buy']",

        faq:
            "[data-section='faq']"
    };


    Object.keys(sectionMap)
        .forEach(key => {

            const selector =
                sectionMap[key];

            document
                .querySelectorAll(selector)
                .forEach(section => {

                    section.style.display =
                        homepage[key] === false
                            ? "none"
                            : "";

                });

        });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function renderAsiraNavigation(
    containerSelector
) {

    const settings =
        getAsiraSettings();

    const navigation =
        settings.navigation || [];

    const container =
        document.querySelector(
            containerSelector
        );

    if (!container) return;

    container.innerHTML = "";

    navigation
        .filter(item => item.enabled !== false)
        .forEach(item => {

            const link =
                document.createElement("a");

            link.href =
                item.url || "#";

            link.innerHTML = `
                <span>
                    ${item.icon || ""}
                </span>
                <span>
                    ${escapeHTML(item.name || "")}
                </span>
            `;

            container.appendChild(link);
        });
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}


/* =========================================================
   PREVIEW SETTINGS
   ========================================================= */

function previewAsiraSettings(settings) {

    applyAsiraColors(settings);

    applyAsiraSite(settings);

    applyHomepageSections(settings);
}


/* =========================================================
   APPLY ALL SETTINGS
   ========================================================= */

function applyAsiraSettings() {

    const settings =
        getAsiraSettings();

    previewAsiraSettings(
        settings
    );
}


/* =========================================================
   UPDATE COLOR
   ========================================================= */

function updateAsiraColor(
    colorName,
    value
) {

    const settings =
        getAsiraSettings();

    if (!settings.colors) {
        settings.colors = {};
    }

    settings.colors[colorName] =
        value;

    saveAsiraSettings(
        settings
    );

    applyAsiraColors(
        settings
    );
}


/* =========================================================
   UPDATE SITE
   ========================================================= */

function updateAsiraSite(
    property,
    value
) {

    const settings =
        getAsiraSettings();

    if (!settings.site) {
        settings.site = {};
    }

    settings.site[property] =
        value;

    saveAsiraSettings(
        settings
    );

    applyAsiraSite(
        settings
    );
}


/* =========================================================
   UPDATE HOMEPAGE SECTION
   ========================================================= */

function updateHomepageSection(
    section,
    enabled
) {

    const settings =
        getAsiraSettings();

    if (!settings.homepage) {
        settings.homepage = {};
    }

    settings.homepage[section] =
        Boolean(enabled);

    saveAsiraSettings(
        settings
    );

    applyHomepageSections(
        settings
    );
}


/* =========================================================
   ADD NAVIGATION ITEM
   ========================================================= */

function addNavigationItem(item) {

    const settings =
        getAsiraSettings();

    if (!Array.isArray(
        settings.navigation
    )) {

        settings.navigation = [];
    }

    settings.navigation.push({

        name:
            item.name ||
            "เมนูใหม่",

        url:
            item.url ||
            "#",

        icon:
            item.icon ||
            "•",

        enabled:
            item.enabled !== false
    });

    saveAsiraSettings(
        settings
    );
}


/* =========================================================
   REMOVE NAVIGATION ITEM
   ========================================================= */

function removeNavigationItem(
    index
) {

    const settings =
        getAsiraSettings();

    if (
        Array.isArray(
            settings.navigation
        )
    ) {

        settings.navigation.splice(
            index,
            1
        );
    }

    saveAsiraSettings(
        settings
    );
}


/* =========================================================
   MOVE NAVIGATION ITEM
   ========================================================= */

function moveNavigationItem(
    fromIndex,
    toIndex
) {

    const settings =
        getAsiraSettings();

    const navigation =
        settings.navigation;

    if (
        !Array.isArray(navigation)
    ) return;

    if (
        fromIndex < 0 ||
        fromIndex >= navigation.length ||
        toIndex < 0 ||
        toIndex >= navigation.length
    ) return;

    const item =
        navigation.splice(
            fromIndex,
            1
        )[0];

    navigation.splice(
        toIndex,
        0,
        item
    );

    saveAsiraSettings(
        settings
    );
}


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        applyAsiraSettings();

        if (
            document.querySelector(
                "[data-navigation]"
            )
        ) {

            renderAsiraNavigation(
                "[data-navigation]"
            );
        }

    }
);


/* =========================================================
   GLOBAL ASIRASHOP API
   ========================================================= */

window.ASIRASHOP = {

    getSettings:
        getAsiraSettings,

    saveSettings:
        saveAsiraSettings,

    resetSettings:
        resetAsiraSettings,

    apply:
        applyAsiraSettings,

    preview:
        previewAsiraSettings,

    updateColor:
        updateAsiraColor,

    updateSite:
        updateAsiraSite,

    updateSection:
        updateHomepageSection,

    addMenu:
        addNavigationItem,

    removeMenu:
        removeNavigationItem,

    moveMenu:
        moveNavigationItem

};
