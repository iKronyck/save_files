import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Platform,
  StatusBar,
  RefreshControl,
  ScrollView,
  AppState,
} from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import useGoBackHandler from "../../hooks/useGoBackHandler";
import * as Device from "expo-device";
import useRefresh from "../../hooks/useRefresh";
import useStorage from "../../hooks/useStorage";
import axios from "axios";

import BackgroundGeolocation from "react-native-background-geolocation";
// import useSendData from "../../hooks/useSendData";
import locationInstance from "../../hooks/useLocations";
import settingsInstance, { useSettings } from "../../hooks/useSettings";
import moment from "moment";
import AsyncStorage from "@react-native-async-storage/async-storage";

const pwaUri = Constants.expoConfig.extra.EXPO_PUBLIC_PWA_URI;
const appUrl = Constants.expoConfig.extra.EXPO_PUBLIC_API_URL;
const appVariant = Constants.expoConfig.extra.APP_VARIANT;
let WEBVIEW = null;

const sendMessageToWebView = async (message) => {
  // if (message.type === "locationUpdates") {
  //   let user = await (("user");
  //   message = { ...message, user: user.id };
  // }
  let messageString = JSON.stringify(message);
  const injectedJavaScript = `(function() {
    window.postMessage(${messageString});
  })();`;
  WEBVIEW?.injectJavaScript(injectedJavaScript);
};

const BACKGROUND_FETCH_TASK = "background-fetch";
// const RESTART_BACKGROUND_FETCH_TASK = "restart-background-fetch";

const NUMBER_LOCATIONS_TO_SEND = 100;

