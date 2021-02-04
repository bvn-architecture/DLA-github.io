//DLA WORKPLACE SETTINGS MODEL//
//MP//

// 01____Global Variables //

var camera, scene, renderer, rectangle, div, controls, manager, mixer, composer, dirLight, tween, coords, ambientlight;
var clock = new THREE.Clock();
camTarget = new THREE.Vector3(0,20,0);
var clips = [];
var clipCount = 0;
var TOD = 15;
var globalPlane;

console.log(workSettingText.length);


// 02____Events //
window.addEventListener( 'resize', onWindowResize, false );
Hammer(document.getElementById('container')).on("doubletap", mixerPlay);
mobileUI();

// 03____Screen Camera Variables //
container = document.getElementById('container');
var aspect = $(container).width() / $(container).height();
var mouseX = 0, mouseY = 0;
var frustumSize = 1000;

// 04____Functions //

init();

function init(){
  
  scene = new THREE.Scene();
  
  //____Camera //
  near = -100; 
  far = 10000;
  camera = new THREE.OrthographicCamera( frustumSize*aspect/-2, frustumSize*aspect/2, frustumSize/2, frustumSize/-2, near, far );
  camera.position.x = 20;
  camera.position.y = 200;
  camera.position.z = -20;
  camera.zoom = 5.5;
  camera.aspect = aspect;
  camera.target = camTarget;
  camera.updateProjectionMatrix();

  //____Environment Map //
  var path = 'texture/';
  var format = '.jpg';
  var envMap = new THREE.CubeTextureLoader().load( [
    path + 'posx' + format, path + 'negx' + format,
    path + 'posy' + format, path + 'negy' + format,
    path + 'posz' + format, path + 'negz' + format
  ] );

  //____GLTF Loader //

  manager = new THREE.LoadingManager();
  var loader = new THREE.GLTFLoader( manager );
  
  var onProgress = function ( xhr ) {
  };
  manager.onProgress = function ( item, loaded, total ) {
    // console.log( Math.round(percentComplete, 2) + '%' );
    // var percentComplete = loaded / total * 100;  
    // document.getElementById("percentComplete").innerHTML=(Math.ceil( percentComplete ) + "%" )
  };
  manager.onLoad = function ( ) {
    clips.forEach((clip) => {
      mixer.clipAction(clip).timeScale = 0;
    });
    animate();

    var coords = { y: 100 }; // Start at (0, 0)
    var tween = new TWEEN.Tween(coords) // Create a new tween that modifies 'coords'.
    tween.to({ y: 40 }, 2500) // Move to (300, 200) in 1 second.
    tween.easing(TWEEN.Easing.Elastic.Out);
    tween.delay(500);
    tween.start(); // Start the tween immediately.
    tween.onUpdate(function(object) {
      var newHeight = coords.y;
      camera.position.y = coords.y;
    });
  };

  loader.load('models/QUT_Diagram_01.glb', function ( gltf ) {
      model = gltf.scene;
      clips = gltf.animations;
      scene.add( model );
      gltf.animations; // Array<THREE.AnimationClip>
      gltf.scene; // THREE.Scene
      gltf.asset; // Object

      gltf.scene.traverse(function(object) {

        if (object instanceof THREE.Mesh){
          object.material.envMap = envMap;
          object.material.envMapIntensity = 0.5;
          object.castShadow = "true";
          object.receiveShadow = "true"
        };

        if (object instanceof THREE.Mesh && (object.material.name =='Roof')) {
          object.material.side = THREE.DoubleSide;
          object.castShadow = "false";
          object.receiveShadow = "false";
          object.material.transparent = "true";
          object.material.opacity = 0.2;
        };
      });

      mixer = new THREE.AnimationMixer(model);
      gltf.animations.forEach((clip) => {
        mixer.clipAction(clip).setLoop( THREE.LoopPingPong, 2 );
        mixer.clipAction(clip).play();
        clips.push(clip);
      });
    },
    function ( xhr ) {
      if ( xhr.lengthComputable ) {
        // var percentComplete = xhr.loaded / xhr.total * 100;
        // console.log( Math.round(percentComplete, 2) + '%' );
        // var percentComplete = xhr.loaded / xhr.total * 100;  
        // document.getElementById("percentComplete").innerHTML=(Math.ceil( percentComplete ) + "%" );
      };
    },
    function ( error ) {
      console.log( 'An error happened'+ error );
    }
  );
  
  //____Light //
  ambientlight = new THREE.AmbientLight( 0x080808, 7 ); 
  dirLight = new THREE.DirectionalLight( 0xFCF8E4, 1 );
  dirLight.shadow.camera.right =  200;
  dirLight.shadow.camera.left = -200;
  dirLight.shadow.camera.top =  200;
  dirLight.shadow.camera.bottom = -200;
  dirLight.position.y = (sunData[TOD].sunPosition.Y);
  dirLight.position.x = (sunData[TOD].sunPosition.X);
  dirLight.position.z = -(sunData[TOD].sunPosition.Z);
  dirLight.rotation.y = Math.PI / 18;
  dirLight.shadow.mapSize.width = 2048 * 1;
  dirLight.shadow.mapSize.height = 2048 * 1;
  dirLight.shadow.camera.near = 0;
  dirLight.shadow.camera.far = 1500;
  dirLight.bias = 0.0001;
  dirLight.castShadow = true;
  scene.add(dirLight.target);
  scene.add(dirLight);
  scene.add(ambientlight);
  
  //____Renderers //
  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.shadowMap.enabled = true;
  renderer.gammaOutput = true;
  renderer.gammaFactor = 2.2;
  renderer.localClippingEnabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.autoClear = false;
  renderer.domElement.style.zIndex = 2;
  setPixelRatio();
  container = document.getElementById('container');
  renderer.setSize($(container).width(), $(container).height());
  container.appendChild(renderer.domElement);

  //____Controls //
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.rotateSpeed = 0.5;
  controls.enablePan = false;
  controls.maxZoom = 10;
  controls.minZoom = 3;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI/2; 
  controls.enableRotate = true;
  controls.target = new THREE.Vector3(0, camTarget.y, 0);
  controls.update();

};


