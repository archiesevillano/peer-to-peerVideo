'use strict';

const mediaStreamConstraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 }
    },
    audio: true
};
const offerOptions = { offerToReceiveVideo: 1 };
const servers = { 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] };

// video screens
const localScreenVideo = document.getElementById('localScreen');
const remoteScreenVideo = document.getElementById('remoteScreen');
localScreenVideo.style.display = "none";
remoteScreenVideo.style.display = "none";

// video cameras
const localCameraVideo = document.getElementById("localCameraVideo");
const remoteCameraVideo = document.getElementById("remoteCameraVideo");

//Media Button Group icons
const screenShareIcon = document.querySelector(".screenShareIcon");
const micIcon = document.querySelector(".micIcon");
const camIcon = document.querySelector(".camIcon");
const disconnectIcon = document.querySelector(".disconnectIcon");

const localOffer = document.getElementById('localOffer');
const remoteOffer = document.getElementById('remoteOffer');
const createOffer = document.getElementById('createOffer');
const acceptOffer = document.getElementById('acceptOffer');

const localAnswer = document.getElementById('localAnswer');
const remoteAnswer = document.getElementById('remoteAnswer');
const acceptAnswer = document.getElementById('acceptAnswer');

const localMedia = document.querySelector(".localMedia");
const remoteMedia = document.querySelector(".remoteMedia");
remoteMedia.style.display = "none"; //hide the screen two when connection is not established yet
const grid = document.querySelector(".videoGrid"); // the container that holds the video 1 and 2
grid.style.gridTemplateColumns = "1fr"; //set to one column only while the connection is not yet made or established
const splashScreen = document.querySelector(".splashScreen");
const appHeader = document.querySelector(".appHeader");

// media button groups
const shareScreenBtn = document.querySelector(".screenShare"); //screenshare Button
const micBtn = document.querySelector(".mic"); //microphone Button
const camBtn = document.querySelector(".cam"); //Camera Button
const disconnectBtn = document.querySelector(".x"); //Disconnect Button

// copy offer button and its tooltip
const copySDPBtn = document.querySelector(".copyOfferBtn");
const copySDPBtnTooltip = document.querySelector(".copyBtnToolTip");
const copySDPIcon = document.querySelector(".copySDPIcon");
const copyAnswerBtn = document.querySelector(".copyAnswerBtn");
const copyAnswerBtnToolTip = document.querySelector(".copyAnswerBtnToolTip");
const copyAnswerIcon = document.querySelector(".copyAnswerIcon");
const createIcon = document.querySelector(".createIcon");

const offerItem = document.querySelector(".offerItem");
const answerItem = document.querySelector(".answerItem");
const joinBtn = document.querySelector(".joinBtn");
const joinSection = document.querySelector(".joinSection");
const openConnectionSection = document.querySelector(".openConnectionSection");

// Create peer connections and add behavior.
const peerConnection = new RTCPeerConnection(servers);
console.log('Created peer connection');

const peerMediaStream = new MediaStream();

const init = async () => {

    copySDPBtn.addEventListener('click', handleCopyOffer);
    copyAnswerBtn.addEventListener('click', handleCopyAnswer);
    joinBtn.addEventListener('click', handleShowJoin);

    // onClick listeners
    camBtn.addEventListener('click', () => handleToggles("cam"));
    micBtn.addEventListener('click', () => handleToggles("mic"));
    disconnectBtn.addEventListener('click', handleDisconnect);

    //	assign click handlers to each button
    createOffer.addEventListener('click', offerCreate);
    acceptOffer.addEventListener('click', offerAccept);
    acceptAnswer.addEventListener('click', answerAccept);

    peerConnection.addEventListener('icecandidate', handleConnection);
    peerConnection.addEventListener('track', gotRemoteMediaStream);

    // check if screen is shared
    checkStream();

    handleShareCamera();
}

