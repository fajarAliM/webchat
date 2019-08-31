import { call, put, takeEvery } from 'redux-saga/effects';

import { LOAD_BOT_PRESET } from '../action/loadBotPreset';

import fetchMockBotDirectLineToken from '../../util/fetchMockBotDirectLineToken2';

import disableStreamingExtension from '../action/disableStreamingExtension';
import enableStreamingExtension from '../action/enableStreamingExtension';
import enableWebSocket from '../action/enableWebSocket';
import setDirectLineDomainHost from '../action/setDirectLineDomainHost';
import setDirectLineSecret from '../action/setDirectLineSecret';
import setDirectLineToken from '../action/setDirectLineToken';
import setSpeechKeyFromMockBot from '../action/setSpeechKeyFromMockBot';

export default function* loadBotPresetSaga() {
  yield takeEvery(LOAD_BOT_PRESET, function* ({ payload: { name } }) {
    try {
      if (name === 'mockbot') {
        const { token } = yield call(fetchMockBotDirectLineToken, 'webchat-mockbot.azurewebsites.net');

        yield put(disableStreamingExtension());
        yield put(enableWebSocket());
        yield put(setDirectLineSecret(''));
        yield put(setDirectLineToken(token));
        yield put(setSpeechKeyFromMockBot());
      } else if (name === 'mockbot-proxy') {
        const { token } = yield call(fetchMockBotDirectLineToken, 'webchat-mockbot-proxy.azurewebsites.net');

        yield put(enableStreamingExtension());
        yield put(enableWebSocket());
        yield put(setDirectLineDomainHost('webchat-mockbot-proxy.azurewebsites.net'));
        yield put(setDirectLineSecret(''));
        yield put(setDirectLineToken(token));
        yield put(setSpeechKeyFromMockBot());
      } else if (name === 'mockbot-streaming-extension') {
        const { token } = yield call(fetchMockBotDirectLineToken, 'webchat-mockbot-se.azurewebsites.net');

        yield put(enableStreamingExtension());
        yield put(enableWebSocket());
        yield put(setDirectLineDomainHost('webchat-mockbot-se.azurewebsites.net'));
        yield put(setDirectLineSecret(''));
        yield put(setDirectLineToken(token));
        yield put(setSpeechKeyFromMockBot());
      }
    } catch (err) {}
  });
}
