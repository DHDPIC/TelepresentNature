// AR AR AR AR

// create a variable to hold our world object
let world;

// create a variable to hold our marker
let marker;

// create some off screen graphics buffers to serve as dynamic textures
let buffer1, buffer2;

let myText;
let myTemperature;
let myAltitude;

let floatingCube;

// TOIO TOIO TOIO
const connectedCubeArray = [];

const dataXArray = [100,150,200];
const dataYArray = [100,200,150];
let d = 0;
let t = 0;
let f = 180;

let table;

let dataTArray = [20,20,20];
let dataAArray = [20,20,20];

let cold;
let hot;

let cubeColor;


// MQTT MQTT MQTT
// variable to hold an instance of the p5.webserial library:
//const serial = new p5.WebSerial();
 
// HTML button object:
let portButton;
let inData;                   // for incoming serial data
let outByte = 0;              // for outgoing data

// MQTT client details:
let broker = {
  hostname: 'physicaltelepresence.cloud.shiftr.io',
  //hostname: 'telepresence01.cloud.shiftr.io',
  port: 443
};

// MQTT client:
let client;
// client credentials:
// For shiftr.io, use try for both username and password
// unless you have an account on the site. 
let creds = {
  clientID: '  _telePresenceD',
  // userName: 'telepresence01',
  // password: 'RAosUvtArFW9siwz'
  userName: 'physicaltelepresence',
  password: 'telepresence2023'
}
// topic to subscribe to when you connect
// For shiftr.io, use whatever word you want
// unless you have an account on the site. 
// Make sure to modify the topic names below
// You can't use special characters,  
let sendTopic = '_davidNOT/PotentiometerValue/';
let listenTopic = '_david/PotentiometerValue/';

// HTML divs for local and remote messages
let localDiv;
let remoteDiv;
//let potSensorDiv;

let lastTimeSent = 0;
const sendInterval = 100;

let finalTemp = 0;
let finalAlti = 0;
let finalColo;


function setup() {
  createCanvas(100,100);//createCanvas(windowWidth, windowHeight);
  background(220);
  
  // AR AR AR
  // create our world (this also creates a p5 canvas for us)
  world = new World('ARScene');

  // grab a reference to the marker that we set up on the HTML side (connect to it using its 'id')
  marker = world.getMarker('hiro');
  
  // create a dynamic texture for our base plane (A-Frame likes these texture to be sized using powers of 2)
  buffer1 = createGraphics(256, 256);
  buffer1.background(128,128,128);
  
  // register this texture as a dynamic (updatable) texture
  let texture1 = world.createDynamicTextureFromCreateGraphics(buffer1);

 
  
  // create another texture to be used on different entities
  buffer2 = createGraphics(256,256);
  buffer2.background(0);

  // register this texture as a dynamic (updatable) texture
  let texture2 = world.createDynamicTextureFromCreateGraphics(buffer2);

   // create some geometry to add to our marker
  // the marker is 1 meter x 1 meter, with the origin at the center
  // the x-axis runs left and right
  // -0.5, 0, -0.5 is the top left corner
  let basePlane = new Plane({
	  width: 1, height: 1,
	  x: 0, y: 0, z: 0,
	  rotationX: 0,
	  asset: texture2,
	  dynamicTexture: true,
	  dynamicTextureWidth: 256,
	  dynamicTextureHeight: 256
  });
  // don't add the plane
  //marker.add(basePlane);
  
  // create a cube above the marker to use this texture
  floatingCube = new Box({
	  width: 3, height: 3, depth: 3,
	  x: 0, y: 1, z: 0,
	  asset: texture2,
	  dynamicTexture: true,
	  dynamicTextureWidth: 256,
	  dynamicTextureHeight: 256
  });
  marker.add(floatingCube);

  //
  myText = "hello";
  myTemperature = 30;
  myAltitude = 100;

  cubeColor = color(0,0,0);
  finalColo = color(0,0,0);
  
  
  // TOIO TOIO TOIO
  colorMode(RGB);
  cold = color(0,150,255);
  hot = color(255,100,0);
  //
  print(table.getRowCount() + ' total rows in table');
  print(table.getColumnCount() + ' total columns in table');
  print(table.getColumn('external-temperature'));
  //
  for (let r = 0; r < table.getRowCount(); r++) {
    
    let lng = table.getNum(r,0);
    let lat = table.getNum(r,1);
    if(lng == 0) {
      lng = 10.9;
      lat = 45.9;
    }
    let lngMapped = map(lng,10.9,11.1,100,400);
    let latMapped = map(lat,45.9,46.1,100,400);
    dataXArray[r] = lngMapped;
    dataYArray[r] = latMapped;
    
    // temperature
    let tmp = table.getNum(r,2);
    dataTArray[r] = tmp;
    
    let alt = table.getNum(r,3);
    dataAArray[r] = alt;
  }
  
  // text
  textFont('Unbounded');
  textSize(width / 4);
  textAlign(CENTER, CENTER);

  // MQTT MQTT MQTT
  // Create an MQTT client:
  client = new Paho.MQTT.Client(broker.hostname, broker.port, creds.clientID);
  // set callback handlers for the client:
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;
  // connect to the MQTT broker:
  client.connect(
      {
          onSuccess: onConnect,       // callback function for when you connect
          userName: creds.userName,   // username
          password: creds.password,   // password
          useSSL: true                // use SSL
      }
  );
  // create a div for local messages:
  localDiv = createDiv('Waiting to send via MQTT');
  localDiv.position(20, 20);
  localDiv.id("mqtt-send");

  // create a div for the response:
  remoteDiv = createDiv('Waiting to receive from MQTT');
  remoteDiv.position(20, 40);
  remoteDiv.id("mqtt-listen");
  
  //potSensorDiv = createDiv('Local potentiometer data');
  //potSensorDiv.position(20, 280);
  
  // check to see if serial is available:
  /*
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is available, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);
  */
}


