import React, { useMemo } from 'react';

import isURL from '../util/isURL';

import useDirectLineConversationId from '../data/hooks/useDirectLineConversationId';
import useDirectLineDomainHost from '../data/hooks/useDirectLineDomainHost';
import useDirectLineSecret from '../data/hooks/useDirectLineSecret';
import useDirectLineToken from '../data/hooks/useDirectLineToken';
import useDirectLineUserId from '../data/hooks/useDirectLineUserId';
import useProtocolAppServiceExtension from '../data/hooks/useProtocolAppServiceExtension';
import useProtocolDirectLineSpeech from '../data/hooks/useProtocolDirectLineSpeech';
import useProtocolREST from '../data/hooks/useProtocolREST';
import useProtocolTranscript from '../data/hooks/useProtocolTranscript';
import useProtocolWebSocket from '../data/hooks/useProtocolWebSocket';
import useSpeechAuthorizationToken from '../data/hooks/useSpeechAuthorizationToken';
import useSpeechRegion from '../data/hooks/useSpeechRegion';
import useSpeechSubscriptionKey from '../data/hooks/useSpeechSubscriptionKey';
import useTranscriptDialogContent from '../data/hooks/useTranscriptDialogContent';
import useVersion from '../data/hooks/useVersion';

const WebChatLink = () => {
  const [conversationId] = useDirectLineConversationId();
  const [domainHost] = useDirectLineDomainHost();
  const [protocolAppServiceExtension] = useProtocolAppServiceExtension();
  const [protocolDirectLineSpeech] = useProtocolDirectLineSpeech();
  const [protocolREST] = useProtocolREST();
  const [protocolTranscript] = useProtocolTranscript();
  const [protocolWebSocket] = useProtocolWebSocket();
  const [secret] = useDirectLineSecret();
  const [speechAuthorizationToken] = useSpeechAuthorizationToken();
  const [speechRegion] = useSpeechRegion();
  const [speechSubscriptionKey] = useSpeechSubscriptionKey();
  const [token] = useDirectLineToken();
  const [transcriptContent] = useTranscriptDialogContent();
  const [userId] = useDirectLineUserId();
  const [version] = useVersion();

  const transcriptContentBlobURL = useMemo(
    () => transcriptContent && URL.createObjectURL(new Blob([transcriptContent], { type: 'application/json' })),
    [transcriptContent]
  );

  const searchParams = useMemo(() => {
    const isDirectLineTokenURL = isURL(secret);
    const isSpeechTokenURL = isURL(speechSubscriptionKey);

    if (protocolDirectLineSpeech && !speechSubscriptionKey && !speechAuthorizationToken) {
      return;
    }

    if (protocolAppServiceExtension && (!token || !domainHost)) {
      return;
    }

    if (protocolTranscript && !transcriptContentBlobURL) {
      return;
    }

    if ((protocolREST || protocolWebSocket) && (isDirectLineTokenURL ? !token : !secret)) {
      return;
    }

    if (isSpeechTokenURL && !speechAuthorizationToken) {
      return;
    }

    return new URLSearchParams({
      v: version,
      p: protocolAppServiceExtension
        ? 'ase'
        : protocolDirectLineSpeech
        ? 'dls'
        : protocolTranscript
        ? 'blob'
        : protocolWebSocket
        ? 'ws'
        : 'rest',

      ...(conversationId ? { cid: conversationId } : {}),

      ...(protocolAppServiceExtension && domainHost ? { dd: domainHost } : {}),
      ...(protocolTranscript ? { blob: transcriptContentBlobURL } : token ? { dt: token } : { ds: secret }),

      ...(speechRegion ? { sr: speechRegion } : {}),
      ...(speechAuthorizationToken
        ? { st: speechAuthorizationToken }
        : speechSubscriptionKey
        ? { sk: speechSubscriptionKey }
        : {}),
      uid: userId

      // ws: protocolWebSocket + '',
      // ...(protocolAppServiceExtension ? { se: domainHost } : {}),
      // ...(speechRegion ? { speechregion: speechRegion } : {}),
      // userid: userId,
      // ...(speechSubscriptionKey ? { speechkey: speechSubscriptionKey } : {})
    });
  }, [
    conversationId,
    domainHost,
    protocolAppServiceExtension,
    protocolWebSocket,
    secret,
    speechAuthorizationToken,
    speechSubscriptionKey,
    speechRegion,
    token,
    transcriptContentBlobURL,
    userId,
    version
  ]);

  const webChatURL = useMemo(() => searchParams && `webchat.html?${searchParams.toString()}`, [searchParams]);

  return webChatURL ? (
    <a href={webChatURL} target="_blank">
      Open Web Chat in a new window
    </a>
  ) : (
    <span>Open Web Chat in a new window</span>
  );
};
export default WebChatLink;