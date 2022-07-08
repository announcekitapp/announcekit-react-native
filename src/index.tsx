import * as React from "react";
import { useDeepCompareEffect } from "use-deep-compare";
import { Modal, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

const Ctx = React.createContext<any>({});

export interface AnnounceKitProps {
  widget: string;
  lang?: string;
  user?: {
    id: string | number;
    name?: string;
    email?: string;
  };
  data?: {
    [key: string]: any;
  };
  user_token?: string;
  labels?: string[];
  children?: React.ReactNode;
}

export function AnnounceKitProvider({
  widget,
  lang,
  user,
  user_token,
  labels,
  data,
  children,
}: AnnounceKitProps) {
  const [state, setState] = React.useState<any>({});
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const params = { data, lang, user, user_token, labels, mobile: true };

  useDeepCompareEffect(() => {
    fetch(`${widget}/data.json`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })
      .then((resp) => resp.json())
      .then((data) => setState(data));
  }, [widget, params]);

  return (
    <Ctx.Provider value={[state, params, { widget, setState, setIsOpen }]}>
      {children}
      <Widget visible={isOpen} onRequestClose={() => setIsOpen(false)} />
    </Ctx.Provider>
  );
}

export function useUnreadCount(): number | undefined {
  const [state] = React.useContext<any>(Ctx);

  if (!state.posts) {
    return undefined;
  }

  if (state.userData?.lastRead) {
    return state.posts.filter(
      (p) => new Date(p.visible_at).getTime() > Number(state.userData.lastRead)
    ).length;
  }

  return Math.min(5, state.posts.length);
}

export function useWidget() {
  const [state, , { setIsOpen }] = React.useContext<any>(Ctx);

  return [() => setIsOpen(true), () => setIsOpen(false)];
}

function Widget({ visible = true, onRequestClose = () => {} } = {}) {
  const [oldstate, params, { widget, setState }] = React.useContext(Ctx);

  return (
    <Modal
      presentationStyle="pageSheet"
      animationType="slide"
      visible={visible}
      onRequestClose={onRequestClose}
    >
      <View style={styles.modalView}>
        <Frame
          widget={widget}
          params={params}
          onRequestClose={onRequestClose}
          onState={setState}
        />
      </View>
    </Modal>
  );
}

function Frame({ widget, params, onRequestClose, onState }) {
  const mounted = React.useRef<boolean>(false);
  const wv = React.useRef(null);

  const [state, setState] = React.useState({});

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const body = new URLSearchParams({
    "json-body": JSON.stringify(params),
  }).toString();

  const postMessage = (msg) => {
    wv.current.injectJavaScript(
      `window.postMessage(${JSON.stringify(msg)}, "*");`
    );
  };

  return (
    <WebView
      ref={wv}
      allowsInlineMediaPlayback={true}
      injectedJavaScript={`
              var viewPortTag=document.createElement('meta');
              viewPortTag.name = "viewport";
              viewPortTag.content = "width=device-width, initial-scale=1, maximum-scale=1";
              document.getElementsByTagName('head')[0].appendChild(viewPortTag);
            `}
      originWhitelist={["*"]}
      containerStyle={{ width: "100%", height: "100%" }}
      source={{
        uri: `${widget}/view?react-native`,
        method: "post",
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }}
      onLoad={(e) => {
        postMessage({ event: "R2L_INIT", payload: { params } });
      }}
      onMessage={(event) => {
        if (!mounted.current) {
          return;
        }

        let message;

        try {
          message = JSON.parse(event.nativeEvent.data);
        } catch {
          return;
        }

        switch (message.event) {
          case "L2R_REQUEST": {
            if (message.payload == "close") {
              onRequestClose?.();
            }

            break;
          }
          case "L2R_PATCH_STATE":
            message.payload = { ...state, ...message.payload };
          // fallthrough
          case "L2R_STATE":
            setState(message.payload);
            onState?.(message.payload);
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  modalView: {
    width: "100%",
    height: "100%",
  },
});