peerConnection.onconnectionstatechange = (event) => {
    checkConnection();
}

const checkConnection = () => {
    if (peerConnection.iceConnectionState === "connected" || peerConnection.iceConnectionState === "completed") {
        remoteMedia.style.display = "block";
        grid.style.gridTemplateColumns = "1fr 1fr";
    }
    else {
        // hide the remote video and make 1 column
        remoteMedia.style.display = "none";
        grid.style.gridTemplateColumns = "1fr";
    }
}

const handleCopyOffer = async () => {
    // copy sdp in clipboard
    try {
        navigator.clipboard.writeText(localOffer.value);
        copySDPBtnTooltip.style.left = "-10px";
        copySDPBtnTooltip.textContent = "Copied";
        copySDPIcon.className = "fa-solid fa-check copySDPIcon";
        setTimeout(() => {
            copySDPBtnTooltip.style.left = "-3px";
            copySDPBtnTooltip.textContent = "Copy";
            copySDPIcon.className = "fa-solid fa-copy copySDPIcon";
        }, 10000);

        // show accept answer section when the user clicked the create offer button
        openConnectionSection.style.display = "block";
        setTimeout(() => {
            openConnectionSection.style.opacity = "1";
        }, 500);
    }
    catch (error) {
        console.log(error);
    }
}

const handleCopyAnswer = async () => {
    // copy sdp in clipboard
    try {
        navigator.clipboard.writeText(localAnswer.value);
        copyAnswerBtnToolTip.style.left = "-10px";
        copyAnswerBtnToolTip.textContent = "Copied";
        copyAnswerIcon.className = "fa-solid fa-check copyAnswerIcon";
        setTimeout(() => {
            copyAnswerBtnToolTip.style.left = "-3px";
            copyAnswerBtnToolTip.textContent = "Copy";
            copySDPIcon.className = "fa-solid fa-copy copyAnswerIcon";
        }, 10000);

        setTimeout(() => {
            handleStartVideo();
        }, 5000);
    }
    catch (error) {
        console.log(error);
    }
}

const handleConnection = (event) => {
    const connection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate == null) {
        const description = connection.localDescription;
        const descriptionType = description.type;
        const descriptionString = JSON.stringify(description);

        if (descriptionType == 'offer') {
            localOffer.value = descriptionString;
            if (localOffer.value) {
                offerItem.style.display = "flex";
                createOffer.style.width = "250px";

                setTimeout(() => {
                    createOffer.textContent = "Created Successfully";

                    const icon = document.createElement("i");
                    icon.className = "fa-solid fa-check createIcon";
                    createOffer.prepend(icon);
                }, 500);

                createOffer.classList.add("clicked");

                // hide join when local offer is created
                joinBtn.style.display = "none";
            }
            else {
                createOffer.textContent = "Create";
                createOffer.classList.remove("clicked");

                const icon = document.createElement("i");
                icon.className = "fa-solid fa-plus createIcon";
                createOffer.prepend(icon);
            }
        }
        else if (descriptionType == 'answer') {
            localAnswer.value = descriptionString;

            if (localAnswer.value) {
                answerItem.style.display = "flex";
                joinSection.style.transform = "translateY(-100px)";
                joinSection.style.opacity = "0";
                setTimeout(() => {
                    joinSection.style.display = "none";
                }, 500);

                createOffer.classList.add("clicked");

                // hide join when local offer is created
                joinBtn.style.display = "none";
            }

        }
    }

    if (peerConnection.iceConnectionState == "closed" && peerConnection.iceConnectionState == "failed") {
        localCameraVideo.srcObject = null;
        remoteCameraVideo.srcObject = null;
        remoteScreenVideo.srcObject = null;
        localScreenVideo.srcObject = null;
        console.log("Connection closed");
        setTimeout(() => {
            handleClose();
        }, 1000);
    }
}

