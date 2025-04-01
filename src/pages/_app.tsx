import { type AppType } from "next/app";
import { Geist } from "next/font/google";

import { api } from "~/utils/api";
import { ThemeProvider } from "~/components/theme/theme-provider";

import "~/styles/globals.css";

const geist = Geist({
  subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ThemeProvider>
      <div className={`${geist.className}`}>
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
};

export default api.withTRPC(MyApp);