async function sendLocations() {
  let user = await AsyncStorage.getItem("user");
  user = JSON.parse(user);

  let providerState = await BackgroundGeolocation.getProviderState();

  const locations = locationInstance.getState().getLocations();
  const numOfIterations = locations.length / NUMBER_LOCATIONS_TO_SEND;
  const numOfIterationsWithoutDec = Math.floor(numOfIterations);

  for (let i = 0; i < numOfIterationsWithoutDec + 1; i++) {
    let locationsToSend = [];
    if (i === 0) {
      locationsToSend = Array.from(
        locations.slice(i * NUMBER_LOCATIONS_TO_SEND, NUMBER_LOCATIONS_TO_SEND)
      );
    } else {
      locationsToSend = Array.from(
        locations.slice(
          i * NUMBER_LOCATIONS_TO_SEND,
          (i + 1) * NUMBER_LOCATIONS_TO_SEND
        )
      );
    }
    const a = await axios.post(
      `${appUrl}location/track`,
      {
        type: "locationUpdates",
        userId: user?.id,
        timezone: user?.timezone,
        foreground_permission:
          providerState.status === 4 || providerState.status === 3,
        background_permission: providerState.status === 3,
        device_brand: Device.brand,
        device_model: Device.modelName,
        locations: locationsToSend,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    console.log(a.data);
  }
}

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("Envio task 1");
    await sendLocations(); //Logic to send data to API
    locationInstance.getState().removeAllLocations();
    await registerRestarBackgroundFetchAsync();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Error: ", error);
    console.log(JSON.stringify(error), "STRINGI");
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(RESTART_BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log("Envio task 2");
    await sendLocations();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error("Error: ", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

async function registerBackgroundFetchAsync(hour, minute) {
  const targetTime = moment().set({ hour, minute, second: 0 });
  const now = moment();
  let nextExecution;

  if (now.isBefore(targetTime)) {
    nextExecution = targetTime.diff(now, "seconds");
  } else {
    const nextOccurrence = targetTime.clone().add(1, "day").startOf("hour");
    nextExecution = nextOccurrence.diff(now, "seconds");
  }
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: nextExecution,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

async function registerRestarBackgroundFetchAsync() {
  await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  const TwentyFourHoursInSeconds = 86400;
  return BackgroundFetch.registerTaskAsync(RESTART_BACKGROUND_FETCH_TASK, {
    minimumInterval: TwentyFourHoursInSeconds,
    stopOnTerminate: false,
    startOnBoot: true,
  })
    .then((a) => console.log("Work: ", a))
    .catch((e) => console.log("Error: ", e));
}

const MainWebViewWrapper = () => {
  const statusBarHeight = Constants.statusBarHeight;

  // const WEBVIEW = useRef();
  const [webViewKey, setWebViewKey] = useState(0);
  const { distanceFilter, hasSettings, hour, minutes } = useSettings();

  const { addLocation } = locationInstance.getState();

  const { refreshing, refresherEnabled, onRefresh, handleScroll } =
    useRefresh(WEBVIEW);

  const [locationForegroundPermission, setLocationForegroundPermission] =
    useState(false);
  const [locationBackgroundPermission, setLocationBackgroundPermission] =
    useState(false);

  const { storeData, getData } = useStorage("user");

  const [error, setError] = useState(null);

  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const [isMounted, setMounted] = useState(false);

  async function onMessage(event) {
    // Handle messages received from the PWA
    const message = JSON.parse(event.nativeEvent.data);
    if (message?.type === "user") {
      await storeData("user", message.user);
    }
  }

  useGoBackHandler(() => {
    WEBVIEW?.goBack();
    return true;
  }, []);

  useEffect(() => {
    /// 1.  Subscribe to events.
    const onLocation = BackgroundGeolocation.onLocation(
      ({ coords, timestamp }) => {
        console.log("[onLocation]", coords.latitude, coords.longitude);
        addLocation({
          coords: {
            ...coords,
            altitudeAccuracy: coords.altitude_accuracy,
          },
          timestamp,
        });
      }
    );

    const onMotionChange = BackgroundGeolocation.onMotionChange((event) => {
      // console.log("[onMotionChange]", event);
    });

    const onActivityChange = BackgroundGeolocation.onActivityChange((event) => {
      // console.log("[onActivityChange]", event);
    });

    const onProviderChange = BackgroundGeolocation.onProviderChange((event) => {
      // console.log("[onProviderChange]", event);
      if (
        event.accuracyAuthorization ==
        BackgroundGeolocation.ACCURACY_AUTHORIZATION_REDUCED
      ) {
        // Supply "Purpose" key from Info.plist as 1st argument.
        BackgroundGeolocation.requestTemporaryFullAccuracy("Delivery")
          .then((accuracyAuthorization) => {
            if (
              accuracyAuthorization ==
              BackgroundGeolocation.ACCURACY_AUTHORIZATION_FULL
            ) {
              console.log(
                "[requestTemporaryFullAccuracy] GRANTED: ",
                accuracyAuthorization
              );
            } else {
              console.log(
                "[requestTemporaryFullAccuracy] DENIED: ",
                accuracyAuthorization
              );
            }
          })
          .catch((error) => {
            console.warn(
              "[requestTemporaryFullAccuracy] FAILED TO SHOW DIALOG: ",
              error
            );
          });
      }
    });

    const onHttp = BackgroundGeolocation.onHttp((response) => {
      console.log("[onHttp] ", response);
    });

    const initBackgroundGeolocation = async () => {
      registerBackgroundFetchAsync(hour, minutes);
      // registerRestarBackgroundFetchAsync();

      let user = await getData("user");

      /// 2. ready the plugin.
      BackgroundGeolocation.ready({
        // Geolocation Config
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: distanceFilter,
        // Activity Recognition
        stopTimeout: 1,
        // Application config
        debug: appVariant === "development" ? true : false, // <-- enable this hear sounds for background-geolocation life-cycle.
        logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
        stopOnTerminate: false, // <-- Allow the background-service to continue tracking when user closes the app.
        startOnBoot: true, // <-- Auto start tracking when device is powered-up.
        // HTTP / SQLite config
        url: appUrl + "location/track",
        batchSync: true, // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
        // maxBatchSize: 50,
        // autoSync: false, // <-- [Default: true] Set true to sync each location to server as it arrives.
        autoSyncThreshold: 5,
        // <-- Optional HTTP headers
        headers: {
          Accept: "application/json",
        },
        httpRootProperty: "locations",
        locationTemplate: [
          "{",
          '"timestamp": "<%= timestamp %>",',
          '"coords": {"altitude": <%= altitude %>, "heading": <%= heading %>, "altitudeAccuracy": <%= altitude_accuracy %>, "latitude": <%= latitude %>, "speed": <%= speed %>, "longitude": <%= longitude %>, "accuracy": <%= accuracy %>}',
          "}",
        ].join(""),
        autoSync: !hasSettings,
        // Android only
        locationAuthorizationRequest: "Always",
        backgroundPermissionRationale: {
          title:
            "Allow {applicationName} to access to this device's location in the background?",
          message:
            "In order to track your activity in the background, please enable {backgroundPermissionOptionLabel} location permission",
          positiveAction: "Change to {backgroundPermissionOptionLabel}",
          negativeAction: "Cancel",
        },
      }).then(async (state) => {
        console.log("- BackgroundGeolocation is configured and ready");
        let providerState = await BackgroundGeolocation.getProviderState();
        setLocationForegroundPermission(
          providerState.status === 4 || providerState.status === 3
        );
        setLocationBackgroundPermission(providerState.status === 3);
        BackgroundGeolocation.setConfig({
          params: {
            // <-- Optional HTTP params
            type: "locationUpdates",
            userId: user?.id,
            timezone: user?.timezone,
            foregroundPermission:
              providerState.status === 4 || providerState.status === 3,
            backgroundPermission: providerState.status === 3,
            deviceBrand: Device.brand,
            deviceModel: Device.modelName,
          },
        }).then((state) => {
          // console.log("[setConfig] success: ", state);
        });
        console.log(state);
        if (!state.enabled) BackgroundGeolocation.start();
        // let changePace = await BackgroundGeolocation.changePace(true); // uncomment for testing
      });
    };

    initBackgroundGeolocation();

    return () => {
      // Remove BackgroundGeolocation event-subscribers when the View is removed or refreshed
      // during development live-reload.  Without this, event-listeners will accumulate with
      // each refresh during live-reload.
      onLocation.remove();
      onMotionChange.remove();
      onActivityChange.remove();
      onProviderChange.remove();
      onHttp.remove();
    };
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollView}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          enabled={refresherEnabled}
          onRefresh={onRefresh}
        />
      }
    >
      <View
        style={{
          flex: 1,
          height: Platform.OS === "android" ? statusBarHeight : 0,
          backgroundColor: "#ffffff",
        }}
      >
        <StatusBar style="auto" />
        <WebView
          key={webViewKey}
          ref={(ref) => (WEBVIEW = ref)}
          source={{ uri: pwaUri }}
          javaScriptEnabled={true}
          cacheEnabled={false}
          incognito={true}
          style={{ flex: 1 }}
          onMessage={onMessage}
          onScroll={handleScroll}
          // startInLoadingState={true}
          // renderLoading={() => (
          //   <ActivityIndicator
          //     style={styles.activityIndicator}
          //     color="#ffffff"
          //     size="large"
          //   />
          // )}
        />
      </View>
    </ScrollView>
  );
};

export default MainWebViewWrapper;

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  // activityIndicator: {
  //   backgroundColor: "#E02F85",
  //   flex: 1,
  //   position: "absolute",
  //   left: 0,
  //   right: 0,
  //   top: 0,
  //   bottom: 0,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   transform: [{ scaleX: 2 }, { scaleY: 2 }],
  // },
});

