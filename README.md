# AnnounceKit react-native sdk

AnnounceKit Widget React Native Wrapper

![screenshot](https://s10.gifyu.com/images/ezgif.com-gif-maker8e5e55b6b2f0ab92.gif)

## Example
Live: https://snack.expo.dev/@amiralin/announcekit-widget

### Code Sample
```jsx
function App() {
  return (
    <SafeAreaView style={styles.container}>
      <AnnounceKitProvider widget="https://announcekit.co/widgets/v2/4c6CdO">
        <WidgetButton/>
      </AnnounceKitProvider>
    </SafeAreaView>
  );
}

function WidgetButton() {
  const unread = useUnreadCount();
  const [openWidget] = useWidget();

  if (typeof unread === 'undefined') return null;

  return (
    <Button title={`${unread} unread posts`} onPress={(e) => openWidget()}></Button>
  );
}
```


##Installation

```sh
npm install announcekit-react-native 
```

Also install [react-native-webview](https://github.com/react-native-webview/react-native-webview) because it's a dependency for this package

```sh
npm install add react-native-webview
```

Note: if you are on iOS, you will need this extra step: Install the native dependencies with Cocoapods

```sh
cd ios && pod install
```


## Documentation

### Props and Methods
```tsx
//props:
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


//methods
useUnreadCount(): number | undefined
useWidget(): [open(), close()]
```

##FAQ

If you have any questions contact https://announcekit.app or use [Issues](https://github.com/announcekitapp/announcekit-react-native/issues).