//=================================== SFX =================================
var audio = new Audio("assets/sounds/button.mp3");
var audioUpload = new Audio("assets/sounds/buttonTwo.wav");

//=========================================== Webcam (WebRTC)====================================

var video = document.querySelector("#video"),
  canvas = document.querySelector("#canvas"),
  context = canvas.getContext("2d"),
  photo = document.querySelector("#photo");

var constraints = {
  audio: false,
  video: {
    width: 320,
    height: 240
  }
};

navigator.mediaDevices
  .getUserMedia(constraints)
  .then(function(mediaStream) {
    video.srcObject = mediaStream;
    video.onloadedmetadata = function(e) {
      video.play();
    };
  })
  .catch(function(err) {
    // Old browser support?
    navigator.getMedia =
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia || // Mozilla
      navigator.msGetUsermedia; // Microsoft IE
    navigator.getMedia(
      {
        video: true,
        audio: false // No need to capture audio
      },
      function(stream) {
        video.srcObject = stream;
        video.play();
      },
      function(err) {
        console.log(err);
      }
    );
  });
var blob;

document.querySelector("#capture").addEventListener("click", function() {
  
  audio.play();
  //What I want to draw on
  // (video, IDK, IDK, width, height)
  context.drawImage(video, 0, 0, 320, 240);

  // Grab from the canvas and placing into the photo src, which is the link and where the picture is saved.
  // The src of the file is transferred to "data:image/png;base64[picture's code]"
  // For example, take a picture. Right-click on the pic and you can see its address
  //              bar when you open it in a new tab; however, you cannot copy its image address.
  // The ".toDataURL" spits out base64 code which will be attached to the source
  photo.setAttribute("src", canvas.toDataURL("image/jpeg", 1.0));

  // console.log(photo);
  var b64Data = canvas.toDataURL("image/jpeg", 1.0);

  function b64toBlob(b64Data) {
    // console.log(b64Data);
    var byteString = atob(b64Data.split(",")[1]);
    // console.log(byteString);
    var ab = new ArrayBuffer(byteString.length);
    // console.log(ab);
    var ia = new Uint8Array(ab);
    // console.log(ia);

    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    blob = new Blob([ab], { type: "image/jpeg" });
    return;
  };
  b64toBlob(b64Data);

  uploadFile();
});

//==============================================Initialize Firebase==================================================
var config = {
  apiKey: "AIzaSyCyH6JqbOa6Ps_v0IMcyedDvoFzUAkhRds",
  authDomain: "https://mood-and-music.firebaseapp.com",
  databaseURL: "https://mood-and-music.firebaseio.com",
  storageBucket: "mood-and-music.appspot.com"
};

// I needed to make these variables global so we can access the url outside of the function later
var downloadURL;
var file;
var storageRef;
var thisRef;
var fileUploaded = false;
var urlRetrieved = false;
var mood;
var name;
var artistName;
var previewURL;
var albumName;

firebase.initializeApp(config);