function animate(){
  var time2 = Date.now() * 0.002;
  TWEEN.update();
  camera.updateProjectionMatrix();
  controls.update();
  var delta = 0.65 * clock.getDelta();
  mixer.update(delta);
  renderer.render(scene, camera);
  window.requestAnimationFrame( animate );
}; 


function mixerPlay(event){
  clipCount += 1;

  if (clipCount == 1){
    clips.forEach((clip) => {
      mixer.clipAction(clip).timeScale = 1;
      mixer.clipAction(clip).clampWhenFinished = true;
    })
  } else {
    clips.forEach((clip) => {
      mixer.clipAction(clip).reset();
      mixer.clipAction(clip).clampWhenFinished = true;
    })
  }

  clips.forEach((clip) => {
    mixer.clipAction(clip).timeScale = 1;
    mixer.clipAction(clip).clampWhenFinished = true;
  });
};


function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};

function setPixelRatio(){
  if (window.devicePixelRatio > 2){
    renderer.setPixelRatio( window.devicePixelRatio / 2 );
  } else {
    renderer.setPixelRatio( window.devicePixelRatio );
  }
};

function onWindowResize() {
  container = document.getElementById('container');
  var aspect = $(container).width() / $(container).height();
  camera.aspect = aspect;
  camera.left   = - frustumSize * aspect / 2;
  camera.right  =   frustumSize * aspect / 2;
  camera.top    =   frustumSize / 2;
  camera.bottom = - frustumSize / 2;
  camera.updateProjectionMatrix();
  renderer.setSize($(container).width(), $(container).height());
};

