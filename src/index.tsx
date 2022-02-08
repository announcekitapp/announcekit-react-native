import * as React from 'react';
import { useDeepCompareEffect } from 'use-deep-compare';
import { Modal, StyleSheet, View } from 'react-native';
import {WebView} from 'react-native-webview';

const Ctx = React.createContext<any>({});

export interface AnnounceKitProps {
    widget: string;
    lang?: string;
    user?: {
        id: string | number;
        name?: string;
        email?: string;
    }
    data?: {
        [key: string]: any;
    };
    children?: React.ReactNode
}

export function AnnounceKitProvider({widget, lang, user, data, children}: AnnounceKitProps) {
    const [state, setState] = React.useState<any>({});

    const params = {data, lang, user, mobile: true};

    useDeepCompareEffect(() => {
        fetch(`${widget}/data.json`, {
            method: 'POST',
            body: JSON.stringify(params),
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(resp => resp.json())
          .then(data => setState(data))
    }, [widget, params]);

    return (
        <Ctx.Provider value={[state, params, {widget, setState}]}>
            {children}
            <Widget visible={!!state.$rn_open} onRequestClose={() => setState({...state, $rn_open: false})}/>
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
    const [state, , {setState}] = React.useContext<any>(Ctx);

    return [
        () => setState({...state, $rn_open: true}),
        () => setState({...state, $rn_open: false})
    ]
}

export function Widget({visible = true, onRequestClose = () => { }} = {}) {
    const [oldstate, params, {widget, setState}] = React.useContext(Ctx);

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
                    onState={state => setState({...state, $rn_open: oldstate.$rn_open})}
                />
            </View>
        </Modal>
    );
}

function Frame({widget, params, onRequestClose, onState}) {
    const [state, setState] = React.useState({});

    const wv = React.useRef(null);

    const body = new URLSearchParams({
        'json-body': JSON.stringify(params),
    }).toString();

    const postMessage = (msg) => {
        wv.current.injectJavaScript(
            `window.originalPostMessage(${JSON.stringify(msg)}, "*");`
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

              window.originalPostMessage = window.postMessage;
              window.postMessage = function(data) { window.ReactNativeWebView.postMessage(JSON.stringify(data)); }
            `}
            //injectedJavaScriptBeforeContentLoaded={true}
            originWhitelist={['*']}
            containerStyle={{width: '100%', height: '100%'}}
            source={{
                uri: `${widget}/view`,
                method: 'post',
                body,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                },
            }}
            onLoad={(e) => {
                postMessage({event: 'R2L_INIT', payload: {params}});
            }}
            onMessage={(event) => {
                let message;

                try {
                    message = JSON.parse(event.nativeEvent.data);
                } catch {
                    return;
                }

                switch (message.event) {
                    case 'L2R_REQUEST': {
                        if (message.payload == 'close') {
                            onRequestClose?.();
                        }

                        break;
                    }
                    case 'L2R_PATCH_STATE':
                        message.payload = {...state, ...message.payload};
                    // fallthrough
                    case 'L2R_STATE':
                        setState(message.payload);
                        onState?.(message.payload);
                }
            }}
        />
    );
}

const styles = StyleSheet.create({
    modalView: {
        width: '100%',
        height: '100%',
    },
});
