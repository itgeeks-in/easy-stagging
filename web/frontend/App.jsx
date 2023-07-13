import { BrowserRouter } from "react-router-dom";
import { NavigationMenu } from "@shopify/app-bridge-react";
import { ItgActivityContext } from "./context/activityContext";
import Routes from "./Routes";

import TawkMessengerReact from '@tawk.to/tawk-messenger-react';

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
                    label: "Subscription Orders",
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
                    label: "Support",
                    destination: "/helpsupport",
                  }
                ]}
              />
              <Routes pages={pages} />
            </ItgActivityContext>
            <TawkMessengerReact
propertyId="64ae72afcc26a871b027eaa9"
widgetId="1h54n00iv"/>
          </QueryProvider>
        </AppBridgeProvider>
      </BrowserRouter>
    </PolarisProvider>
  );
}
