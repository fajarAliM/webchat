import { DirectLine } from 'botframework-directlinejs';
import Observable from 'core-js/features/observable';
import updateIn from 'simple-update-in';

(async function () {
  const urlSearchParams = new URLSearchParams(location.search);
  let version = urlSearchParams.get('v');
  const experiment = urlSearchParams.get('x') || 'noop';
  const secret = urlSearchParams.get('s');
  const speechKey = urlSearchParams.get('speechkey');
  const token = urlSearchParams.get('t');
  const userID = urlSearchParams.get('userid');
  const webSocket = urlSearchParams.get('ws') !== 'false';

  function createElement(tagName, attributes, ...children) {
    const element = document.createElement(tagName);

    Object.keys(attributes).forEach(name => {
      const value = attributes[name];

      if (/^on[A-Z]/.test(name)) {
        element.addEventListener(name.substr(2).toLowerCase(), value.bind(element));
      } else if (name === 'style') {
        const styles = value;
        const elementStyle = element.style;

        Object.keys(styles).forEach(name => {
          elementStyle[name] = styles[name];
        });
      } else if (typeof value === 'boolean') {
        value && element.setAttribute(name, '');
      } else if (typeof value !== 'undefined') {
        element.setAttribute(name, value);
      }
    });

    const childrenFragment = document.createDocumentFragment();

    children.forEach(child => childrenFragment.appendChild(typeof child === 'string' ? document.createTextNode(child) : child));
    element.appendChild(childrenFragment);

    return element;
  }

  function loadScript(src, integrity) {
    return new Promise((resolve, reject) => {
      document.head.appendChild(createElement(
        'script',
        {
          async: true,
          ...integrity ? { crossOrigin: 'anonymous', integrity } : {},
          onError: reject,
          onLoad: resolve,
          src
        }
      ));
    });
  }

  function loadStylesheet(href, integrity) {
    document.head.appendChild(createElement(
      'link',
      {
        ...integrity ? { crossOrigin: 'anonymous', integrity } : {},
        href,
        rel: 'stylesheet'
      }
    ));
  }

  async function loadAsset(src) {
    const [assetURL, integrity] = Array.isArray(src) ? src : [src, undefined];

    return /\.css$/i.test(assetURL) ? loadStylesheet(assetURL, integrity) : await loadScript(assetURL, integrity);
  }

  function passThru(observable, modifier) {
    return new Observable(observer => {
      const subscription = observable.subscribe({
        complete: () => observer.complete(),
        error: err => observer.error(err),
        next: value => {
          const nextValue = modifier ? modifier(value) : value;

          nextValue && observer.next(nextValue);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  function toRxJS(observable) {
    return {
      subscribe: subscriber => {
        return observable.subscribe({
          next: value => subscriber(value)
        });
      }
    };
  }

  let assetURLs;

  if (version === 'localhost') {
    assetURLs = [`http://localhost:5000/webchat.js?_=${ Date.now() }`];
  } else if (/^4/.test(version)) {
    assetURLs = [`https://cdn.botframework.com/botframework-webchat/${ version }/webchat.js`];
  } else {
    assetURLs = [
      `https://unpkg.com/botframework-webchat@${ version }/botchat.js`,
      `https://unpkg.com/botframework-webchat@${ version }/botchat.css`,
      `https://unpkg.com/botframework-webchat@${ version }/CognitiveServices.js`,
    ];
  }

  if (!assetURLs) {
    assetURLs = VERSIONS['4.4'];
    version = '4.4';
  }

  await Promise.all(assetURLs.map(url => loadAsset(url)));

  const directLine = new DirectLine({ secret, token, webSocket });
  const quirkyDirectLine = {
    activity$: passThru(directLine.activity$, activity => {
      const nextActivity = updateIn(
        activity,
        ['attachments', () => true, 'contentUrl'],
        experiment === 'noop' ?
          value => value
        : experiment === 'placeholder' ?
          () => 'placeholder.png'
        : experiment === '403' ?
          // Removing the token will cause 403
          value => value.replace(/\?t=.+/, '')
        :
          undefined
      );

      return nextActivity;
    }),
    connectionStatus$: passThru(directLine.connectionStatus$),
    end: () => directLine.end(),
    get referenceGrammarId() { return directLine.referenceGrammarId; },
    getSessionId: (...args) => directLine.getSessionId(...args),
    postActivity: (...args) => directLine.postActivity(...args),
    get token() { return directLine.token; }
  };

  if (version === 'localhost' || /^4/.test(version)) {
    const webSpeechPonyfillFactory = speechKey ? await window.WebChat.createCognitiveServicesSpeechServicesPonyfillFactory({
      region: 'westus',
      subscriptionKey: speechKey
    }) : undefined;

    window.WebChat.renderWebChat({
      directLine: quirkyDirectLine,
      webSpeechPonyfillFactory
    }, document.getElementById('webchat'));
  } else {
    window.BotChat.App({
      botConnection: {
        ...quirkyDirectLine,
        activity$: toRxJS(quirkyDirectLine.activity$),
        connectionStatus$: toRxJS(quirkyDirectLine.connectionStatus$)
      },
      speechOptions: {
        speechRecognizer: new CognitiveServices.SpeechRecognizer({ subscriptionKey: speechKey }),
        speechSynthesizer: new CognitiveServices.SpeechSynthesizer({
          gender: CognitiveServices.SynthesisGender.Female,
          subscriptionKey: speechKey,
          voiceName: 'Microsoft Server Speech Text to Speech Voice (en-US, JessaRUS)'
        })
      },
      user: { id: userID, name: 'You' }
    }, document.getElementById('webchat'));
  }

  document.querySelector('#webchat > *').focus();

  // setTimeout(() => {
  //   quirkyDirectLine.postActivity({
  //     from: { id: userID },
  //     text: `echo Loading Web Chat "${ version }" using experiment "${ experiment }"`,
  //     type: 'message'
  //   }).subscribe();
  // }, 2000);
})().catch(err => console.error(err));