function isMobileDevice() {
  let check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function mobileUI(){
  if (isMobileDevice() == true){
    console.log('mobile client');
    var buttons = document.getElementById('buttonBar');
    var text = document.getElementById('workstyleInfo');
    document.getElementById('footer').appendChild(buttons);
    document.getElementById('footer').appendChild(text);
  } else {
    document.getElementById('right-half').style.display = 'flex';
    document.getElementById('footer').style.display = 'none';
    document.getElementById('header').style.display = 'none';

    var buttons = document.getElementById('buttonBar');
    document.getElementById('posSelector').appendChild(buttons);
    console.log('desktop client');
  }
};

document.addEventListener("keypress", function(e) {
  if (e.keyCode === 13) {
    toggleFullScreen();
  }
}, false);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen(); 
    }
  }
}


// 05____Position Selector //

var scenePos = [];
var scenePosNames = [];
var scenePosText = [];
var count = 0;

for (i = 0; i < workSettingText.length; i++){
  scenePos.push(new THREE.Vector3(workSettingText[i].pos[0],workSettingText[i].pos[1],workSettingText[i].pos[2]))
  scenePosNames.push(workSettingText[i].name);
  scenePosText.push(workSettingText[i].text);
};

// var scenePos = [pos1, pos2, pos3, pos4];
// workSettingText
// var scenePosNames = ["Magnet", "Matrix", "Mutual", "Mentor"];
// console.log(scenePos.length%(count+1));

document.getElementById('previous').addEventListener('click', prevImage, false);
document.getElementById('next').addEventListener('click', nextImage, false);
document.getElementById('imageRef').innerHTML = "<h3>" + scenePosNames[count] + "</h3>";
document.getElementById('posText').innerHTML = "<p>" + scenePosText[count] + "</p>";

function prevImage(){
  var vals = { y: scenePos[count].y, x: scenePos[count].x }; // Start at (0, 0)
  count--;
  if (count <= 0){
    count = scenePos.length-1;
  };
  var tweenMoveScene = new TWEEN.Tween(vals) // Create a new tween that modifies 'vals'.
  tweenMoveScene.to({ y: scenePos[count].y, x: scenePos[count].x }, 500) // Move to (300, 200) in 1 second.
  tweenMoveScene.easing(TWEEN.Easing.Quadratic.InOut);
  tweenMoveScene.delay(0);
  tweenMoveScene.start(); // Start the tween immediately.
  tweenMoveScene.onUpdate(function(object) {
    scene.getObjectByName( "Scene" ).position.z = vals.y;
    scene.getObjectByName( "Scene" ).position.x = vals.x;
  });
  document.getElementById('imageRef').innerHTML = "<h3>" + scenePosNames[count] + "</h3>";
  document.getElementById('posText').innerHTML = "<p>" + scenePosText[count] + "</p>";
  controls.update();
};

function nextImage(){
  var vals = { y: scenePos[count].y, x: scenePos[count].x }; // Start at (0, 0)
  count++;
  if (count >= scenePos.length){
    count = 0;
  };
  console.log(count);
  var tweenMoveScene = new TWEEN.Tween(vals) // Create a new tween that modifies 'vals'.
  tweenMoveScene.to({ y: scenePos[count].y, x: scenePos[count].x }, 500) // Move to (300, 200) in 1 second.
  tweenMoveScene.easing(TWEEN.Easing.Quadratic.InOut);
  tweenMoveScene.delay(0);
  tweenMoveScene.start(); // Start the tween immediately.
  tweenMoveScene.onUpdate(function(object) {
    scene.getObjectByName( "Scene" ).position.z = vals.y;
    scene.getObjectByName( "Scene" ).position.x = vals.x;
  });
  document.getElementById('imageRef').innerHTML = "<h3>" + scenePosNames[count] + "</h3>";
  document.getElementById('posText').innerHTML = "<p>" + scenePosText[count] + "</p>";
  controls.update();
}

function map_range(value, low1, high1, low2, high2) {
    return low2 + (high2 - low2) * (value - low1) / (high1 - low1);
};