// Function to save file. Called when button is clicked
function uploadFile() {

  file = $("#files").get(0).files[0];
  // console.log(blob);

  var uploadFileName;
  if (file === undefined) {
    file = blob;
    uploadFileName = "placeholder";
  } else {
    uploadFileName = file.name;
  }

  // Another variable called "name"
  // if file is undefined, create a random name
  //otherwise, name will equal file.name

  if (file !== undefined) {
    storageRef = firebase.storage().ref();
    thisRef = storageRef.child(uploadFileName);
    // console.log(thisRef);

    // Upload file to Firebase storage
    thisRef
      .put(file)
      .then(function(snapshot) {
        fileUploaded = !fileUploaded;
        console.log("File Uploaded");
        retrieveUrl();
      })
      .catch(err => {
        console.log(err);
      });
  }

  // Retrieve URL for uploaded file
  function retrieveUrl() {
    audioUpload.play();
    if (fileUploaded) {
      thisRef
        .getDownloadURL()
        .then(function(url) {
          downloadURL = url;
          fileUploaded = !fileUploaded;
          urlRetrieved = !urlRetrieved;
          console.log("URL Retrieved");
          emotionDetect();
        })
        .catch(err => {
          console.log(err);
        });
    }
  }

  //======================================== ParallelDots ===========================================
  // Ajax call using url as source for detection
  function emotionDetect() {
    if (urlRetrieved) {
      var dotsAPIkey = "Cr6V9f2rl8RJDzQQp1ZFRwosg73K8k0MOcOCf4d119E";
      $.ajax({
        url:
          "https://apis.paralleldots.com/v3/facial_emotion?api_key=" +
          dotsAPIkey +
          "&url=" +
          downloadURL,
        method: "POST"
      }).then(function(response) {
        // console.log(response.code);
        if (response.code >= 400 || response.output === "No face detected.") {
          console.log("You are probably a robot with no emotions");
          $(".preview")
            .empty()
            .hide("scale");
          let e = $('<br><p class="errBox white-text">');
          $(".preview")
            .append(e)
            .show("scale", 1050);
          e.html(
            "You're probably an emotionless robot. Please upload another image file with a headshot and sufficient lighting."
          );
        } else if (response.code === 403) {
          dotsAPIkey = "n3yLuB3RxgDcj5DYAxaxtqxbNqtszhif3dvP4wtrtYE";
          $(".preview")
            .empty()
            .hide("scale");
          let e = $('<br><p class="errBox white-text">');
          $(".preview")
            .append(e)
            .show("scale", 1050);
          e.html("API key changed, please try again.");
        } else {
          console.log(response.facial_emotion[0].tag);
          mood = response.facial_emotion[0].tag;
          retrieveSong();
        }
      });
      urlRetrieved = !urlRetrieved;
    }
  }

  //======================================= Napster ==============================================
  var apikey = "apikey=NDU0ZjU2ZWMtMjVhMS00NmNlLWI3NWItYTdlNTc5ODdkMzNk";
  var trackID;

  // Match mood to appropriate music choice
  function retrieveSong() {
    switch (mood) {
      case "Angry":
        trackID = "tra.128493454";
        break;
      case "Fear":
        trackID = "tra.268797739";
        break;
      case "Neutral":
        trackID = "tra.305200130";
        break;
      case "Surprise":
        trackID = "tra.41390755";
        break;
      case "Sad":
        trackID = "tra.2732140";
        break;
      case "Happy":
        trackID = "tra.257617960";
        break;
      case "Disgust":
        trackID = "tra.1341825";
        break;
      default:
        console.log("You are a robot with no emotions");
        break;
    }

    // Update queryURL with appropriate trackID
    var queryURL =
      "https://api.napster.com/v2.2/tracks/" + trackID + "?" + apikey;

    $.ajax({
      url: queryURL,
      method: "GET"
    }).then(function(response) {
      var database = response.tracks;
      console.log(database);

      var a = $("<audio controls autoplay>");
      var p = $('<p class="artistInfo center-align white-text">');
      var c = $('<p class="artistInfo center-align white-text">');

      // Empty audio controls before every request so we don't get duplicates
      $(".preview")
        .empty()
        .hide("scale");

      p.html(database[0].name + " by " + database[0].artistName);
      $(".preview")
        .append(p)
        .show("scale", 1050);

      a.attr("src", database[0].previewURL);
      $(".preview")
        .attr("id", "song")
        .append(a)
        .show("scale", 1060);

      c.html(database[0].albumName + " Album").show("scale", 1200);
      $(".preview")
        .append(c)
        .show("scale", 1100);

      localStorage.clear();

      localStorage.setItem("song", database[0].name);
      localStorage.setItem("artist", database[0].artistName);
      localStorage.setItem("url", database[0].previewURL);
      localStorage.setItem("album", database[0].albumName);
    });
  }
}

if (
  localStorage.getItem("song") !== null ||
  localStorage.getItem("artist") !== null ||
  localStorage.getItem("url") !== null ||
  localStorage.getItem("album") !== null
) {
  var p = $("<p>")
    .addClass("artistInfo center-align white-text")
    .html(
      localStorage.getItem("song") + " by " + localStorage.getItem("artist")
    );
  $(".preview")
    .append(p)
    .show("scale", 1050);

  var a = $("<audio controls autoplay>").attr(
    "src",
    localStorage.getItem("url")
  );
  $(".preview")
    .attr("id", "song")
    .append(a)
    .show("scale", 1060);

  var c = $("<p>")
    .addClass("artistInfo center-align white-text")
    .html(localStorage.getItem("album") + " Album")
    .show("scale", 1200);
  $(".preview")
    .append(c)
    .show("scale", 1100);
}