const handleShowJoin = () => {
    joinSection.style.display = "block";
    joinBtn.style.width = "250px";
    createOffer.style.display = "none";

    setTimeout(() => {
        joinBtn.textContent = "Search for a host";
        const icon = document.createElement("i");
        icon.className = "fa-solid fa-magnifying-glass";
        joinBtn.prepend(icon);

    }, 500);

    joinBtn.classList.add("clicked");
}

const gotRemoteMediaStream = (event) => {
    console.log("new Track Added!");
    console.log(event.streams[0]);
    const mediaStream = event.streams[0];
    mediaStream.getTracks().forEach(track => console.log(track));
    mediaStream.getTracks().forEach(track => {
        if (remoteCameraVideo.srcObject !== null) {
            remoteScreenVideo.srcObject = mediaStream;
        }
        else if (track.kind == "video") {
            remoteCameraVideo.srcObject = mediaStream;
        }
    });

    console.log(mediaStream.getVideoTracks());

    if (mediaStream.getVideoTracks() > 1) {
        remoteCameraVideo.srcObject = mediaStream.getVideoTracks()[0];
        remoteScreenVideo.srcObject = mediaStream.getVideoTracks()[1];
    }



    checkStream();
}

const offerCreate = async () => {

    try {
        const description = await peerConnection.createOffer(offerOptions);
        createdOffer(description);
    }
    catch (error) {
        console.log(error);
    }

}

const createdOffer = async (description) => {

    if (peerConnection.localDescription === null) {
        try {
            await peerConnection.setLocalDescription(description);
        }
        catch (error) {
            console.log(error);
        }
    }
    else {
        console.log("Local Description is already set");
    }

}

const offerAccept = async () => {

    const description = JSON.parse(remoteOffer.value);

    if (peerConnection.remoteDescription === null) {
        try {
            await peerConnection.setRemoteDescription(description);
            const remoteAnswer = await peerConnection.createAnswer();
            createdAnswer(remoteAnswer);
        }
        catch (error) {
            console.log(error);
        }
    }
    else {
        console.log("Remote Description is already set");
    }

}

const createdAnswer = async (description) => {

    try {
        await peerConnection.setLocalDescription(description);
    }
    catch (error) {
        console.log(error);
    }

}

const answerAccept = async () => {
    const description = JSON.parse(remoteAnswer.value);
    try {
        if (peerConnection.remoteDescription && peerConnection.remoteDescription.type === "answer") {
            console.log("Answer is already set!");
        }
        else {
            await peerConnection.setRemoteDescription(description);
            setTimeout(() => {
                handleStartVideo();
            }, 500);
        }
    }
    catch (error) {
        console.log(error);
    }
}

const handleStopCamera = async () => {
    const mediaStream = localCameraVideo.srcObject;

    //check if mediaStream exists
    if (mediaStream) {
        const tracks = mediaStream.getTracks();

        tracks.forEach(track => {
            if (track.kind === 'video') {
                track.stop();
                localCameraVideo.srcObject = null;
            }
        });
    }
}

const handleMuteMic = async () => {
    const mediaStream = localCameraVideo.srcObject;

    if (mediaStream) {
        const audioTrack = mediaStream.getTracks().find(track => track.kind === 'audio');
        audioTrack.enabled = false;
    }
}

const handleUnmuteMic = async () => {
    const mediaStream = localCameraVideo.srcObject;

    if (mediaStream) {
        const audioTrack = mediaStream.getTracks().find(track => track.kind === 'audio');
        audioTrack.enabled = true;
    }
}

const isCameraMuted = (mediaStream) => {
    const audioTracks = mediaStream.getAudioTracks();

    return !audioTracks.some(track => track.enabled);
}

