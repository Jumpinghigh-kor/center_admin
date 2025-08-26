const flowbite = require("flowbite-react/tailwind");
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", flowbite.content()],
  theme: {
    extend: {
      colors: {
        custom: {
          DFEDE0: "#DFEDE0",
          E3F5FF: "#E3F5FF",
          FFE6E6: "#FFE6E6",
          393939: "#393939",
          727272: "#727272",
          E8E8E8: "#E8E8E8",
          C4C4C4: "#C4C4C4",
        },
      },
      keyframes: {
        openModalPC: {
          "0%": { transform: "translateX(400px)" },
          "100%": { transform: "translateX(0px)" },
        },
        openModalMobile: {
          "0%": { transform: "translateY(400px)" },
          "100%": { transform: "translateY(0px)" },
        },
      },
      animation: {
        openModalPC: "openModalPC 0.5s ease",
        openModalMobile: "openModalMobile 0.5s ease",
      },
      backgroundImage: {
        login_trampoline: "url('/images/login_trampoline.png')",
      },
      backgroundSize: {
        "150%": "150%",
      },
      width: {
        1200: 1200,
        600: 600,
      },
    },
  },
  // plugins: [flowbite.plugin()],
  plugins: [],
};
