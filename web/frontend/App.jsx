import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";
import { ItgActivityContext } from "./context/activityContext";
import Routes from "./Routes";

import {
  AppBridgeProvider,
  QueryProvider,
  PolarisProvider,
} from "./components";

export default function App() {
  // Any .tsx or .jsx files in /pages will become a route
  // See documentation for <Routes /> for more info
  const pages = import.meta.globEager("./pages/**/!(*.test.[jt]sx)*.([jt]sx)");

  return (
    <PolarisProvider>
      <BrowserRouter>
        <AppBridgeProvider>
          <QueryProvider>
            <ItgActivityContext>  
              <NavigationMenu
                navigationLinks={[
                  {
                    label: "Orders",
                    destination: "/subscriptions",
                  },
                  {
                    label: "Subscription Groups",
                    destination: "/groups",
                  },
                  {
                    label: "Customers",
                    destination: "/customers",
                  },
                  {
                    label: "Pricing Plans",
                    destination: "/plans",
                  },
                  {
                    label: "Settings",
                    destination: "/settings",
                  },
                  {
                    label: "Help Support",
                    destination: "/helpsupport",
                  }
                ]}
              />
              <Routes pages={pages} />

            </ItgActivityContext>
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