function preload() {
  //my table is comma separated value "csv"
  //and has a header specifying the columns labels
  table = loadTable('assets/deertest.csv', 'csv', 'header');
  //the file can be remote
  //table = loadTable("http://p5js.org/reference/assets/mammals.csv",
  //                  "csv", "header");
}


function draw() {
  
  // update the texture on buffer1 over time
  buffer1.fill(random(255),random(255),random(255));
  buffer1.ellipse(random(255),random(255),20,20);
  buffer1.textSize(32);
  buffer1.text(myText,50,50);

  
  // update the texture on buffer2 over time
  //buffer2.fill(random(255),random(255),random(255));
  //buffer2.rect(random(255),random(255),random(50), random(50));
  //buffer2.background(cubeColor);
  buffer2.background(finalColo);
  //buffer2.clear();
  //buffer2.fill(random(255),random(255),random(255));
  buffer2.fill(255,255,255);
  buffer2.textFont('Unbounded');
  buffer2.textSize(48);
  buffer2.textAlign(CENTER,CENTER);
  buffer2.text(myText,128,128);

  myAltitude++;
  //myTemperature = int(random(-5,25));
  //myText = myTemperature + "°C \n" + myAltitude + "ft";
  myText = finalTemp + "°C \n" + finalAlti + "ft";

  //floatingCube.setY(myAltitude/1000.0);
  floatingCube.setY(Number(finalAlti)/1000.0);
  //console.log(floatingCube.y)
  
  // TOIO
  scrollPlay();

  let messageToSend = myTemperature.toString() + "|" + myAltitude.toString() + "|" + red(cubeColor) + "|" + green(cubeColor) + "|" + blue(cubeColor);

  sendMqttMessage(messageToSend);
  


  //print(cubeP?.x + ", " + cubeP?.y);
        
  
}

function timePlay() {
  
  const cubeP = connectedCubeArray[0];
  const cubeQ = connectedCubeArray[1];

  // Keep on chasing the othre Cube
  const moveType = P5tCube.moveTypeId.withoutBack;
  const spd = 50;
  //cubeP?.moveToCube( cubeQ, spd, moveType );
  
  //let xPos = random(50,400);
  let xPos = dataXArray[d];
  let yPos = dataYArray[d];
  
  cubeP?.moveTo( {x:xPos, y:yPos}, spd );

  // reset counter
  t++;
  if(t>f) {
    d++;
    t=0;
    if(d>=dataXArray.length) {
      d = 0;
    }
  } 
}

