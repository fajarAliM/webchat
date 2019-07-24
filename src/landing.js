import React, { Fragment, useCallback, useMemo, useState } from 'react';
import { render } from 'react-dom';

(async function () {
  function generateUserId() {
    return `dl_${ Math.random().toString(36).substr(2) }`;
  }

  async function generateDirectLineToken(secret) {
    const userId = generateUserId();

    const res = await fetch(`https://directline.botframework.com/v3/directline/tokens/generate`, {
      body: JSON.stringify({ User: { Id: userId } }),
      headers: {
        authorization: `Bearer ${ secret }`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    if (!res.ok) {
      throw new Error(`Direct Line returned ${ res.status } while generating token`);
    }

    const json = await res.json();

    if ('error' in json) {
      throw new Error(`Direct Line responded ${ JSON.stringify(json.error) } while generating new token`);
    }

    return { ...json, userId };
  }

  const VersionSelector = ({
    onChange,
    value
  }) => {
    const [versions, setVersions] = useState([]);

    useMemo(async () => {
      try {
        const res = await fetch('https://webchat-mockbot.azurewebsites.net/versions/botframework-webchat');

        setVersions((await res.json()).versions);
      } catch (err) {
        if (err) {
          return alert('Failed to fetch version list from NPMJS. Please check network trace for details.');
        }
      }
    }, []);

    const style = useMemo(() => ({ fontSize: '80%', marginRight: '.5em' }));

    const presetVersions = {
      '4.5.0': '4.5.0',
      '4.4.2': '4.4.2',
      '4.4.1': '4.4.1',
      '4.3.0': '4.3.0',
      '4.2.0': '4.2.0',
      '4.1.0': '4.1.0',
      v3: (versions || []).map(({ version }) => version).find(version => /-v3\./.test(version)),
      scorpio: (versions || []).map(({ version }) => version).find(version => /-ibiza\./.test(version)),
      'localhost:5000': 'localhost'
    };

    return (
      <section className="row">
        <label style={{
          alignItems: 'flex-start',
          display: 'flex'
        }}>
          <header>Version</header>
          <div>
            <div>
              <select
                disabled={ versions.length < 2 }
                onChange={ ({ target: { value } }) => onChange(value) }
                value={ value }
              >
                { (versions || []).map(({ time, version }) =>
                  <option key={ version } value={ version }>
                    { version } ({ new Date(time).toLocaleDateString() })
                  </option>
                ) }
                <option value="localhost">http://localhost:5000/webchat.js</option>
              </select>
            </div>
            <div>
              {
                Object.keys(presetVersions).map(name =>
                  <a
                    href="#"
                    key={ name }
                    onClick={ evt => {
                      evt.preventDefault();
                      onChange(presetVersions[name]);
                    } }
                    style={ style }
                  >
                    { name }
                  </a>
                )
              }
            </div>
          </div>
        </label>
      </section>
    );
  };

  function caseInsensitiveCompare(x, y) {
    x = x && x.toLowerCase();
    y = y && y.toLowerCase();

    return x > y ? 1 : x < y ? -1 : 0;
  }

  function tryParseJSON(json) {
    try {
      return JSON.parse(json);
    } catch (err) {}
  };

  const Credential = ({
    onSecretChange,
    onTokenChange,
    onUserIdChange,
    secret,
    token,
    userId
  }) => {
    useMemo(async () => {
      const { token, userId } = await generateDirectLineToken(secret);
      // const res = await fetch('https://webchat-mockbot.azurewebsites.net/directline/token', { method: 'POST' });
      // const { token, userID } = await res.json();
    }, [secret]);

    const handleFocus = useCallback(({ target }) => target.select());
    const handleSecretChange = useCallback(({ target: { value } }) => onSecretChange(value), [onSecretChange, token]);
    const presetStyle = useMemo(() => ({ fontFamily: `Consolas, 'Courier New', monospace`, marginRight: '1em' }));
    const [savedSecretsString, setSavedSecretsString] = useState(window.localStorage.getItem('SAVED_SECRETS'));
    const savedSecrets = useMemo(() => (tryParseJSON(savedSecretsString) || []).sort(caseInsensitiveCompare), [savedSecretsString]);
    const setSavedSecrets = useCallback(secrets => setSavedSecretsString(JSON.stringify(secrets)), [setSavedSecretsString]);
    const userIdStyle = useMemo(() => ({ fontFamily: `Consolas, 'Courier New', monospace` }));

    useMemo(() => window.localStorage.setItem('SAVED_SECRETS', savedSecretsString), [savedSecretsString]);

    return (
      <Fragment>
        <section className="row">
          <label style={{
            alignItems: 'flex-start',
            display: 'flex'
          }}>
            <span>{ token ? 'Token' : 'Secret' }</span>
            <div>
              <div>
                <input
                  autoComplete={ token ? 'off' : 'on' }
                  name={ token ? 'DIRECT_LINE_TOKEN' : 'DIRECT_LINE_SECRET' }
                  onChange={ token ? undefined : handleSecretChange }
                  onFocus={ handleFocus }
                  readOnly={ !!token }
                  required={ true }
                  style={ presetStyle }
                  type="text"
                  value={ token || secret }
                />
              </div>
              {
                !token &&
                  <div>
                    {
                      savedSecrets.map(secret =>
                        <Fragment key={ secret }>
                          <a
                            href="#"
                            onClick={ event => {
                              event.preventDefault();
                              onSecretChange(secret);
                            } }
                          >
                            <small><code>{ secret.substr(0, 5) }&hellip;</code></small>
                          </a>
                          <a
                            href="#"
                            onClick={ event => {
                              event.preventDefault();
                              setSavedSecrets(savedSecrets.filter(s => s !== secret));
                            } }
                          >
                            <small>[&times;]</small>
                          </a>
                          &nbsp;
                        </Fragment>
                      )
                    }
                    <a
                      href="#"
                      onClick={ event => {
                        event.preventDefault();
                        savedSecrets.includes(secret) || setSavedSecrets([...savedSecrets, secret]);
                      } }
                    >
                      <small>Save</small>
                    </a>
                  </div>
              }
            </div>
            {
              token ?
                <button
                  onClick={ () => {
                    onTokenChange('');
                    onUserIdChange(`r_${ Math.random().toString(36).substr(2) }`);
                  } }
                  type="button"
                >
                  Use secret
                </button>
              :
                <button
                  onClick={ async () => {
                    const { token, userId } = await generateDirectLineToken(secret);

                    onTokenChange(token);
                    onUserIdChange(userId);
                  } }
                  type="button"
                >
                  Generate token
                </button>
            }
          </label>
        </section>
        <section className="row">
          <label>
            <header>User ID</header>
            <input
              onFocus={ handleFocus }
              readOnly={ true }
              style={ userIdStyle }
              value={ userId }
            />
          </label>
        </section>
      </Fragment>
    );
  };

  const SpeechCredential = ({
    onSpeechKeyChange,
    speechKey
  }) => {
    const handleChange = useCallback(({ target: { value } }) => onSpeechKeyChange(value), [onSpeechKeyChange]);
    const handleFocus = useCallback(({ target }) => target.select());
    const style = useMemo(() => ({ fontFamily: `Consolas, 'Courier New', monospace`, marginRight: '1em' }));

    return (
      <section className="row">
        <label>
          <header>Speech key</header>
          <input
            onChange={ handleChange }
            onFocus={ handleFocus }
            style={ style }
            value={ speechKey }
          />
        </label>
      </section>
    );
  }

  const ExperimentSelector = ({
    onChange,
    value
  }) => {
    const handleChange = useCallback(({ target: { value } }) => onChange(value));

    return (
      <section className="row">
        <label>
          <header>Experiment</header>
          <select
            onChange={ handleChange }
            value={ value }
          >
            <option value="">No experiments</option>
            <option value="remove">Remove content URL</option>
            <option value="placeholder">Replace content URL with a placeholder image</option>
            <option value="403">Replace content URL with one return 403</option>
          </select>
        </label>
      </section>
    );
  }

  const WebSocketToggle = ({
    onChange,
    value
  }) => {
    const handleChange = useCallback(({ target: { checked } }) => onChange(checked), [onChange]);
    const style = useMemo(() => ({ margin: 0 }));

    return (
      <section className="row">
        <label>
          <header>Web Socket</header>
          <input
            checked={ value }
            onChange={ handleChange }
            style={ style }
            type="checkbox"
          />
        </label>
      </section>
    );
  }

  const App = () => {
    const [experiment, setExperiment] = useState('');
    const [secret, setSecret] = useState(localStorage.getItem('WEB_CHAT_SECRET') || '');
    const [speechKey, setSpeechKey] = useState(localStorage.getItem('SPEECH_KEY') || '');
    const [token, setToken] = useState('');
    const [userId, setUserId] = useState(`r_${ Math.random().toString(36).substr(2) }`);
    const [useWebSocket, setUseWebSocket] = useState(true);
    const [version, setVersion] = useState('4.5.0');
    const searchParams = new URLSearchParams({
      ...(experiment ? { x: experiment } : {}),
      v: version,
      ...(token ? { t: token } : { s: secret }),
      ...(speechKey ? { speechkey: speechKey } : {}),
      userid: userId,
      ws: useWebSocket + ''
    });
    const webChatURL = `webchat?${ searchParams.toString() }`;

    useMemo(() => localStorage.setItem('SPEECH_KEY', speechKey), [speechKey]);
    useMemo(() => localStorage.setItem('WEB_CHAT_SECRET', secret), [secret]);

    return (
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center'
        }}
      >
        <div style={{
          backgroundColor: 'White',
          border: 'solid 1px #DDD',
          padding: '0 20px 20px'
        }}>
          <pre
            title={ [
              'Slant by Glenn Chappell 3/93 -- based on Standard',
              'Includes ISO Latin-1',
              'figlet release 2.1 -- 12 Aug 1994',
              'Permission is hereby given to modify this font, as long as the',
              'modifier\'s name is placed on a comment line.',
              '',
              'Modified by Paul Burton <solution@earthlink.net> 12/96 to include new parameter',
              'supported by FIGlet and FIGWin.  May also be slightly modified for better use',
              'of new full-width/kern/smush alternatives, but default output is NOT changed.'
            ].join('\n') }
          >&nbsp;_       __     __       ________          __<br />
            | |     / /__  / /_     / ____/ /_  ____ _/ /_<br />
            | | /| / / _ \/ __ \   / /   / __ \/ __ `/ __/<br />
            | |/ |/ /  __/ /_/ /  / /___/ / / / /_/ / /_<br />
            |__/|__/\___/_.___/   \____/_/ /_/\__,_/\__/<br />
          </pre>
          <VersionSelector
            onChange={ setVersion }
            value={ version }
          />
          <Credential
            onSecretChange={ setSecret }
            onTokenChange={ setToken }
            onUserIdChange={ setUserId }
            secret={ secret }
            token={ token }
            userId={ userId }
          />
          <WebSocketToggle
            onChange={ setUseWebSocket }
            value={ useWebSocket }
          />
          <SpeechCredential
            onSpeechKeyChange={ setSpeechKey }
            speechKey={ speechKey }
          />
          <ExperimentSelector
            onChange={ setExperiment }
            value={ experiment }
          />
          <section className="row" style={{ marginBottom: 0 }}>
            <a
              href={ webChatURL }
              target="_blank"
            >
              Open Web Chat in a new window
            </a>
          </section>
        </div>
      </div>
    );
  };

  render(<App />, document.getElementById('root'));
})().catch(err => console.error(err));
