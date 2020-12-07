// Note: Replace the URL with a valid endpoint to retrieve
//       authorization tokens for your subscription.
var authorizationEndpoint = "token.php";

function RequestAuthorizationToken() {
    if (authorizationEndpoint) {
        var a = new XMLHttpRequest();
        a.open("GET", authorizationEndpoint);
        a.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        a.send("");
        a.onload = function () {
            var token = JSON.parse(atob(this.responseText.split(".")[1]));
            serviceRegion.value = token.region;
            authorizationToken = this.responseText;
            subscriptionKey.disabled = true;
            subscriptionKey.value = "using authorization token (hit F5 to refresh)";
            console.log("Got an authorization token: " + token);
        }
    }
}

// status fields and start button in UI
var phraseDiv;
var startRecognizeOnceAsyncButton;

// subscription key and region for speech services.
var subscriptionKey, serviceRegion;
var authorizationToken;
var SpeechSDK;
var recognizer;

document.addEventListener("DOMContentLoaded", function () {
    startRecognizeOnceAsyncButton = document.getElementById("startRecognizeOnceAsyncButton");
    subscriptionKey = document.getElementById("subscriptionKey");
    serviceRegion = document.getElementById("serviceRegion");
    phraseDiv = document.getElementById("phraseDiv");

    startRecognizeOnceAsyncButton.addEventListener("click", function () {
        startRecognizeOnceAsyncButton.disabled = true;
        phraseDiv.innerHTML = "";

        // if we got an authorization token, use the token. Otherwise use the provided subscription key
        var speechConfig;
        if (authorizationToken) {
            speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(authorizationToken, serviceRegion.value);
        } else {
            if (subscriptionKey.value === "" || subscriptionKey.value === "subscription") {
                alert("Please enter your Microsoft Cognitive Services Speech subscription key!");
                return;
            }
            speechConfig = SpeechSDK.SpeechConfig.fromSubscription(subscriptionKey.value, serviceRegion.value);
        }

        speechConfig.speechRecognitionLanguage = "fr-FR";
        var audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        //var audioConfig = SpeechSDK.AudioConfig.fromStreamInput()
        recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
        recognizer.startContinuousRecognitionAsync();
        speechConfig.enableDictation(); // enable vocal ponctuation

        // custom words and sentences
        const phraseList = SpeechSDK.PhraseListGrammar.fromRecognizer(recognizer);
        phraseList.addPhrase("une API");
        phraseList.addPhrase("AWS");
        phraseList.addPhrase("HTML");
        phraseList.addPhrase("CSS 3");
        phraseList.addPhrase("framework");
        phraseList.addPhrase("javascript");
        phraseList.addPhrase("le back");
        phraseList.addPhrase("le backend");
        phraseList.addPhrase("OVH");
        phraseList.addPhrase("React");

        recognizer.recognizing = (s, e) => {
            console.log(`RECOGNIZING: Text=${e.result.text}`);
            phraseDiv.innerHTML = e.result.text;
        };

        recognizer.canceled = (s, e) => {
            console.log(`CANCELED: Reason=${e.reason}`);

            if (e.reason == CancellationReason.Error) {
                console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
                console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                console.log("CANCELED: Did you update the subscription info?");
            }

            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.sessionStopped = (s, e) => {
            console.log("\n    Session stopped event.");
            recognizer.stopContinuousRecognitionAsync();
        };
    });

    if (!!window.SpeechSDK) {
        SpeechSDK = window.SpeechSDK;
        startRecognizeOnceAsyncButton.disabled = false;

        document.getElementById('content').style.display = 'block';
        document.getElementById('warning').style.display = 'none';

        // in case we have a function for getting an authorization token, call it.
        if (typeof RequestAuthorizationToken === "function") {
            RequestAuthorizationToken();
        }
    }
});