function scrollPlay() {
  const cubeP = connectedCubeArray[0];
  const cubeQ = connectedCubeArray[1];

  // Keep on chasing the othre Cube
  const moveType = P5tCube.moveTypeId.withoutBack;
  const spd = 50;
  //cubeP?.moveToCube( cubeQ, spd, moveType );
  
  //d = 0;
  let inc = 400/(dataXArray.length-1);
  let uD = 0;
  
  if(connectedCubeArray.length>1) {
    uD = cubeQ?.x;
    if(uD === undefined) {
      print("this is undefined!!!");
    } else {
      d = uD;
      d = floor( min(d,400) /inc);
    }
  } else {
    print("no interface");
  }
  
  let xPos = dataXArray[d];
  let yPos = dataYArray[d];
  
  print("tx:" + uD + " || i:" + d + " || dataX:" + xPos + " || dataY:" + yPos);
  
  cubeP?.moveTo( {x:xPos, y:yPos}, spd );

  // display on p5
  let temperature = dataTArray[d];
  let tempMap = map(temperature, -7,49,0,1);
  let c = lerpColor(cold, hot, tempMap);
  //-//background(c);
  cubeColor = c;
  myTemperature = temperature;
  
  // text
  let altitude = dataAArray[d];
  fill(255);
  textSize(width/4);
  //text(temperature+'°C', 0, 0, width,height);
  textSize(width/6);
  //text(altitude+'ft', 0, 200, width,height);
  myAltitude = altitude;
}

function mouseClicked() {
  P5tCube.connectNewP5tCube().then( cube => {
    connectedCubeArray.push( cube );
		cube.turnLightOn( 'white' );
  } );
}

// MQTT MQTT MQTT
// if there's no port selected, 
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}
 
// make the port selector window appear:
function choosePort() {
  if (portButton) portButton.show();
  serial.requestPort();
}
 
// open the selected port, and make the port 
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial);
 
  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}
 
// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}

// read any incoming data as a string
// (assumes a newline at the end of it):
function serialEvent() {
  
  // read a byte from the serial port, convert it to a number:
  let inData = serial.readLine();
  //potSensorDiv.html('Local potentiometer: ' + inData);
  
  //console.log(inData);
  // send it as an MQTT message to the topic:
  if (inData && millis() - lastTimeSent > sendInterval) {
      sendMqttMessage(inData);
      lastTimeSent = millis();
  }
}
 
// try to connect if a new serial port 
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}
 
// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}
 
function closePort() {
  serial.close();
}

// called when the client connects
function onConnect() {
    //console.log("mqtt client is connected");
    localDiv.html('client is connected');
    client.subscribe(listenTopic);
}

// called when the client loses its connection
function onConnectionLost(response) {
    if (response.errorCode !== 0) {
        //console.log(response.errorMessage);
        localDiv.html('onConnectionLost:' + response.errorMessage + "<br> You are likely getting this message because you have <br> not modified the topic names in Line 29 onwards yet.");
    }
}

// called when a message arrives
function onMessageArrived(message) {
    // update the GUI text with the message
    remoteDiv.html('Listening: ' + message.payloadString);

    let myReceivedMessage = message.payloadString;
    const myArray = myReceivedMessage.split("|");
    console.log(myArray[0]);
    finalTemp = myArray[0];
    finalAlti = myArray[1];
    let r = Number(myArray[2]);
    let g = Number(myArray[3]);
    let b = Number(myArray[4]);

    finalColo = color(r,g,b);

  
    // send the message to the Arduino
    //serial.print(message.payloadString);
  
    // We could also parse the message and do something with the data
    // assume the message payload is a JSON object
    // From the Arduino example in this folder:
    // {"angle":angle}
    try {
      var pot = JSON.parse(message.payloadString);
      backGroundColor = pot.angle;//color(255,255,255-pot.angle);
      serial.write(backGroundColor);
    } catch (error) {
     console.log("malformed JSON");
    }
    
}

// called when you want to send a message:
function sendMqttMessage(msg) {
    // if the client is connected to the MQTT broker:
    if (client.isConnected()) {
        // start an MQTT message:
        message = new Paho.MQTT.Message(msg);
        // choose the destination topic:
        message.destinationName = sendTopic;
        // send it:
        client.send(message);
        // print what you sent:
        localDiv.html('Sending: ' + message.payloadString);
        //console.log('I sent: ' + message.payloadString);
        //console.log(".");
    }
}