const handleToggles = componentName => {
    switch (componentName) {
        case "mic":
            if (isCameraMuted(localCameraVideo.srcObject)) {
                console.log("Unmute mic");
                micIcon.className = "fa-solid fa-microphone micIcon";
                handleUnmuteMic();
            }
            else {
                console.log("Mute Mic");
                micIcon.className = "fa-solid fa-microphone-slash micIcon";
                handleMuteMic();
            }
            break;
        case "cam":
            if (localCameraVideo.srcObject instanceof MediaStream) {
                camIcon.className = "fa-solid fa-video-slash camIcon";
                handleStopCamera();
            }
            else {
                camIcon.className = "fa-solid fa-video camIcon";
                handleShareCamera();
            }
            break;
        case "disconnect":

            break;
    }
}

const handleShareCamera = async () => {
    try {
        // get the video media stream
        const mediaStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
        mediaStream.getTracks().forEach(track => console.log(track.label));
        const audioTracks = mediaStream.getAudioTracks();

        // enabled echo cancellation
        if (audioTracks.length > 0) {
            const audioTrack = audioTracks[0];
            const echoCancellation = audioTrack.getSettings().echoCancellation;

            if (!echoCancellation) {
                const constraints = { echoCancellation: true };

                await audioTrack.applyConstraints(constraints);
                console.log("Apply Echo Cancellation");
            }
            else {
                console.log(echoCancellation);
            }

        }

        localCameraVideo.srcObject = mediaStream;

        for (const track of mediaStream.getTracks()) {
            peerMediaStream.addTrack(track);
            peerConnection.addTrack(track, peerMediaStream);
            console.log("Camera Added!");
        }

        const mediaStream2 = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });

        localScreenVideo.srcObject = mediaStream2;
        for (const track of mediaStream2.getVideoTracks()) {
            peerMediaStream.addTrack(track);
            peerConnection.addTrack(track, peerMediaStream);
            console.log("Screenshare Added!");
        }

        checkStream();

    }
    catch (error) {
        console.log(error);
    }
}

const checkStream = () => {
    const videoElements = [
        localScreenVideo,
        remoteScreenVideo,
    ];

    videoElements.forEach(video => {
        if (video.srcObject instanceof MediaStream) {
            video.style.display = "block";
        }
        else {
            video.style.display = "none";
        }
    });
}

const handleDisconnect = () => {
    if (peerConnection.iceConnectionState !== "closed" && peerConnection.iceConnectionState !== "failed") {
        peerConnection.close();
    }
    // after closing the connection, check it again if it is already closed
    checkConnection();
}

const handleStartVideo = () => {
    appHeader.style.height = "50px";
    appHeader.style.alignItems = "flex-start";
    appHeader.style.backgroundColor = "#111111";
    splashScreen.style.opacity = "0";
    setTimeout(() => {
        splashScreen.style.display = "none";
    }, 500);
    grid.style.display = "grid";
}

const handleClose = () => {
    appHeader.style.height = "100vh";
    appHeader.style.alignItems = "center";
    appHeader.style.backgroundColor = "#111111";
    splashScreen.style.opacity = "1";
    setTimeout(() => {
        splashScreen.style.display = "flex";
        location.reload();
    }, 500);
    grid.style.display = "none";
}

function logError(error) {
    console.log({
        remoteDescription: peerConnection.currentRemoteDescription,
        localDescription: peerConnection.currentLocalDescription,
        signalState: peerConnection.signalingState
    })
    console.log(error);
    console.log(error.toString());
}

// initialize web app
init();


// NOTE:

// The problem is coming from the MediaStreamTrack. Multiple video tracks are being added one for LocalScreen and one for LocalCamera.
// But when accessing it via remoteStream, it seems like there's no LocalScreen track added in the stream. I have researched about it but there's just less resource about WebRTC online.
// I am still working with it by reading the documentation.

// Second issue is the existing methods or feature here that I modified has been tagged as 'deprecated' or no longer recommended to use
// In terms of performance, one big factor is the internet connection. There are times that the remote video is not being displayed or being added to the stream , so the page needs to reload
// I will work on it so i can add it to my portfolio